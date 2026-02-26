import { db, users } from '@laboratory/db';
import { eq } from 'drizzle-orm';
import { randomBytes, scryptSync } from 'node:crypto';
import type { RegisterRequest } from '@laboratory/shared';

export type RegisterUserPayload = RegisterRequest;

export type RegisterUserResult =
    | {
          success: true;
          data: {
              id: string;
              email: string;
              fullName: string;
              nickname: string | null;
              role: 'SUPERADMIN' | 'ADMIN' | 'GENERAL';
              roomId: string | null;
              isActive: boolean | null;
              createdAt: string | null;
          };
      }
    | {
          success: false;
          error: 'EMAIL_ALREADY_REGISTERED';
      };

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashPassword = (password: string) => {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
};

export const registerUser = async (payload: RegisterUserPayload): Promise<RegisterUserResult> => {
    const normalizedEmail = normalizeEmail(payload.email);

    return db.transaction(async (tx) => {
        const [existingUser] = await tx.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail));

        if (existingUser) {
            return { success: false, error: 'EMAIL_ALREADY_REGISTERED' };
        }

        const [createdUser] = await tx
            .insert(users)
            .values({
                email: normalizedEmail,
                passwordHash: hashPassword(payload.password),
                fullName: payload.fullName,
                nickname: payload.nickname,
                role: payload.role,
                roomId: payload.roomId,
            })
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

        return {
            success: true,
            data: {
                ...createdUser,
                createdAt: createdUser.createdAt ? createdUser.createdAt.toISOString() : null,
            },
        };
    });
};
