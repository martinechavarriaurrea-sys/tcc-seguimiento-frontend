export type EstadoGuia =
  | 'registrado'
  | 'recogido'
  | 'en_transito'
  | 'en_ruta_entrega'
  | 'entregado'
  | 'novedad'
  | 'devuelto'
  | 'cerrado';

export type TipoAlerta = 'sin_movimiento' | 'novedad' | 'retraso';

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  mensaje: string;
  fecha: string;
}

export interface EventoHistorial {
  id: string;
  fecha: string;
  estado: string;
  descripcion: string;
  ubicacion?: string;
}

export interface Guia {
  id: string;
  numero_guia: string;
  asesor: string;
  cliente?: string;
  estado_actual: EstadoGuia;
  estado_raw?: string;
  fecha_creacion: string;
  fecha_ultima_actualizacion: string;
  dias_en_transito: number;
  activa: boolean;
  alertas: Alerta[];
  historial: EventoHistorial[];
  ultima_novedad?: string;
  observacion?: string;
}

export interface GuiaResumen {
  id: string;
  numero_guia: string;
  asesor: string;
  cliente?: string;
  estado_actual: EstadoGuia;
  fecha_ultima_actualizacion: string;
  fecha_despacho?: string | null;
  dias_en_transito: number | null;
  activa: boolean;
  tiene_alerta: boolean;
}

export interface RegistrarGuiaPayload {
  numero_guia: string;
  asesor: string;
  cliente?: string;
  fecha_despacho?: string;
}

export interface DashboardStats {
  total_activas: number;
  total_entregadas: number;
  con_novedad: number;
  sin_movimiento: number;
  monitoreadas_hoy: number;
  ultima_ejecucion: string | null;
  proxima_ejecucion: string | null;
}

export interface SystemHealth {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime_seconds: number;
  ultima_consulta_tcc: string | null;
  scheduler_activo: boolean;
  scheduler_mode?: 'embedded' | 'external' | 'disabled';
  email_configured?: boolean;
  cron_protected?: boolean;
  total_guias_bd: number;
  bd_conectada: boolean;
  mensaje?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  username: string;
}

export interface AuthUser {
  username: string;
  token: string;
}

export interface ApiError {
  message: string;
  detail?: string | Record<string, unknown>;
  status?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface GuiasFilters {
  estado?: EstadoGuia | '';
  activa?: boolean | '';
  asesor?: string;
  search?: string;
  page?: number;
  page_size?: number;
}
