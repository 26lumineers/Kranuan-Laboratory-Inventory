import { pgEnum, pgTable, uuid, varchar, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['SUPERADMIN', 'ADMIN', 'GENERAL']);

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
        fullName: varchar('full_name', { length: 150 }).notNull(),
        nickname: varchar('nickname', { length: 100 }),
        role: userRoleEnum('role').notNull(),
        roomId: uuid('room_id').references(() => rooms.id),
        isActive: boolean('is_active').default(true),
        createdAt: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        roomIdx: index('idx_users_room').on(table.roomId),
        roleIdx: index('idx_users_role').on(table.role),
    })
);

export const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    description: text('description'),
    lowStockThreshold: integer('low_stock_threshold').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

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
    title: varchar('title', { length: 255 }),
    message: text('message'),
    createdAt: timestamp('created_at').defaultNow(),
});

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
