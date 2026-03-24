import { Elysia, t } from 'elysia';
import { db, notifications } from '@laboratory/db';
import { eq, desc } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth';

export const notificationRoutes = new Elysia({ prefix: '/notifications' })
    // List notifications - ADMIN and SUPERADMIN only
    .get('/', async ({ headers, status }) => {
        const user = await authenticateUser(headers);
        if (user.role === 'GENERAL') {
            return status(403, { error: 'You do not have permission to view notifications' });
        }
        const result = await db
            .select()
            .from(notifications)
            .orderBy(desc(notifications.createdAt));
        return result;
    })
    // Get unread notifications - ADMIN and SUPERADMIN only
    .get('/unread', async ({ headers, status }) => {
        const user = await authenticateUser(headers);
        if (user.role === 'GENERAL') {
            return status(403, { error: 'You do not have permission to view notifications' });
        }
        const result = await db
            .select()
            .from(notifications)
            .orderBy(desc(notifications.createdAt))
            .limit(50);
        return result;
    })
    // Delete notification - SUPERADMIN only
    .delete('/:id', async ({ params, headers, status }) => {
        const user = await authenticateUser(headers);
        if (user.role !== 'SUPERADMIN') {
            return status(403, { error: 'Only SUPERADMIN can delete notifications' });
        }
        const existing = await db
            .select()
            .from(notifications)
            .where(eq(notifications.id, params.id));

        if (!existing[0]) {
            return status(404, { error: 'Notification not found' });
        }

        await db.delete(notifications).where(eq(notifications.id, params.id));
        return { success: true };
    })
    // Clear all notifications - SUPERADMIN only
    .delete('/', async ({ headers, status }) => {
        const user = await authenticateUser(headers);
        if (user.role !== 'SUPERADMIN') {
            return status(403, { error: 'Only SUPERADMIN can clear all notifications' });
        }
        await db.delete(notifications);
        return { success: true };
    });
