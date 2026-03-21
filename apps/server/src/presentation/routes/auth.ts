import { Elysia, t } from 'elysia';
import { authenticateUser, registerUser } from '../../application/services/auth.service';
import { authenticateUser as verifyAuth } from '../middleware/auth';

export const authRoutes = new Elysia({ prefix: '/auth' })
    // Login - No auth required
    .post(
        '/login',
        async ({ body, set }) => {
            const result = await authenticateUser(body);
            if (!result) {
                set.status = 401;
                return { error: 'Invalid username or password' };
            }
            return result;
        },
        {
            body: t.Object({
                username: t.String(),
                password: t.String(),
            }),
        }
    )
    // Register - SUPERADMIN only (create new users)
    .post(
        '/register',
        async ({ body, set }) => {
            try {
                const user = await registerUser(body);
                console.log('Registered user:', user);
                return { user };
            } catch (error) {
                set.status = 400;
                return { error: error instanceof Error ? error.message : 'Registration failed' };
            }
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
    // Get current user - Auth required
    .get('/me', async ({ headers, set }) => {
        try {
            const user = await verifyAuth(headers);
            return { user };
        } catch (error) {
            set.status = 401;
            return { error: error instanceof Error ? error.message : 'Authentication failed' };
        }
    });
