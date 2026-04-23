import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '—';
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch {
    return '—';
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '—';
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return '—';
  }
}

export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '—';
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch {
    return '—';
  }
}

export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function extractApiErrorMessage(error: unknown): string {
  if (!error) return 'Error desconocido';
  if (typeof error === 'string') return error;

  const err = error as Record<string, unknown>;

  if (err.response) {
    const response = err.response as Record<string, unknown>;
    const data = response.data as Record<string, unknown> | undefined;
    if (data?.detail) {
      if (typeof data.detail === 'string') return data.detail;
      return JSON.stringify(data.detail);
    }
    if (data?.message) return String(data.message);
    const status = response.status as number | undefined;
    if (status === 401) return 'Sesión expirada. Inicia sesión nuevamente.';
    if (status === 403) return 'No tienes permiso para realizar esta acción.';
    if (status === 404) return 'Recurso no encontrado.';
    if (status === 409) return 'La guía ya existe en el sistema.';
    if (status === 422) return 'Datos inválidos. Verifica los campos.';
    if (status && status >= 500) return 'Error interno del servidor. Intenta más tarde.';
  }

  if (err.message) return String(err.message);
  return 'Error al conectar con el servidor.';
}
