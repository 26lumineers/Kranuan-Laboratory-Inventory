const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status?: number;
}

// Handle unauthorized response - clear token and redirect to login
const handleUnauthorized = () => {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/auth/login';
    }
};

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_URL) {
        this.baseUrl = baseUrl;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (typeof window !== 'undefined') {
            const token = sessionStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        const data = await response.json();

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
            handleUnauthorized();
            return { error: 'Unauthorized', status: 401 };
        }

        if (!response.ok) {
            return { error: data.error || 'Request failed', status: response.status };
        }

        return { data, status: response.status };
    }

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            return { error: 'Network error' };
        }
    }

    async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(body),
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            return { error: 'Network error' };
        }
    }

    async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(body),
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            return { error: 'Network error' };
        }
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            return { error: 'Network error' };
        }
    }
}

export const api = new ApiClient();
