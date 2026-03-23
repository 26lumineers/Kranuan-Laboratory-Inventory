// ============ LOGGER ============

export {
    createLogger,
    generateTraceId,
    getTraceId,
    traceContext,
    type Logger,
} from './logger';

// ============ CONSTANTS ============

export const USER_ROLES = {
    SUPERADMIN: 'SUPERADMIN',
    ADMIN: 'ADMIN',
    GENERAL: 'GENERAL',
} as const;

export const ROOM_TYPES = {
    CHEMICAL_CLINIC: 'CHEMICAL_CLINIC',
    HEMATOLOGY: 'HEMATOLOGY',
    MICRO_BIOLOGY: 'MICRO_BIOLOGY',
    BLOODBANK: 'BLOODBANK',
    IMMUNOLOGY: 'IMMUNOLOGY',
    MICRO_SCOPIC: 'MICRO_SCOPIC',
    SUB_STOCKS: 'SUB_STOCKS',
} as const;

export const NOTIFICATION_TARGET_ROLES = {
    SUPERADMIN_ADMIN: 'SUPERADMIN,ADMIN',
    ALL: 'SUPERADMIN,ADMIN,GENERAL',
} as const;

// ============ TYPES ============

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export type RoomType = typeof ROOM_TYPES[keyof typeof ROOM_TYPES];

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface CreateOrderItem {
    productId: string;
    quantity: number;
}

export interface CreateOrderRequest {
    items: CreateOrderItem[];
    note?: string;
}


export type RegisterRole = 'ADMIN' | 'GENERAL';

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
    nickname?: string;
    role: RegisterRole;
    roomId?: string;
}

export interface RegisterResponse {
    success: boolean;
    data?: {
        id: string;
        email: string;
        fullName: string;
        nickname: string | null;
        role: UserRole;
        roomId: string | null;
        isActive: boolean | null;
        createdAt: Date | null;
    };
    error?: 'EMAIL_ALREADY_REGISTERED';
}
