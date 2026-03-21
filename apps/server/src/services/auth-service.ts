<<<<<<< HEAD
import { db, users } from '@laboratory/db';
import { eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';
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
              createdAt: Date | null;
          };
      }
    | {
          success: false;
          error: 'EMAIL_ALREADY_REGISTERED';
      };

const hashPassword = (password: string) => createHash('sha256').update(password).digest('hex');

export const registerUser = async (payload: RegisterUserPayload): Promise<RegisterUserResult> => {
    return db.transaction(async (tx) => {
        const [existingUser] = await tx.select({ id: users.id }).from(users).where(eq(users.email, payload.email));

        if (existingUser) {
            return { success: false, error: 'EMAIL_ALREADY_REGISTERED' };
        }

        const [createdUser] = await tx
            .insert(users)
            .values({
                email: payload.email,
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
            data: createdUser,
        };
    });
=======
import { db, users, type User } from '@laboratory/db';
import { eq } from 'drizzle-orm';
import { hash, verify } from 'argon2';
import { log } from 'console';

export type LoginPayload = {
    username: string;
    password: string;
};

export type RegisterPayload = {
    username: string;
    password: string;
    fullName: string;
    nickname?: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'GENERAL';
    roomId?: string;
};

export type AuthUser = Omit<User, 'password'>;

const JWT_SECRET = process.env.JWT_SECRET || 'laboratory-inventory-secret-key-2024';

export const hashPassword = async (password: string): Promise<string> => {
    return await hash(password);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    try {
        return await verify(hashedPassword, password);
    } catch {
        return false;
    }
};

export const generateToken = async (user: AuthUser): Promise<string> => {
    const payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    };
    const payloadStr = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadStr + JWT_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return Buffer.from(payloadStr).toString('base64') + '.' + signature;
};

export const verifyToken = async (token: string): Promise<{ userId: string; username: string; role: string } | null> => {
    try {
        const [payloadB64, signature] = token.split('.');
        if (!payloadB64 || !signature) return null;

        const payloadStr = Buffer.from(payloadB64, 'base64').toString();
        const payload = JSON.parse(payloadStr);

        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(payloadStr + JWT_SECRET);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (signature !== expectedSignature) return null;

        return {
            userId: payload.userId,
            username: payload.username,
            role: payload.role,
        };
    } catch {
        return null;
    }
};

export const findUserByUsername = async (username: string): Promise<User | null> => {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0] || null;
};

export const findUserById = async (id: string): Promise<AuthUser | null> => {
    const result = await db.select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        nickname: users.nickname,
        role: users.role,
        roomId: users.roomId,
        isActive: users.isActive,
        createdAt: users.createdAt,
    }).from(users).where(eq(users.id, id));
    return result[0] || null;
};

export const authenticateUser = async ({ username, password }: LoginPayload): Promise<{ user: AuthUser; token: string } | null> => {
    const user = await findUserByUsername(username);
    if (!user) return null;

    if (!user.isActive) return null;

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) return null;

    const { password: _, ...userWithoutPassword } = user;
    const token = await generateToken(userWithoutPassword);

    return { user: userWithoutPassword, token };
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthUser> => {
    console.log('Registering user with payload:', payload);
    const existingUser = await findUserByUsername(payload.username);
    if (existingUser) {
        throw new Error('Username already exists');
    }

    const hashedPassword = await hashPassword(payload.password);

    const [user] = await db.insert(users).values({
        username: payload.username,
        password: hashedPassword,
        fullName: payload.fullName,
        nickname: payload.nickname,
        role: payload.role,
        roomId: payload.roomId,
    }).returning();

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
>>>>>>> d9a9557 (update code)
};
