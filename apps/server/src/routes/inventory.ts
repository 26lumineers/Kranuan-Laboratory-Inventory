import { Elysia, t } from 'elysia';
import {
    adjustInventory,
    listInventoryStocks,
    listLowStockInventory,
    restockInventory,
} from '../services/inventory-service';

export const inventoryRoutes = new Elysia({ prefix: '/inventory' })
    .get('/', async () => {
        return listInventoryStocks();
    })
    .get('/low-stock', async () => {
        return listLowStockInventory();
    })
    .post(
        '/restock',
        async ({ body }) => {
            return restockInventory(body);
        },
        {
            body: t.Object({
                productId: t.String(),
                quantity: t.Number({ minimum: 1 }),
                userId: t.String(),
            }),
        }
    )
    .post(
        '/adjust',
        async ({ body }) => {
            return adjustInventory(body);
        },
        {
            body: t.Object({
                productId: t.String(),
                quantity: t.Number({ minimum: 0 }),
                reason: t.String({ minLength: 3 }),
                userId: t.String(),
            }),
        }
    );
