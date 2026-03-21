import { Elysia, t } from 'elysia';
import { db, rooms, type NewRoom } from '@laboratory/db';
import { eq } from 'drizzle-orm';

export const roomRoutes = new Elysia({ prefix: '/rooms' })
    .get('/', async () => {
        const result = await db.select().from(rooms);
        return result;
    })
    .get('/:id', async ({ params }) => {
        const result = await db.select().from(rooms).where(eq(rooms.id, params.id));
        return result[0];
    })
    .post(
        '/',
        async ({ body }) => {
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
    .put(
        '/:id',
        async ({ params, body }) => {
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
    .delete('/:id', async ({ params, set }) => {
        const existingRoom = await db.select().from(rooms).where(eq(rooms.id, params.id));
        if (!existingRoom[0]) {
            set.status = 404;
            return { error: 'Room not found' };
        }
        await db.delete(rooms).where(eq(rooms.id, params.id));
        return { success: true };
    });
