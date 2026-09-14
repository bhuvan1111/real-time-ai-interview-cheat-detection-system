import { api } from './api';
import { User } from '../types';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  async register(name: string, email: string, password: string, role: string = 'candidate'): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', { name, email, password, role });
    return res.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
