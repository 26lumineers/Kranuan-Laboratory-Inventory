import { Elysia, t } from 'elysia';
import { authenticateUser, registerUser, verifyToken, findUserById } from '../services/auth-service';

export const authRoutes = new Elysia({ prefix: '/auth' })
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
    .get(
        '/me',
        async ({ headers, set }) => {
            const authHeader = headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                set.status = 401;
                return { error: 'No token provided' };
            }

            const token = authHeader.substring(7);
            const payload = await verifyToken(token);

            if (!payload) {
                set.status = 401;
                return { error: 'Invalid or expired token' };
            }

            const user = await findUserById(payload.userId);
            if (!user) {
                set.status = 401;
                return { error: 'User not found' };
            }

            return { user };
        }
    );
