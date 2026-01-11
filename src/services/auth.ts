import { request } from './api';

export interface User {
    id: string;
    username: string;
    full_name?: string;
    email: string;
    employee_id: string;
    role: string;
    department: string;
    experience_years: number;
}

export interface RegisterData {
    username: string;
    password: string;
    full_name?: string;
    email: string;
    employee_id: string;
    role: string;
    department: string;
    experience_years: number;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user_id: string;
    username: string;
}

export const authApi = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        const response = await request<AuthResponse>('POST', '/auth/token', { username, password });
        if (response.error) {
            throw new Error(response.error);
        }
        return response.data!;
    },

    register: async (data: RegisterData): Promise<User> => {
        const response = await request<User>('POST', '/auth/register', data);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.data!;
    },

    getMe: async (): Promise<User> => {
        const response = await request<User>('GET', '/auth/me');
        if (response.error) {
            throw new Error(response.error);
        }
        return response.data!;
    }
};
