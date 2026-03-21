import { Elysia, t } from 'elysia';
import {
    adjustInventory,
    listInventoryStocks,
    listLowStockInventory,
    restockInventory,
} from '../../application/services/inventory.service';
import { authenticateUser, type AuthUser } from '../middleware/auth';

// Helper to check stock view permission (ADMIN and SUPERADMIN)
const canViewStock = (user: AuthUser): boolean => {
    return user.role === 'ADMIN' || user.role === 'SUPERADMIN';
};

export const inventoryRoutes = new Elysia({ prefix: '/inventory' })
    // View stock - ADMIN and SUPERADMIN only
    .get('/', async ({ headers, set }) => {
        const user = await authenticateUser(headers);
        if (!canViewStock(user)) {
            set.status = 403;
            return { error: 'You do not have permission to view stock' };
        }
        return listInventoryStocks();
    })
    .get('/low-stock', async ({ headers, set }) => {
        const user = await authenticateUser(headers);
        if (!canViewStock(user)) {
            set.status = 403;
            return { error: 'You do not have permission to view stock' };
        }
        return listLowStockInventory();
    })
    // Restock - SUPERADMIN only
    .post(
        '/restock',
        async ({ body, headers, set }) => {
            const user = await authenticateUser(headers);
            if (user.role !== 'SUPERADMIN') {
                set.status = 403;
                return { error: 'Only SUPERADMIN can restock inventory' };
            }
            return restockInventory({ ...body, userId: user.id });
        },
        {
            body: t.Object({
                productId: t.String(),
                quantity: t.Number({ minimum: 1 }),
            }),
        }
    )
    // Adjust inventory - SUPERADMIN only
    .post(
        '/adjust',
        async ({ body, headers, set }) => {
            const user = await authenticateUser(headers);
            if (user.role !== 'SUPERADMIN') {
                set.status = 403;
                return { error: 'Only SUPERADMIN can adjust inventory' };
            }
            return adjustInventory({ ...body, userId: user.id });
        },
        {
            body: t.Object({
                productId: t.String(),
                quantity: t.Number({ minimum: 0 }),
                reason: t.String({ minLength: 3 }),
            }),
        }
    );
