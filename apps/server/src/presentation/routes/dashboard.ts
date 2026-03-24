import { Elysia, t } from 'elysia';
import { authenticateUser } from '../middleware/auth';
import {
    getDashboardData,
    getDashboardStats,
    getStockRatioItems,
    getOutOfStockItems,
    getStockSummaryByStatus,
} from '../../application/services/dashboard.service';

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
    // Get full dashboard data - ADMIN and SUPERADMIN only
    .get('/', async ({ headers, status }) => {
        const user = await authenticateUser(headers);

        if (user.role === 'GENERAL') {
            return status(403, { error: 'You do not have permission to view dashboard' });
        }

        return getDashboardData();
    })
    // Get dashboard statistics only
    .get('/stats', async ({ headers, status }) => {
        const user = await authenticateUser(headers);

        if (user.role === 'GENERAL') {
            return status(403, { error: 'You do not have permission to view dashboard stats' });
        }

        return getDashboardStats();
    })
    // Get stock ratio items (items going out of stock with percentage)
    .get('/stock-ratio', async ({ headers, status, query }) => {
        const user = await authenticateUser(headers);

        if (user.role === 'GENERAL') {
            return status(403, { error: 'You do not have permission to view stock ratio' });
        }

        const items = await getStockRatioItems();

        if (query.status) {
            return items.filter((item) => item.status === query.status);
        }

        return items;
    }, {
        query: t.Object({
            status: t.Optional(t.Union([
                t.Literal('healthy'),
                t.Literal('warning'),
                t.Literal('critical'),
                t.Literal('out_of_stock'),
            ])),
        }),
    })
    // Get out of stock items
    .get('/out-of-stock', async ({ headers, status }) => {
        const user = await authenticateUser(headers);

        if (user.role === 'GENERAL') {
            return status(403, { error: 'You do not have permission to view out of stock items' });
        }

        return getOutOfStockItems();
    })
    // Get stock summary by status (counts)
    .get('/stock-summary', async ({ headers, status }) => {
        const user = await authenticateUser(headers);

        if (user.role === 'GENERAL') {
            return status(403, { error: 'You do not have permission to view stock summary' });
        }

        return getStockSummaryByStatus();
    });
