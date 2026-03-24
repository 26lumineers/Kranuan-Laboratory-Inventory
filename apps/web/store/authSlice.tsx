import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'GENERAL';

export interface User {
    id: string;
    username: string;
    fullName: string;
    nickname: string | null;
    role: UserRole;
    roomId: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: typeof window !== 'undefined' ? sessionStorage.getItem('token') : null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const login = createAsyncThunk(
    'auth/login',
    async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return rejectWithValue(data.error || 'Login failed');
            }

            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));

            return data;
        } catch (error) {
            return rejectWithValue('Network error. Please try again.');
        }
    }
);

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                return rejectWithValue('No token found');
            }

            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                return rejectWithValue(data.error || 'Failed to fetch user');
            }

            return data.user;
        } catch (error) {
            return rejectWithValue('Network error');
        }
    }
);

export const logout = createAsyncThunk('auth/logout', async () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return null;
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchCurrentUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(fetchCurrentUser.rejected, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
            })
            .addCase(logout.fulfilled, (state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
            });
    },
});

export const { clearError, setUser, setToken } = authSlice.actions;
export default authSlice.reducer;
