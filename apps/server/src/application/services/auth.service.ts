import { db, users, type User } from '@laboratory/db';
import { eq, isNull, and } from 'drizzle-orm';
import { hash, verify } from 'argon2';
import { config } from '../../infrastructure/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
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

interface JwtPayload {
    userId: string;
    username: string;
    role: string;
    iat: number;
    exp: number;
}

// Get RSA keys from PEM files
async function getRsaKeys(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> {
    const { algorithm, privateKeyPath, publicKeyPath } = config.jwt;
    const hash = algorithm === 'RS512' ? 'SHA-512' : 'SHA-256';

    // Resolve paths (relative to cwd or absolute)
    const privateKeyAbs = privateKeyPath.startsWith('/') ? privateKeyPath : join(process.cwd(), privateKeyPath);
    const publicKeyAbs = publicKeyPath.startsWith('/') ? publicKeyPath : join(process.cwd(), publicKeyPath);

    // Check if key files exist
    if (!existsSync(privateKeyAbs)) {
        throw new Error(`Private key not found: ${privateKeyAbs}`);
    }
    if (!existsSync(publicKeyAbs)) {
        throw new Error(`Public key not found: ${publicKeyAbs}`);
    }

    // Read PEM files
    const privateKeyPem = readFileSync(privateKeyAbs, 'utf-8');
    const publicKeyPem = readFileSync(publicKeyAbs, 'utf-8');

    // Import keys
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        pemToBuffer(privateKeyPem),
        { name: 'RSASSA-PKCS1-v1_5', hash },
        false,
        ['sign']
    );

    const publicKey = await crypto.subtle.importKey(
        'spki',
        pemToBuffer(publicKeyPem),
        { name: 'RSASSA-PKCS1-v1_5', hash },
        false,
        ['verify']
    );

    return { privateKey, publicKey };
}

// Convert PEM to ArrayBuffer
function pemToBuffer(pem: string): ArrayBuffer {
    const b64 = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');
    const buffer = Buffer.from(b64, 'base64');
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

// Base64URL encode
function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
    const buffer = data instanceof Uint8Array ? Buffer.from(data) : Buffer.from(new Uint8Array(data));
    return buffer
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Base64URL decode
function base64UrlDecode(str: string): string {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return Buffer.from(b64, 'base64').toString();
}

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
    const { algorithm, expiresIn } = config.jwt;
    const now = Math.floor(Date.now() / 1000);

    // JWT Header
    const header = {
        alg: algorithm,
        typ: 'JWT',
    };

    // JWT Payload
    const payload: JwtPayload = {
        userId: user.id,
        username: user.username,
        role: user.role,
        iat: now,
        exp: now + expiresIn,
    };

    // Encode header and payload
    const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
    const signingInput = `${headerB64}.${payloadB64}`;

    // Get RSA keys and sign
    const { privateKey } = await getRsaKeys();
    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        encoder.encode(signingInput)
    );

    const signatureB64 = base64UrlEncode(signatureBuffer);
    return `${signingInput}.${signatureB64}`;
};

export const verifyToken = async (token: string): Promise<JwtPayload | null> => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [headerB64, payloadB64, signatureB64] = parts;
        const signingInput = `${headerB64}.${payloadB64}`;

        // Decode header to verify algorithm
        const header = JSON.parse(base64UrlDecode(headerB64));
        if (!['RS256', 'RS512'].includes(header.alg)) {
            return null;
        }

        // Decode payload
        const payload: JwtPayload = JSON.parse(base64UrlDecode(payloadB64));

        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        // Get public key and verify signature
        const { publicKey } = await getRsaKeys();

        // Decode signature from base64url
        let signatureB64Normalized = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
        while (signatureB64Normalized.length % 4) signatureB64Normalized += '=';
        const signature = Buffer.from(signatureB64Normalized, 'base64');

        const encoder = new TextEncoder();
        const isValid = await crypto.subtle.verify(
            'RSASSA-PKCS1-v1_5',
            publicKey,
            signature,
            encoder.encode(signingInput)
        );

        if (!isValid) return null;

        return payload;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};

// Find user by username (excludes soft-deleted users)
export const findUserByUsername = async (username: string): Promise<User | null> => {
    const result = await db
        .select()
        .from(users)
        .where(and(eq(users.username, username), isNull(users.deletedAt)));
    console.log('findUserByUsername result:', result);
    return result[0] || null;
};

// Find user by ID (excludes soft-deleted users)
export const findUserById = async (id: string): Promise<AuthUser | null> => {
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
        .where(and(eq(users.id, id), isNull(users.deletedAt)));
    return result[0] || null;
};

export const authenticateUser = async ({ username, password }: LoginPayload): Promise<{ user: AuthUser; token: string } | null> => {
    const user = await findUserByUsername(username);
    if (!user) return null;

    // Check if user is soft-deleted
    if (user.deletedAt) return null;

    if (!user.isActive) return null;

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) return null;

    const { password: _, ...userWithoutPassword } = user;
    const token = await generateToken(userWithoutPassword);

    return { user: userWithoutPassword, token };
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthUser> => {
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
};
