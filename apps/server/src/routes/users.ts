import { Elysia, t } from 'elysia';
<<<<<<< HEAD
import { db, users, rooms } from '@laboratory/db';
import { registerUser } from '../services/auth-service';
=======
import { db, users, rooms, type NewUser } from '@laboratory/db';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from '../services/auth-service';
>>>>>>> d9a9557 (update code)

export const userRoutes = new Elysia({ prefix: '/users' })
    .get('/', async () => {
        const result = await db
            .select({
                id: users.id,
<<<<<<< HEAD
                email: users.email,
=======
                username: users.username,
>>>>>>> d9a9557 (update code)
                fullName: users.fullName,
                nickname: users.nickname,
                role: users.role,
                roomId: users.roomId,
                isActive: users.isActive,
                createdAt: users.createdAt,
                room: rooms,
            })
            .from(users)
            .leftJoin(rooms, eq(users.roomId, rooms.id));
        return result;
    })
    .get('/:id', async ({ params }) => {
        const result = await db
            .select({
                id: users.id,
<<<<<<< HEAD
                email: users.email,
=======
                username: users.username,
>>>>>>> d9a9557 (update code)
                fullName: users.fullName,
                nickname: users.nickname,
                role: users.role,
                roomId: users.roomId,
                isActive: users.isActive,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, params.id));
        return result[0];
    })
    .post(
<<<<<<< HEAD
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
=======
        '/',
        async ({ body }) => {
            const hashedPassword = await hashPassword(body.password);
            const result = await db
                .insert(users)
                .values({
                    username: body.username,
                    password: hashedPassword,
                    fullName: body.fullName,
                    nickname: body.nickname,
                    role: body.role,
                    roomId: body.roomId,
                } as NewUser)
                .returning({
                    id: users.id,
                    username: users.username,
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
                username: t.String({ minLength: 3 }),
                password: t.String({ minLength: 6 }),
                fullName: t.String(),
                nickname: t.Optional(t.String()),
                role: t.Union([t.Literal('SUPERADMIN'), t.Literal('ADMIN'), t.Literal('GENERAL')]),
                roomId: t.Optional(t.String()),
>>>>>>> d9a9557 (update code)
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
            const updateData: Partial<NewUser> = {};
            if (body.fullName !== undefined) updateData.fullName = body.fullName;
            if (body.nickname !== undefined) updateData.nickname = body.nickname;
            if (body.role !== undefined) updateData.role = body.role;
            if (body.roomId !== undefined) updateData.roomId = body.roomId;
            if (body.isActive !== undefined) updateData.isActive = body.isActive;
            if (body.password !== undefined) {
                updateData.password = await hashPassword(body.password);
            }

            const result = await db
                .update(users)
<<<<<<< HEAD
                .set(body)
                .where(({ id }) => id.eq(params.id))
                .returning({
                    id: users.id,
                    email: users.email,
=======
                .set(updateData)
                .where(eq(users.id, params.id))
                .returning({
                    id: users.id,
                    username: users.username,
>>>>>>> d9a9557 (update code)
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
                password: t.Optional(t.String({ minLength: 6 })),
            }),
        }
    )
    .delete('/:id', async ({ params }) => {
        const result = await db
            .update(users)
            .set({ isActive: false })
            .where(eq(users.id, params.id))
            .returning({
                id: users.id,
                username: users.username,
                isActive: users.isActive,
            });
        return result[0];
    });
