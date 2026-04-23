import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { API_URL, TOKEN_KEY } from '@/lib/constants';

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_URL,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        document.cookie = 'tcc_auth=; path=/; max-age=0';
        window.location.href = '/login?session=expired';
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createApiClient();
