export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'TCC Seguimiento';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

export const TOKEN_KEY = 'tcc_access_token';
export const AUTH_COOKIE = 'tcc_auth';

export const QUERY_KEYS = {
  dashboard: ['dashboard'] as const,
  guias: ['guias'] as const,
  guia: (id: string) => ['guias', id] as const,
  system: ['system'] as const,
} as const;

export const STALE_TIMES = {
  dashboard: 60_000,
  guias: 30_000,
  guia: 30_000,
  system: 15_000,
} as const;

export const HORAS_SIN_MOVIMIENTO_ALERTA = 48;
export const HORAS_CRITICO = 72;
