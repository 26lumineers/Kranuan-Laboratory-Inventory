import { Elysia, t } from 'elysia';
import { db, notifications } from '@laboratory/db';
import { eq, desc } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth';

export const notificationRoutes = new Elysia({ prefix: '/notifications' })
    // List notifications - ADMIN and SUPERADMIN only
    .get('/', async ({ headers, set }) => {
        const user = await authenticateUser(headers);
        if (user.role === 'GENERAL') {
            set.status = 403;
            return { error: 'You do not have permission to view notifications' };
        }
        const result = await db
            .select()
            .from(notifications)
            .orderBy(desc(notifications.createdAt));
        return result;
    })
    .get('/unread', async ({ headers, set }) => {
        const user = await authenticateUser(headers);
        if (user.role === 'GENERAL') {
            set.status = 403;
            return { error: 'You do not have permission to view notifications' };
        }
        const result = await db
            .select()
            .from(notifications)
            .orderBy(desc(notifications.createdAt))
            .limit(50);
        return result;
    })
    .delete('/:id', async ({ params, headers, set }) => {
        const user = await authenticateUser(headers);
        if (user.role !== 'SUPERADMIN') {
            set.status = 403;
            return { error: 'Only SUPERADMIN can delete notifications' };
        }
        const existing = await db
            .select()
            .from(notifications)
            .where(eq(notifications.id, params.id));

        if (!existing[0]) {
            set.status = 404;
            return { error: 'Notification not found' };
        }

        await db.delete(notifications).where(eq(notifications.id, params.id));
        return { success: true };
    })
    .delete('/', async ({ headers, set }) => {
        const user = await authenticateUser(headers);
        if (user.role !== 'SUPERADMIN') {
            set.status = 403;
            return { error: 'Only SUPERADMIN can clear all notifications' };
        }
        await db.delete(notifications);
        return { success: true };
    });
