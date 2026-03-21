import { Elysia, t } from 'elysia';
import { db, notifications } from '@laboratory/db';
import { eq, desc } from 'drizzle-orm';

export const notificationRoutes = new Elysia({ prefix: '/notifications' })
    .get('/', async () => {
        const result = await db
            .select()
            .from(notifications)
            .orderBy(desc(notifications.createdAt));
        return result;
    })
    .get('/unread', async () => {
        const result = await db
            .select()
            .from(notifications)
            .orderBy(desc(notifications.createdAt))
            .limit(50);
        return result;
    })
    .delete('/:id', async ({ params, set }) => {
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
    .delete('/', async () => {
        await db.delete(notifications);
        return { success: true };
    });
