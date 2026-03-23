import { table } from './schema';
import { spreads } from './utils';

export const model = {
    insert: spreads(
        {
            rooms: table.rooms,
            users: table.users,
            products: table.products,
            inventoryStocks: table.inventoryStocks,
            inventoryTransactions: table.inventoryTransactions,
            inventoryTransactionItems: table.inventoryTransactionItems,
            inventoryMovements: table.inventoryMovements,
            notifications: table.notifications,
            systemConfig: table.systemConfig,
            orders: table.orders,
            orderItems: table.orderItems,
        },
        'insert'
    ),
    select: spreads(
        {
            rooms: table.rooms,
            users: table.users,
            products: table.products,
            inventoryStocks: table.inventoryStocks,
            inventoryTransactions: table.inventoryTransactions,
            inventoryTransactionItems: table.inventoryTransactionItems,
            inventoryMovements: table.inventoryMovements,
            notifications: table.notifications,
            systemConfig: table.systemConfig,
            orders: table.orders,
            orderItems: table.orderItems,
        },
        'select'
    ),
} as const;
