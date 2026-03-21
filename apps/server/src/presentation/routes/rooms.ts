import { Elysia, t } from 'elysia';
import { db, rooms, type NewRoom } from '@laboratory/db';
import { eq } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth';

export const roomRoutes = new Elysia({ prefix: '/rooms' })
    // List rooms - All authenticated users
    .get('/', async ({ headers }) => {
        await authenticateUser(headers);
        const result = await db.select().from(rooms);
        return result;
    })
    .get('/:id', async ({ params, headers }) => {
        await authenticateUser(headers);
        const result = await db.select().from(rooms).where(eq(rooms.id, params.id));
        return result[0];
    })
    // Create room - SUPERADMIN only
    .post(
        '/',
        async ({ body, headers, set }) => {
            const user = await authenticateUser(headers);
            if (user.role !== 'SUPERADMIN') {
                set.status = 403;
                return { error: 'Only SUPERADMIN can create rooms' };
            }
            const result = await db.insert(rooms).values(body as NewRoom).returning();
            return result[0];
        },
        {
            body: t.Object({
                name: t.String(),
                description: t.Optional(t.String()),
            }),
        }
    )
    // Update room - SUPERADMIN only
    .put(
        '/:id',
        async ({ params, body, headers, set }) => {
            const user = await authenticateUser(headers);
            if (user.role !== 'SUPERADMIN') {
                set.status = 403;
                return { error: 'Only SUPERADMIN can update rooms' };
            }
            const result = await db
                .update(rooms)
                .set(body)
                .where(eq(rooms.id, params.id))
                .returning();
            return result[0];
        },
        {
            body: t.Object({
                name: t.Optional(t.String()),
                description: t.Optional(t.String()),
            }),
        }
    )
    // Delete room - SUPERADMIN only
    .delete('/:id', async ({ params, headers, set }) => {
        const user = await authenticateUser(headers);
        if (user.role !== 'SUPERADMIN') {
            set.status = 403;
            return { error: 'Only SUPERADMIN can delete rooms' };
        }
        const existingRoom = await db.select().from(rooms).where(eq(rooms.id, params.id));
        if (!existingRoom[0]) {
            set.status = 404;
            return { error: 'Room not found' };
        }
        await db.delete(rooms).where(eq(rooms.id, params.id));
        return { success: true };
    });
