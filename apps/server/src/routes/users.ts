import { Elysia, t } from 'elysia';
import { db, users, rooms } from '@laboratory/db';
import { registerUser } from '../services/auth-service';

export const userRoutes = new Elysia({ prefix: '/users' })
    .get('/', async () => {
        const result = await db
            .select({
                id: users.id,
                email: users.email,
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
            .select({
                id: users.id,
                email: users.email,
                fullName: users.fullName,
                nickname: users.nickname,
                role: users.role,
                roomId: users.roomId,
                isActive: users.isActive,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(({ id }) => id.eq(params.id));
        return result[0];
    })
    .post(
        '/register',
        async ({ body, set }) => {
            const result = await registerUser(body);

            if (!result.success) {
                set.status = 409;
                return {
                    success: false,
                    error: result.error,
                };
            }

            set.status = 201;
            return {
                success: true,
                data: result.data,
            };
        },
        {
            body: t.Object({
                email: t.String({ format: 'email' }),
                password: t.String({ minLength: 8 }),
                fullName: t.String({ minLength: 1, maxLength: 150 }),
                nickname: t.Optional(t.String({ maxLength: 100 })),
                role: t.Union([t.Literal('ADMIN'), t.Literal('GENERAL')]),
                roomId: t.Optional(t.String({ format: 'uuid' })),
            }),
            response: {
                201: t.Object({
                    success: t.Literal(true),
                    data: t.Object({
                        id: t.String({ format: 'uuid' }),
                        email: t.String({ format: 'email' }),
                        fullName: t.String(),
                        nickname: t.Union([t.String(), t.Null()]),
                        role: t.Union([t.Literal('SUPERADMIN'), t.Literal('ADMIN'), t.Literal('GENERAL')]),
                        roomId: t.Union([t.String({ format: 'uuid' }), t.Null()]),
                        isActive: t.Union([t.Boolean(), t.Null()]),
                        createdAt: t.Union([t.Date(), t.Null()]),
                    }),
                }),
                409: t.Object({
                    success: t.Literal(false),
                    error: t.Literal('EMAIL_ALREADY_REGISTERED'),
                }),
            },
        }
    )
    .put(
        '/:id',
        async ({ params, body }) => {
            const result = await db
                .update(users)
                .set(body)
                .where(({ id }) => id.eq(params.id))
                .returning({
                    id: users.id,
                    email: users.email,
                    fullName: users.fullName,
                    nickname: users.nickname,
                    role: users.role,
                    roomId: users.roomId,
                    isActive: users.isActive,
                    createdAt: users.createdAt,
                });
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
