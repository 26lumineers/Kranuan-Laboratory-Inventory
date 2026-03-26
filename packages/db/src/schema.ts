import { pgEnum, pgTable, uuid, varchar, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['SUPERADMIN', 'ADMIN', 'GENERAL']);

// Order status enum
export const orderStatusEnum = pgEnum('order_status', [
    'PENDING',      // Order placed, waiting for review
    'APPROVED',     // Approved by admin/superadmin
    'REJECTED',     // Rejected by admin/superadmin
    'FULFILLED',    // Items delivered to user
    'CANCELLED',    // Cancelled by user or admin
]);

// Invoice status enum
export const invoiceStatusEnum = pgEnum('invoice_status', [
    'PENDING',      // Invoice created, waiting for review
    'APPROVED',     // Approved by admin/superadmin
    'REJECTED',     // Rejected by admin/superadmin
    'SUCCESS',      // Invoice completed/fulfilled
]);

// Product category enum - matches room categories
export const productCategoryEnum = pgEnum('product_category', [
    'CHEMICAL_CLINIC',    // เคมีคลินิก
    'IMMUNOLOGY',         // ภูมิคุ้มกันวิทยา
    'HEMATOLOGY',         // โลหิตวิทยา
    'MICROSCOPIC',        // จุลทรรศนศาสตร์
    'BLOOD_BANK',         // ธนาคารเลือด
    'MICRO_BIOLOGY',      // จุลชีววิทยา
    'SUB_STOCKS',         // คลังย่อยกลุ่มงาน
]);

export const rooms = pgTable('rooms', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable(
    'users',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        username: varchar('username', { length: 100 }).notNull().unique(),
        password: varchar('password', { length: 255 }).notNull(),
        fullName: varchar('full_name', { length: 150 }).notNull(),
        nickname: varchar('nickname', { length: 100 }),
        role: userRoleEnum('role').notNull(),
        roomId: uuid('room_id').references(() => rooms.id),
        isActive: boolean('is_active').default(true),
        createdAt: timestamp('created_at').defaultNow(),
        deletedAt: timestamp('deleted_at'), // Soft delete - null means not deleted
    },
    (table) => ({
        roomIdx: index('idx_users_room').on(table.roomId),
        roleIdx: index('idx_users_role').on(table.role),
        usernameIdx: index('idx_users_username').on(table.username),
        deletedAtIdx: index('idx_users_deleted_at').on(table.deletedAt),
    })
);

export const products = pgTable(
    'products',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        name: varchar('name', { length: 200 }).notNull(),
        unit: varchar('unit', { length: 50 }).notNull(),
        category: productCategoryEnum('category').notNull(),
        description: text('description'),
        lowStockThreshold: integer('low_stock_threshold').default(0),
        isActive: boolean('is_active').default(true),
        createdAt: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        categoryIdx: index('idx_products_category').on(table.category),
    })
);

export const inventoryStocks = pgTable('inventory_stocks', {
    productId: uuid('product_id')
        .primaryKey()
        .references(() => products.id),
    quantity: integer('quantity').notNull(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const inventoryTransactions = pgTable(
    'inventory_transactions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id),
        roomId: uuid('room_id')
            .notNull()
            .references(() => rooms.id),
        note: text('note'),
        createdAt: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        userIdx: index('idx_tx_user').on(table.userId),
        roomIdx: index('idx_tx_room').on(table.roomId),
    })
);

export const inventoryTransactionItems = pgTable(
    'inventory_transaction_items',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        transactionId: uuid('transaction_id')
            .notNull()
            .references(() => inventoryTransactions.id, { onDelete: 'cascade' }),
        productId: uuid('product_id')
            .notNull()
            .references(() => products.id),
        quantity: integer('quantity').notNull(),
    },
    (table) => ({
        txIdx: index('idx_tx_items_tx').on(table.transactionId),
    })
);

export const inventoryMovements = pgTable(
    'inventory_movements',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        productId: uuid('product_id')
            .notNull()
            .references(() => products.id),
        quantity: integer('quantity').notNull(),
        movementType: varchar('movement_type', { length: 20 }).notNull(),
        referenceTransaction: uuid('reference_transaction'),
        createdBy: uuid('created_by').references(() => users.id),
        createdAt: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        productIdx: index('idx_movements_product').on(table.productId),
    })
);

export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 50 }).notNull(), // 'LOW_STOCK', 'NEW_ORDER', 'ORDER_STATUS', etc.
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    data: text('data'), // JSON string for additional data
    isRead: boolean('is_read').default(false),
    targetRoles: varchar('target_roles', { length: 100 }), // Comma-separated roles: 'SUPERADMIN,ADMIN'
    productId: uuid('product_id').references(() => products.id), // Related product if applicable
    orderId: uuid('order_id').references(() => orders.id), // Related order if applicable
    createdAt: timestamp('created_at').defaultNow(),
});

// =====================
// SYSTEM CONFIGURATION
// =====================

// System configuration table - stores system-wide settings
export const systemConfig = pgTable('system_config', {
    key: varchar('key', { length: 100 }).primaryKey(),
    value: text('value').notNull(),
    description: text('description'),
    category: varchar('category', { length: 50 }).default('general'), // 'inventory', 'notification', 'order', etc.
    updatedAt: timestamp('updated_at').defaultNow(),
    updatedBy: uuid('updated_by').references(() => users.id),
});

// =====================
// ORDERS TABLES
// =====================

// Orders - Main order table for users to order lab items
export const orders = pgTable(
    'orders',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id),
        roomId: uuid('room_id')
            .notNull()
            .references(() => rooms.id),
        status: orderStatusEnum('status').default('PENDING').notNull(),
        note: text('note'), // User's note for the order
        adminNote: text('admin_note'), // Admin's note when approving/rejecting
        reviewedBy: uuid('reviewed_by').references(() => users.id), // Who reviewed the order
        reviewedAt: timestamp('reviewed_at'), // When the order was reviewed
        fulfilledBy: uuid('fulfilled_by').references(() => users.id), // Who fulfilled the order
        fulfilledAt: timestamp('fulfilled_at'), // When the order was fulfilled
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => ({
        userIdx: index('idx_orders_user').on(table.userId),
        roomIdx: index('idx_orders_room').on(table.roomId),
        statusIdx: index('idx_orders_status').on(table.status),
        createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
    })
);

// Order Items - Individual items within an order
export const orderItems = pgTable(
    'order_items',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        orderId: uuid('order_id')
            .notNull()
            .references(() => orders.id, { onDelete: 'cascade' }),
        productId: uuid('product_id')
            .notNull()
            .references(() => products.id),
        quantity: integer('quantity').notNull(),
        fulfilledQuantity: integer('fulfilled_quantity').default(0), // How many were actually provided
        note: text('note'), // Note for specific item
    },
    (table) => ({
        orderIdx: index('idx_order_items_order').on(table.orderId),
        productIdx: index('idx_order_items_product').on(table.productId),
    })
);

// =====================
// INVOICES TABLES
// =====================

// Invoices - Main invoice table for laboratory requests
export const invoices = pgTable(
    'invoices',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
        description: text('description'),
        status: invoiceStatusEnum('status').default('PENDING').notNull(),
        createdBy: uuid('created_by')
            .notNull()
            .references(() => users.id),
        note: text('note'),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => ({
        createdByIdx: index('idx_invoices_created_by').on(table.createdBy),
        statusIdx: index('idx_invoices_status').on(table.status),
        createdAtIdx: index('idx_invoices_created_at').on(table.createdAt),
    })
);

// Invoice Items - Individual items within an invoice
export const invoiceItems = pgTable(
    'invoice_items',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        invoiceId: uuid('invoice_id')
            .notNull()
            .references(() => invoices.id, { onDelete: 'cascade' }),
        productId: uuid('product_id')
            .notNull()
            .references(() => products.id),
        quantity: integer('quantity').notNull(),
        createdAt: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        invoiceIdx: index('idx_invoice_items_invoice').on(table.invoiceId),
        productIdx: index('idx_invoice_items_product').on(table.productId),
    })
);

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type InventoryStock = typeof inventoryStocks.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert;
export type InventoryTransactionItem = typeof inventoryTransactionItems.$inferSelect;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type NewSystemConfig = typeof systemConfig.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

// Table singleton for Elysia-Drizzle integration
export const table = {
    rooms,
    users,
    products,
    inventoryStocks,
    inventoryTransactions,
    inventoryTransactionItems,
    inventoryMovements,
    notifications,
    systemConfig,
    orders,
    orderItems,
    invoices,
    invoiceItems,
} as const;

export type Table = typeof table;
