export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'GENERAL';

export type RoomType = 'CHEMICAL_CLINIC' | 'HEMATOLOGY' | 'MICRO_BIOLOGY' | 'BLOODBANK' | 'IMMUNOLOGY' | 'MICRO_SCOPIC' | 'SUB_STOCKS';

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
