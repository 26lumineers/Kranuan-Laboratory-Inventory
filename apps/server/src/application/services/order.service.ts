import { db, orders, orderItems, products, inventoryStocks, inventoryMovements, users, rooms } from '@laboratory/db';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { getConfig, checkLowStockAndNotify, notifyNewOrder, notifyOrderStatusChange } from './notification.service';

export type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED';

export interface CreateOrderPayload {
    userId: string;
    roomId: string;
    note?: string;
    items: Array<{
        productId: string;
        quantity: number;
        note?: string;
    }>;
}

export interface UpdateOrderPayload {
    status?: OrderStatus;
    note?: string;
    adminNote?: string;
}

export interface OrderWithItems {
    id: string;
    orderNumber: string;
    userId: string;
    roomId: string;
    status: OrderStatus;
    note: string | null;
    adminNote: string | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    fulfilledBy: string | null;
    fulfilledAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    items: Array<{
        id: string;
        productId: string;
        productName: string | null;
        productUnit: string | null;
        quantity: number;
        fulfilledQuantity: number | null;
        note: string | null;
    }>;
    user?: {
        id: string;
        fullName: string;
        username: string;
    } | null;
    room?: {
        id: string;
        name: string;
    } | null;
}

/**
 * Generate a unique order number
 */
function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

/**
 * Deduct stock for order items and record movements
 */
async function deductStockForOrder(
    tx: any,
    orderId: string,
    items: Array<{ productId: string; quantity: number }>,
    userId: string
): Promise<void> {
    for (const item of items) {
        // Get current stock with lock
        const [stock] = await tx
            .select()
            .from(inventoryStocks)
            .where(eq(inventoryStocks.productId, item.productId))
            .for('update');

        if (!stock) {
            throw new Error(`No stock found for product ${item.productId}`);
        }

        if (stock.quantity < item.quantity) {
            // Get product name for better error message
            const [product] = await tx
                .select({ name: products.name })
                .from(products)
                .where(eq(products.id, item.productId));
            throw new Error(`Insufficient stock for ${product?.name || item.productId}. Available: ${stock.quantity}, Requested: ${item.quantity}`);
        }

        // Deduct from inventory
        await tx
            .update(inventoryStocks)
            .set({
                quantity: stock.quantity - item.quantity,
                updatedAt: new Date(),
            })
            .where(eq(inventoryStocks.productId, item.productId));

        // Record inventory movement
        await tx.insert(inventoryMovements).values({
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            referenceTransaction: orderId,
            createdBy: userId,
        });
    }
}

/**
 * Create a new order - automatically deducts stock based on configuration
 */
export async function createOrder(payload: CreateOrderPayload): Promise<OrderWithItems> {
    const orderNumber = generateOrderNumber();

    // Check if auto-deduct is enabled
    const autoDeduct = (await getConfig('AUTO_DEDUCT_STOCK_ON_ORDER')) === 'true';

    return await db.transaction(async (tx) => {
        // Create the order
        const [order] = await tx
            .insert(orders)
            .values({
                orderNumber,
                userId: payload.userId,
                roomId: payload.roomId,
                note: payload.note,
                status: autoDeduct ? 'APPROVED' : 'PENDING', // Auto-approve if auto-deducting
            })
            .returning();

        // Create order items
        const orderItemsData = payload.items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            note: item.note,
            fulfilledQuantity: 0,
        }));

        const createdItems = await tx.insert(orderItems).values(orderItemsData).returning();

        // Fetch product details for response
        const productIds = payload.items.map((item) => item.productId);
        const productList = await tx
            .select({
                id: products.id,
                name: products.name,
                unit: products.unit,
            })
            .from(products)
            .where(inArray(products.id, productIds));

        const productMap = new Map(productList.map((p) => [p.id, p]));

        // Auto-deduct stock if enabled
        if (autoDeduct) {
            await deductStockForOrder(tx, order.id, payload.items, payload.userId);

            // Update fulfilled quantity to match ordered quantity
            for (const item of createdItems) {
                await tx
                    .update(orderItems)
                    .set({ fulfilledQuantity: item.quantity })
                    .where(eq(orderItems.id, item.id));
            }

            // Mark order as fulfilled
            await tx
                .update(orders)
                .set({
                    status: 'FULFILLED',
                    fulfilledBy: payload.userId,
                    fulfilledAt: new Date(),
                })
                .where(eq(orders.id, order.id));
        }

        // Get user and room info for notification
        const [userInfo] = await tx
            .select({ fullName: users.fullName })
            .from(users)
            .where(eq(users.id, payload.userId));

        const [roomInfo] = await tx
            .select({ name: rooms.name })
            .from(rooms)
            .where(eq(rooms.id, payload.roomId));

        // Send new order notification (runs in background)
        notifyNewOrder(order.id, orderNumber, userInfo?.fullName || 'Unknown', roomInfo?.name || 'Unknown')
            .catch(console.error);

        // Check for low stock and notify (runs in background)
        checkLowStockAndNotify().catch(console.error);

        return {
            ...order,
            status: autoDeduct ? 'FULFILLED' : order.status,
            items: createdItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                productName: productMap.get(item.productId)?.name || 'Unknown',
                productUnit: productMap.get(item.productId)?.unit || 'Unknown',
                quantity: item.quantity,
                fulfilledQuantity: autoDeduct ? item.quantity : 0,
                note: item.note,
            })),
        };
    });
}

/**
 * Get all orders (with filtering)
 */
export async function getOrders(options?: {
    userId?: string;
    roomId?: string;
    status?: OrderStatus;
    includeDeleted?: boolean;
}): Promise<OrderWithItems[]> {
    const conditions: any[] = [];

    if (options?.userId) {
        conditions.push(eq(orders.userId, options.userId));
    }
    if (options?.roomId) {
        conditions.push(eq(orders.roomId, options.roomId));
    }
    if (options?.status) {
        conditions.push(eq(orders.status, options.status));
    }

    const orderList = await db
        .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            userId: orders.userId,
            roomId: orders.roomId,
            status: orders.status,
            note: orders.note,
            adminNote: orders.adminNote,
            reviewedBy: orders.reviewedBy,
            reviewedAt: orders.reviewedAt,
            fulfilledBy: orders.fulfilledBy,
            fulfilledAt: orders.fulfilledAt,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
            user: {
                id: users.id,
                fullName: users.fullName,
                username: users.username,
            },
            room: {
                id: rooms.id,
                name: rooms.name,
            },
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(rooms, eq(orders.roomId, rooms.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Fetch items for each order
    const orderIds = orderList.map((o) => o.id);
    const allItems = await db
        .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            productName: products.name,
            productUnit: products.unit,
            quantity: orderItems.quantity,
            fulfilledQuantity: orderItems.fulfilledQuantity,
            note: orderItems.note,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orderItems.orderId, orderIds));

    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
        if (!itemsByOrder.has(item.orderId)) {
            itemsByOrder.set(item.orderId, []);
        }
        itemsByOrder.get(item.orderId)!.push(item);
    }

    return orderList.map((order) => ({
        ...order,
        items: itemsByOrder.get(order.id) || [],
    }));
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
    const [order] = await db
        .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            userId: orders.userId,
            roomId: orders.roomId,
            status: orders.status,
            note: orders.note,
            adminNote: orders.adminNote,
            reviewedBy: orders.reviewedBy,
            reviewedAt: orders.reviewedAt,
            fulfilledBy: orders.fulfilledBy,
            fulfilledAt: orders.fulfilledAt,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
            user: {
                id: users.id,
                fullName: users.fullName,
                username: users.username,
            },
            room: {
                id: rooms.id,
                name: rooms.name,
            },
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(rooms, eq(orders.roomId, rooms.id))
        .where(eq(orders.id, orderId));

    if (!order) return null;

    const items = await db
        .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            productName: products.name,
            productUnit: products.unit,
            quantity: orderItems.quantity,
            fulfilledQuantity: orderItems.fulfilledQuantity,
            note: orderItems.note,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderId));

    return {
        ...order,
        items,
    };
}

/**
 * Approve an order (ADMIN/SUPERADMIN only)
 */
export async function approveOrder(orderId: string, reviewerId: string, adminNote?: string): Promise<OrderWithItems> {
    const [order] = await db
        .update(orders)
        .set({
            status: 'APPROVED',
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            adminNote,
            updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

    if (!order) {
        throw new Error('Order not found');
    }

    // Notify about status change
    notifyOrderStatusChange(orderId, order.orderNumber, 'APPROVED', reviewerId).catch(console.error);

    return (await getOrderById(orderId))!;
}

/**
 * Reject an order (ADMIN/SUPERADMIN only)
 */
export async function rejectOrder(orderId: string, reviewerId: string, adminNote?: string): Promise<OrderWithItems> {
    const [order] = await db
        .update(orders)
        .set({
            status: 'REJECTED',
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            adminNote,
            updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

    if (!order) {
        throw new Error('Order not found');
    }

    // Notify about status change
    notifyOrderStatusChange(orderId, order.orderNumber, 'REJECTED', reviewerId).catch(console.error);

    return (await getOrderById(orderId))!;
}

/**
 * Fulfill an order - DEDUCTS INVENTORY (SUPERADMIN only)
 * This is for manual fulfillment when auto-deduct is disabled
 */
export async function fulfillOrder(
    orderId: string,
    fulfillerId: string,
    fulfilledItems?: Array<{ itemId: string; fulfilledQuantity: number }>
): Promise<OrderWithItems> {
    return await db.transaction(async (tx) => {
        // Get order with items
        const order = await getOrderById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status !== 'APPROVED') {
            throw new Error('Order must be approved before fulfillment');
        }

        // Process each item - deduct from inventory
        for (const item of order.items) {
            const fulfilledQty = fulfilledItems?.find((fi) => fi.itemId === item.id)?.fulfilledQuantity ?? item.quantity;

            // Get current stock with lock
            const [stock] = await tx
                .select()
                .from(inventoryStocks)
                .where(eq(inventoryStocks.productId, item.productId))
                .for('update');

            if (!stock) {
                throw new Error(`No stock found for product ${item.productName}`);
            }

            if (stock.quantity < fulfilledQty) {
                throw new Error(`Insufficient stock for ${item.productName}. Available: ${stock.quantity}, Requested: ${fulfilledQty}`);
            }

            // Deduct from inventory
            await tx
                .update(inventoryStocks)
                .set({
                    quantity: stock.quantity - fulfilledQty,
                    updatedAt: new Date(),
                })
                .where(eq(inventoryStocks.productId, item.productId));

            // Record inventory movement
            await tx.insert(inventoryMovements).values({
                productId: item.productId,
                quantity: fulfilledQty,
                movementType: 'OUT',
                referenceTransaction: orderId,
                createdBy: fulfillerId,
            });

            // Update fulfilled quantity on order item
            await tx
                .update(orderItems)
                .set({ fulfilledQuantity: fulfilledQty })
                .where(eq(orderItems.id, item.id));
        }

        // Update order status
        await tx
            .update(orders)
            .set({
                status: 'FULFILLED',
                fulfilledBy: fulfillerId,
                fulfilledAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        // Check for low stock and notify (runs in background)
        checkLowStockAndNotify().catch(console.error);

        // Notify about status change
        notifyOrderStatusChange(orderId, order.orderNumber, 'FULFILLED', fulfillerId).catch(console.error);

        return (await getOrderById(orderId))!;
    });
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string, cancelledBy: string): Promise<OrderWithItems> {
    const order = await getOrderById(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    if (order.status === 'FULFILLED') {
        throw new Error('Cannot cancel a fulfilled order');
    }

    const [updatedOrder] = await db
        .update(orders)
        .set({
            status: 'CANCELLED',
            updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

    // Notify about status change
    notifyOrderStatusChange(orderId, order.orderNumber, 'CANCELLED', cancelledBy).catch(console.error);

    return (await getOrderById(orderId))!;
}

/**
 * Get orders by user ID
 */
export async function getOrdersByUserId(userId: string): Promise<OrderWithItems[]> {
    return getOrders({ userId });
}

/**
 * Get orders by room ID
 */
export async function getOrdersByRoomId(roomId: string): Promise<OrderWithItems[]> {
    return getOrders({ roomId });
}
