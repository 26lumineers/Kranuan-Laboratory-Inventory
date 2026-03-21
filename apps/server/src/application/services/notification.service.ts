import { db, notifications, systemConfig, products, inventoryStocks } from '@laboratory/db';
import { eq, and, isNull, lt } from 'drizzle-orm';

// Default system configuration values
export const DEFAULT_CONFIG = {
    // Inventory settings
    LOW_STOCK_THRESHOLD: '10', // Default low stock threshold
    ENABLE_LOW_STOCK_ALERTS: 'true',
    LOW_STOCK_ALERT_ROLES: 'SUPERADMIN,ADMIN',

    // Order settings
    AUTO_DEDUCT_STOCK_ON_ORDER: 'true', // Automatically deduct stock when order is placed
    NEW_ORDER_ALERT_ROLES: 'SUPERADMIN,ADMIN',
    ORDER_STATUS_ALERT_ROLES: 'SUPERADMIN,ADMIN',

    // Notification settings
    NOTIFICATION_RETENTION_DAYS: '30', // Days to keep notifications before cleanup
} as const;

/**
 * Get a system configuration value
 */
export async function getConfig(key: keyof typeof DEFAULT_CONFIG | string): Promise<string> {
    const [config] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, key));

    return config?.value ?? DEFAULT_CONFIG[key as keyof typeof DEFAULT_CONFIG] ?? '';
}

/**
 * Set a system configuration value
 */
export async function setConfig(
    key: string,
    value: string,
    userId: string,
    description?: string,
    category?: string
): Promise<void> {
    await db
        .insert(systemConfig)
        .values({
            key,
            value,
            description,
            category,
            updatedBy: userId,
        })
        .onConflictDoUpdate({
            target: systemConfig.key,
            set: {
                value,
                description,
                category,
                updatedAt: new Date(),
                updatedBy: userId,
            },
        });
}

/**
 * Get all configurations by category
 */
export async function getConfigsByCategory(category: string) {
    return db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.category, category));
}

/**
 * Get all configurations
 */
export async function getAllConfigs() {
    return db.select().from(systemConfig);
}

/**
 * Create a notification
 */
export async function createNotification(payload: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    targetRoles?: string[];
    productId?: string;
    orderId?: string;
}): Promise<void> {
    await db.insert(notifications).values({
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data ? JSON.stringify(payload.data) : null,
        targetRoles: payload.targetRoles?.join(',') || null,
        productId: payload.productId,
        orderId: payload.orderId,
    });
}

/**
 * Get notifications for a user based on their role
 */
export async function getNotificationsForUser(
    role: 'SUPERADMIN' | 'ADMIN' | 'GENERAL',
    options?: {
        unreadOnly?: boolean;
        limit?: number;
    }
) {
    const conditions = [isNull(notifications.productId)];

    if (options?.unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
    }

    const allNotifications = await db
        .select({
            id: notifications.id,
            type: notifications.type,
            title: notifications.title,
            message: notifications.message,
            data: notifications.data,
            isRead: notifications.isRead,
            targetRoles: notifications.targetRoles,
            productId: notifications.productId,
            orderId: notifications.orderId,
            createdAt: notifications.createdAt,
            product: {
                id: products.id,
                name: products.name,
                unit: products.unit,
            },
        })
        .from(notifications)
        .leftJoin(products, eq(notifications.productId, products.id))
        .orderBy(notifications.createdAt)
        .limit(options?.limit ?? 50);

    // Filter by role
    return allNotifications.filter((n) => {
        if (!n.targetRoles) return true;
        const targetRoles = n.targetRoles.split(',');
        return targetRoles.includes(role);
    });
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
    await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));
}

/**
 * Mark all notifications as read for a role
 */
export async function markAllNotificationsRead(role: string): Promise<void> {
    const allNotifications = await db.select().from(notifications);

    for (const n of allNotifications) {
        if (n.targetRoles) {
            const targetRoles = n.targetRoles.split(',');
            if (targetRoles.includes(role)) {
                await db
                    .update(notifications)
                    .set({ isRead: true })
                    .where(eq(notifications.id, n.id));
            }
        }
    }
}

/**
 * Check and create low stock notifications
 */
export async function checkLowStockAndNotify(): Promise<void> {
    const alertsEnabled = (await getConfig('ENABLE_LOW_STOCK_ALERTS')) === 'true';
    if (!alertsEnabled) return;

    const defaultThreshold = parseInt(await getConfig('LOW_STOCK_THRESHOLD')) || 10;
    const targetRoles = (await getConfig('LOW_STOCK_ALERT_ROLES')).split(',');

    // Get all products with their stock
    const lowStockItems = await db
        .select({
            productId: products.id,
            productName: products.name,
            productUnit: products.unit,
            threshold: products.lowStockThreshold,
            quantity: inventoryStocks.quantity,
        })
        .from(products)
        .leftJoin(inventoryStocks, eq(products.id, inventoryStocks.productId))
        .where(
            and(
                eq(products.isActive, true),
                lt(
                    inventoryStocks.quantity,
                    products.lowStockThreshold ?? defaultThreshold
                )
            )
        );

    // Create notification for each low stock item
    for (const item of lowStockItems) {
        const threshold = item.threshold ?? defaultThreshold;

        // Check if notification already exists for this product (unread)
        const [existing] = await db
            .select()
            .from(notifications)
            .where(
                and(
                    eq(notifications.productId, item.productId),
                    eq(notifications.type, 'LOW_STOCK'),
                    eq(notifications.isRead, false)
                )
            );

        if (!existing) {
            await createNotification({
                type: 'LOW_STOCK',
                title: 'Low Stock Alert',
                message: `${item.productName} is running low. Current: ${item.quantity ?? 0} ${item.productUnit}, Threshold: ${threshold}`,
                targetRoles,
                productId: item.productId,
                data: {
                    productId: item.productId,
                    currentQuantity: item.quantity ?? 0,
                    threshold,
                },
            });
        }
    }
}

/**
 * Create new order notification
 */
export async function notifyNewOrder(
    orderId: string,
    orderNumber: string,
    userName: string,
    roomName: string
): Promise<void> {
    const targetRoles = (await getConfig('NEW_ORDER_ALERT_ROLES')).split(',');

    await createNotification({
        type: 'NEW_ORDER',
        title: 'New Order Received',
        message: `New order ${orderNumber} from ${userName} (${roomName})`,
        targetRoles,
        orderId,
        data: {
            orderNumber,
            userName,
            roomName,
        },
    });
}

/**
 * Create order status change notification
 */
export async function notifyOrderStatusChange(
    orderId: string,
    orderNumber: string,
    newStatus: string,
    userId: string
): Promise<void> {
    const targetRoles = (await getConfig('ORDER_STATUS_ALERT_ROLES')).split(',');

    await createNotification({
        type: 'ORDER_STATUS',
        title: 'Order Status Updated',
        message: `Order ${orderNumber} has been ${newStatus.toLowerCase()}`,
        targetRoles,
        orderId,
        data: {
            orderNumber,
            newStatus,
        },
    });
}

/**
 * Initialize default configurations
 */
export async function initializeDefaultConfigs(): Promise<void> {
    const existingConfigs = await db.select().from(systemConfig);

    if (existingConfigs.length === 0) {
        const defaultConfigs = Object.entries(DEFAULT_CONFIG).map(([key, value]) => ({
            key,
            value,
            description: `Default ${key.replace(/_/g, ' ').toLowerCase()}`,
            category: key.includes('STOCK') ? 'inventory' :
                     key.includes('ORDER') ? 'order' :
                     key.includes('NOTIFICATION') ? 'notification' : 'general',
        }));

        for (const config of defaultConfigs) {
            await db.insert(systemConfig).values(config);
        }
    }
}
