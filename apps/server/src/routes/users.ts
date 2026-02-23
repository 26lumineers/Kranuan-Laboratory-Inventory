import { Elysia, t } from 'elysia';
import { db, users, rooms, type NewUser } from '@laboratory/db';

export const userRoutes = new Elysia({ prefix: '/users' })
    .get('/', async () => {
        const result = await db
            .select({
                id: users.id,
                fullName: users.fullName,
                nickname: users.nickname,
                role: users.role,
                roomId: users.roomId,
                isActive: users.isActive,
                createdAt: users.createdAt,
                room: rooms,
            })
            .from(users)
            .leftJoin(rooms, ({ eq }) => eq(users.roomId, rooms.id));
        return result;
    })
    .get('/:id', async ({ params }) => {
        const result = await db
            .select()
            .from(users)
            .where(({ id }) => id.eq(params.id));
        return result[0];
    })
    .post(
        '/',
        async ({ body }) => {
            const result = await db
                .insert(users)
                .values(body as NewUser)
                .returning();
            return result[0];
        },
        {
            body: t.Object({
                fullName: t.String(),
                nickname: t.Optional(t.String()),
                role: t.Union([t.Literal('SUPERADMIN'), t.Literal('ADMIN'), t.Literal('GENERAL')]),
                roomId: t.Optional(t.String()),
            }),
        }
    )
    .put(
        '/:id',
        async ({ params, body }) => {
            const result = await db
                .update(users)
                .set(body)
                .where(({ id }) => id.eq(params.id))
                .returning();
            return result[0];
        },
        {
            body: t.Object({
                fullName: t.Optional(t.String()),
                nickname: t.Optional(t.String()),
                role: t.Optional(t.Union([t.Literal('SUPERADMIN'), t.Literal('ADMIN'), t.Literal('GENERAL')])),
                roomId: t.Optional(t.String()),
                isActive: t.Optional(t.Boolean()),
            }),
        }
    );
