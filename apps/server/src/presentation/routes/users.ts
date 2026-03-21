import { Elysia, t } from 'elysia';
import { db, users, rooms, type NewUser } from '@laboratory/db';
import { eq, isNull, and } from 'drizzle-orm';
import { hashPassword } from '../../application/services/auth.service';
import { authenticateUser } from '../middleware/auth';

export const userRoutes = new Elysia({ prefix: '/users' })
    // List users - ADMIN and SUPERADMIN only (excludes soft-deleted)
    .get('/', async ({ headers, set }) => {
        const user = await authenticateUser(headers);
        if (user.role === 'GENERAL') {
            set.status = 403;
            return { error: 'You do not have permission to view users' };
        }
        const result = await db
            .select({
                id: users.id,
                username: users.username,
                fullName: users.fullName,
                nickname: users.nickname,
                role: users.role,
                roomId: users.roomId,
                isActive: users.isActive,
                createdAt: users.createdAt,
                deletedAt: users.deletedAt,
                room: rooms,
            })
            .from(users)
            .leftJoin(rooms, eq(users.roomId, rooms.id))
            .where(isNull(users.deletedAt));
        return result;
    })
    // Get user by ID - ADMIN and SUPERADMIN can view all, GENERAL can only view themselves
    .get('/:id', async ({ params, headers, set }) => {
        const user = await authenticateUser(headers);
        // GENERAL can only view their own profile
        if (user.role === 'GENERAL' && user.id !== params.id) {
            set.status = 403;
            return { error: 'You can only view your own profile' };
        }
        const result = await db
            .select({
                id: users.id,
                username: users.username,
                fullName: users.fullName,
                nickname: users.nickname,
                role: users.role,
                roomId: users.roomId,
                isActive: users.isActive,
                createdAt: users.createdAt,
                deletedAt: users.deletedAt,
            })
            .from(users)
            .where(and(eq(users.id, params.id), isNull(users.deletedAt)));

        if (!result[0]) {
            set.status = 404;
            return { error: 'User not found' };
        }
        return result[0];
    })
    // Create user - SUPERADMIN only
    .post(
        '/',
        async ({ body, headers, set }) => {
            const user = await authenticateUser(headers);
            if (user.role !== 'SUPERADMIN') {
                set.status = 403;
                return { error: 'Only SUPERADMIN can create users' };
            }
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
            }),
        }
    )
    // Update user - SUPERADMIN can update all, users can update own profile (limited fields)
    .put(
        '/:id',
        async ({ params, body, headers, set }) => {
            const currentUser = await authenticateUser(headers);
            // Only SUPERADMIN can update role, isActive, and other users' profiles
            if (currentUser.role !== 'SUPERADMIN') {
                // Non-superadmin can only update their own profile with limited fields
                if (currentUser.id !== params.id) {
                    set.status = 403;
                    return { error: 'You can only update your own profile' };
                }
                // Remove role and isActive from body for non-superadmin
                if (body.role !== undefined || body.isActive !== undefined) {
                    set.status = 403;
                    return { error: 'You cannot update role or active status' };
                }
            }

            // Check if user exists and is not soft-deleted
            const existingUser = await db
                .select({ id: users.id })
                .from(users)
                .where(and(eq(users.id, params.id), isNull(users.deletedAt)));

            if (!existingUser[0]) {
                set.status = 404;
                return { error: 'User not found' };
            }

            const updateData: Partial<NewUser> = {};
            if (body.fullName !== undefined) updateData.fullName = body.fullName;
            if (body.nickname !== undefined) updateData.nickname = body.nickname;
            if (currentUser.role === 'SUPERADMIN') {
                if (body.role !== undefined) updateData.role = body.role;
                if (body.roomId !== undefined) updateData.roomId = body.roomId;
                if (body.isActive !== undefined) updateData.isActive = body.isActive;
            }
            if (body.password !== undefined) {
                updateData.password = await hashPassword(body.password);
            }

            const result = await db
                .update(users)
                .set(updateData)
                .where(eq(users.id, params.id))
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
                fullName: t.Optional(t.String()),
                nickname: t.Optional(t.String()),
                role: t.Optional(t.Union([t.Literal('SUPERADMIN'), t.Literal('ADMIN'), t.Literal('GENERAL')])),
                roomId: t.Optional(t.String()),
                isActive: t.Optional(t.Boolean()),
                password: t.Optional(t.String({ minLength: 6 })),
            }),
        }
    )
    // Soft delete user - SUPERADMIN only
    .delete('/:id', async ({ params, headers, set }) => {
        const user = await authenticateUser(headers);
        if (user.role !== 'SUPERADMIN') {
            set.status = 403;
            return { error: 'Only SUPERADMIN can delete users' };
        }

        // Check if user exists and is not already soft-deleted
        const existingUser = await db
            .select({ id: users.id, username: users.username })
            .from(users)
            .where(and(eq(users.id, params.id), isNull(users.deletedAt)));

        if (!existingUser[0]) {
            set.status = 404;
            return { error: 'User not found or already deleted' };
        }

        // Soft delete by setting deletedAt to current timestamp
        const result = await db
            .update(users)
            .set({
                deletedAt: new Date(),
                isActive: false,
            })
            .where(eq(users.id, params.id))
            .returning({
                id: users.id,
                username: users.username,
                isActive: users.isActive,
                deletedAt: users.deletedAt,
            });
        return result[0];
    })
    // Restore soft-deleted user - SUPERADMIN only
    .post('/:id/restore', async ({ params, headers, set }) => {
        const user = await authenticateUser(headers);
        if (user.role !== 'SUPERADMIN') {
            set.status = 403;
            return { error: 'Only SUPERADMIN can restore users' };
        }

        // Check if user exists and is soft-deleted
        const existingUser = await db
            .select({ id: users.id, username: users.username })
            .from(users)
            .where(eq(users.id, params.id));

        if (!existingUser[0]) {
            set.status = 404;
            return { error: 'User not found' };
        }

        // Restore by setting deletedAt to null
        const result = await db
            .update(users)
            .set({
                deletedAt: null,
                isActive: true,
            })
            .where(eq(users.id, params.id))
            .returning({
                id: users.id,
                username: users.username,
                isActive: users.isActive,
                deletedAt: users.deletedAt,
            });
        return result[0];
    });
