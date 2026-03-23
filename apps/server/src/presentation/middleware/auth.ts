import { Elysia, Context } from 'elysia';
import { verifyToken, findUserById } from '../../application/services/auth.service';

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'GENERAL';

export interface AuthUser {
    id: string;
    username: string;
    fullName: string;
    nickname: string | null;
    role: UserRole;
    roomId: string | null;
    isActive: boolean;
    createdAt: Date;
    deletedAt: Date | null;
}

// Role permissions configuration
export const rolePermissions = {
    SUPERADMIN: {
        canOrder: true,
        canViewStock: true,
        canCrudStock: true,
        canManageUsers: true,
    },
    ADMIN: {
        canOrder: true,
        canViewStock: true,
        canCrudStock: false,
        canManageUsers: false,
    },
    GENERAL: {
        canOrder: true,
        canViewStock: false, // Cannot see stock quantities
        canCrudStock: false,
        canManageUsers: false,
    },
} as const;

/**
 * Helper function to authenticate user from request headers
 * Returns the authenticated user or throws an error
 */
export async function authenticateUser(headers: Record<string, string | undefined>): Promise<AuthUser> {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
        throw new Error('Invalid or expired token');
    }

    const user = await findUserById(payload.userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Check if user is soft-deleted
    if (user.deletedAt) {
        throw new Error('User account has been deleted');
    }

    if (!user.isActive) {
        throw new Error('User account is inactive');
    }

    return user as AuthUser;
}

/**
 * Authentication middleware using JWT with 2-hour expiration
 * Validates Bearer token from Authorization header
 * Attaches authenticated user to request context
 */
export const authMiddleware = new Elysia({ name: 'auth' })
    .derive(async ({ headers, set }) => {
        try {
            const user = await authenticateUser(headers);
            return { user };
        } catch (error) {
            set.status = error instanceof Error && error.message.includes('inactive') ? 403 : 401;
            throw error;
        }
    });
