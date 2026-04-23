import type { AuthResponse, LoginCredentials } from '@/types';
import { IS_MOCK, TOKEN_KEY } from '@/lib/constants';
import { apiClient } from './client';
import { mockAuth } from './mock';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (IS_MOCK) {
      return mockAuth.login(credentials.username, credentials.password);
    }
    const { data } = await apiClient.post<AuthResponse>('/auth/login', {
      username: credentials.username,
      password: credentials.password,
    });
    return data;
  },

  storeSession(response: AuthResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, response.access_token);
    document.cookie = `tcc_auth=${response.access_token}; path=/; max-age=86400; SameSite=Strict`;
    localStorage.setItem('tcc_username', response.username);
  },

  clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('tcc_username');
    document.cookie = 'tcc_auth=; path=/; max-age=0';
  },

  getStoredUsername(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('tcc_username');
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
