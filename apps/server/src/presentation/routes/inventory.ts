import { Elysia, t } from 'elysia';
import { USER_ROLES } from '@laboratory/shared';
import {
    adjustInventory,
    listInventoryStocks,
    listInventoryStocksForGeneral,
    listLowStockInventory,
    restockInventory,
} from '../../application/services/inventory.service';
import { authenticateUser, type AuthUser } from '../middleware/auth';

// Helper to check stock view permission (ADMIN and SUPERADMIN only)
const isAdminTier = (user: AuthUser): boolean => {
    return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPERADMIN;
};

export const inventoryRoutes = new Elysia({ prefix: '/inventory' })
    // View stock - ADMIN and SUPERADMIN only
    .get('/', async ({ headers, status }) => {
        const user = await authenticateUser(headers);
        if (!isAdminTier(user)) {
            return status(403, { error: 'You do not have permission to view stock' });
        }
        return listInventoryStocks();
    })
    // View stock for GENERAL - no quantity field
    .get('/general', async ({ headers }) => {
        const user = await authenticateUser(headers);
        console.log(JSON.stringify({ timestamp: new Date().toISOString(), action: 'listInventoryStocksForGeneral', userId: user.id, role: user.role }));
        return listInventoryStocksForGeneral();
    })
    .get('/low-stock', async ({ headers, status }) => {
        const user = await authenticateUser(headers);
        if (!isAdminTier(user)) {
            return status(403, { error: 'You do not have permission to view stock' });
        }
        return listLowStockInventory();
    })
    // Restock - SUPERADMIN only
    .post(
        '/restock',
        async ({ body, headers, status }) => {
            const user = await authenticateUser(headers);
            if (user.role !== USER_ROLES.SUPERADMIN) {
                return status(403, { error: 'Only SUPERADMIN can restock inventory' });
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
        async ({ body, headers, status }) => {
            const user = await authenticateUser(headers);
            if (user.role !== USER_ROLES.SUPERADMIN) {
                return status(403, { error: 'Only SUPERADMIN can adjust inventory' });
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
