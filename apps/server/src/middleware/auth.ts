import { Elysia } from 'elysia';
import { verifyToken, findUserById } from '../services/auth-service';

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'GENERAL';

export interface AuthContext {
    user: {
        id: string;
        username: string;
        fullName: string;
        nickname: string | null;
        role: UserRole;
        roomId: string | null;
        isActive: boolean;
        createdAt: Date;
    };
}

export const authMiddleware = new Elysia({ name: 'auth' })
    .derive(async ({ headers, set }): Promise<AuthContext | { error: string }> => {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            set.status = 401;
            return { error: 'Authentication required' };
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

        if (!user.isActive) {
            set.status = 403;
            return { error: 'User account is inactive' };
        }

        return { user };
    });

export const requireRole = (...allowedRoles: UserRole[]) => {
    return async ({ user, set }: AuthContext & { set: { status: number } }) => {
        if (!allowedRoles.includes(user.role as UserRole)) {
            set.status = 403;
            return { error: 'Insufficient permissions' };
        }
    };
};

export const requireAuth = () => authMiddleware;
