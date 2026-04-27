import type {
  AuthResponse,
  DashboardStats,
  Guia,
  GuiaResumen,
  PaginatedResponse,
  SystemHealth,
} from '@/types';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const MOCK_GUIAS: Guia[] = [
  {
    id: '1',
    numero_guia: '8765432100',
    asesor: 'Laura Gómez',
    cliente: 'Constructora Bolívar S.A.',
    estado_actual: 'en_transito',
    estado_raw: 'EN TRANSITO - BOGOTÁ',
    fecha_creacion: '2026-04-18T08:00:00',
    fecha_ultima_actualizacion: '2026-04-22T07:05:00',
    dias_en_transito: 4,
    activa: true,
    alertas: [],
    historial: [
      { id: 'h1', fecha: '2026-04-18T08:00:00', estado: 'Registrado', descripcion: 'Guía registrada en el sistema', ubicacion: 'Medellín' },
      { id: 'h2', fecha: '2026-04-19T10:30:00', estado: 'Recogido', descripcion: 'Mercancía recogida por TCC', ubicacion: 'Medellín' },
      { id: 'h3', fecha: '2026-04-20T06:15:00', estado: 'En tránsito', descripcion: 'Salida hacia destino', ubicacion: 'Bogotá Hub' },
    ],
    ultima_novedad: undefined,
    observacion: undefined,
  },
  {
    id: '2',
    numero_guia: '9123456780',
    asesor: 'Carlos Ríos',
    cliente: 'Grupo Éxito',
    estado_actual: 'novedad',
    estado_raw: 'NOVEDAD - DIRECCIÓN INCORRECTA',
    fecha_creacion: '2026-04-15T09:00:00',
    fecha_ultima_actualizacion: '2026-04-20T14:00:00',
    dias_en_transito: 7,
    activa: true,
    alertas: [
      { id: 'a1', tipo: 'novedad', mensaje: 'Dirección de entrega incorrecta. Requiere corrección.', fecha: '2026-04-20T14:00:00' },
      { id: 'a2', tipo: 'sin_movimiento', mensaje: 'Sin movimiento desde hace 48 horas.', fecha: '2026-04-22T00:00:00' },
    ],
    historial: [
      { id: 'h1', fecha: '2026-04-15T09:00:00', estado: 'Registrado', descripcion: 'Guía registrada', ubicacion: 'Bogotá' },
      { id: 'h2', fecha: '2026-04-16T11:00:00', estado: 'Recogido', descripcion: 'Recogida exitosa', ubicacion: 'Bogotá' },
      { id: 'h3', fecha: '2026-04-17T08:00:00', estado: 'En tránsito', descripcion: 'En ruta a Cali', ubicacion: 'Cali Hub' },
      { id: 'h4', fecha: '2026-04-20T14:00:00', estado: 'Novedad', descripcion: 'Dirección incorrecta reportada', ubicacion: 'Cali' },
    ],
    ultima_novedad: 'Dirección de entrega incorrecta.',
    observacion: 'Cliente debe contactar a TCC para corrección.',
  },
  {
    id: '3',
    numero_guia: '7654321090',
    asesor: 'Laura Gómez',
    cliente: 'Bancolombia S.A.',
    estado_actual: 'entregado',
    estado_raw: 'ENTREGADO',
    fecha_creacion: '2026-04-14T10:00:00',
    fecha_ultima_actualizacion: '2026-04-21T15:30:00',
    dias_en_transito: 7,
    activa: false,
    alertas: [],
    historial: [
      { id: 'h1', fecha: '2026-04-14T10:00:00', estado: 'Registrado', descripcion: 'Guía registrada', ubicacion: 'Medellín' },
      { id: 'h2', fecha: '2026-04-15T09:00:00', estado: 'Recogido', descripcion: 'Recogida exitosa', ubicacion: 'Medellín' },
      { id: 'h3', fecha: '2026-04-16T07:00:00', estado: 'En tránsito', descripcion: 'Salida hacia destino', ubicacion: 'Barranquilla Hub' },
      { id: 'h4', fecha: '2026-04-21T08:00:00', estado: 'En ruta de entrega', descripcion: 'Mensajero asignado', ubicacion: 'Barranquilla' },
      { id: 'h5', fecha: '2026-04-21T15:30:00', estado: 'Entregado', descripcion: 'Entregado al destinatario', ubicacion: 'Barranquilla' },
    ],
    ultima_novedad: undefined,
    observacion: undefined,
  },
  {
    id: '4',
    numero_guia: '5432109870',
    asesor: 'Pedro Salazar',
    cliente: 'Alpina Productos Alimenticios',
    estado_actual: 'en_ruta_entrega',
    estado_raw: 'EN RUTA DE ENTREGA',
    fecha_creacion: '2026-04-20T08:00:00',
    fecha_ultima_actualizacion: '2026-04-22T06:30:00',
    dias_en_transito: 2,
    activa: true,
    alertas: [],
    historial: [
      { id: 'h1', fecha: '2026-04-20T08:00:00', estado: 'Registrado', descripcion: 'Guía registrada', ubicacion: 'Bogotá' },
      { id: 'h2', fecha: '2026-04-20T14:00:00', estado: 'Recogido', descripcion: 'Recogida exitosa', ubicacion: 'Bogotá' },
      { id: 'h3', fecha: '2026-04-21T07:00:00', estado: 'En tránsito', descripcion: 'En ruta', ubicacion: 'Bucaramanga Hub' },
      { id: 'h4', fecha: '2026-04-22T06:30:00', estado: 'En ruta de entrega', descripcion: 'Mensajero asignado', ubicacion: 'Bucaramanga' },
    ],
    ultima_novedad: undefined,
    observacion: undefined,
  },
];

const MOCK_GUIAS_RESUMEN: GuiaResumen[] = MOCK_GUIAS.map((g) => ({
  id: g.id,
  numero_guia: g.numero_guia,
  asesor: g.asesor,
  cliente: g.cliente,
  estado_actual: g.estado_actual,
  fecha_ultima_actualizacion: g.fecha_ultima_actualizacion,
  dias_en_transito: g.dias_en_transito,
  activa: g.activa,
  tiene_alerta: g.alertas.length > 0,
}));

let mockGuias = [...MOCK_GUIAS];
let mockResumen = [...MOCK_GUIAS_RESUMEN];

export const mockAuth = {
  async login(username: string, password: string): Promise<AuthResponse> {
    await delay();
    if (username === 'admin' && password === 'tcc2024') {
      return { access_token: 'mock-jwt-token', token_type: 'bearer', username: 'admin' };
    }
    throw { response: { status: 401, data: { detail: 'Credenciales incorrectas.' } } };
  },
};

export const mockDashboard = {
  async getStats(): Promise<DashboardStats> {
    await delay();
    return {
      total_activas: mockGuias.filter((g) => g.activa).length,
      total_entregadas: mockGuias.filter((g) => g.estado_actual === 'entregado').length,
      con_novedad: mockGuias.filter((g) => g.estado_actual === 'novedad').length,
      sin_movimiento: mockGuias.filter((g) => g.alertas.some((a) => a.tipo === 'sin_movimiento')).length,
      monitoreadas_hoy: mockGuias.length,
      ultima_ejecucion: '2026-04-22T12:00:00',
      proxima_ejecucion: '2026-04-22T16:00:00',
      proxima_reporte: '2026-04-22T16:00:00',
      proxima_alerta: '2026-04-22T12:30:00',
      proxima_limpieza: '2026-04-27T06:00:00',
      estado_automatizacion: 'ejecutado',
    };
  },
};

export const mockGuiasService = {
  async list(filters?: Record<string, unknown>): Promise<PaginatedResponse<GuiaResumen>> {
    await delay();
    let items = [...mockResumen];
    if (filters?.estado) items = items.filter((g) => g.estado_actual === filters.estado);
    if (filters?.asesor) items = items.filter((g) => g.asesor.toLowerCase().includes(String(filters.asesor).toLowerCase()));
    if (filters?.search) {
      const q = String(filters.search).toLowerCase();
      items = items.filter((g) => g.numero_guia.includes(q) || (g.cliente ?? '').toLowerCase().includes(q));
    }
    if (filters?.activa !== undefined && filters.activa !== '') {
      items = items.filter((g) => g.activa === filters.activa);
    }
    return { items, total: items.length, page: 1, page_size: 50, pages: 1 };
  },

  async getById(id: string): Promise<Guia> {
    await delay();
    const found = mockGuias.find((g) => g.id === id);
    if (!found) throw { response: { status: 404, data: { detail: 'Guía no encontrada.' } } };
    return found;
  },

  async create(payload: { numero_guia: string; asesor: string; cliente?: string }): Promise<Guia> {
    await delay(600);
    const exists = mockGuias.find((g) => g.numero_guia === payload.numero_guia);
    if (exists) throw { response: { status: 409, data: { detail: 'La guía ya existe en el sistema.' } } };
    const nueva: Guia = {
      id: String(Date.now()),
      numero_guia: payload.numero_guia,
      asesor: payload.asesor,
      cliente: payload.cliente,
      estado_actual: 'registrado',
      estado_raw: 'REGISTRADO',
      fecha_creacion: new Date().toISOString(),
      fecha_ultima_actualizacion: new Date().toISOString(),
      dias_en_transito: 0,
      activa: true,
      alertas: [],
      historial: [
        { id: 'h1', fecha: new Date().toISOString(), estado: 'Registrado', descripcion: 'Guía registrada en el sistema', ubicacion: undefined },
      ],
      ultima_novedad: undefined,
      observacion: undefined,
    };
    mockGuias = [nueva, ...mockGuias];
    mockResumen = [
      { id: nueva.id, numero_guia: nueva.numero_guia, asesor: nueva.asesor, cliente: nueva.cliente, estado_actual: nueva.estado_actual, fecha_ultima_actualizacion: nueva.fecha_ultima_actualizacion, dias_en_transito: 0, activa: true, tiene_alerta: false },
      ...mockResumen,
    ];
    return nueva;
  },

  async cerrar(id: string): Promise<Guia> {
    await delay();
    const idx = mockGuias.findIndex((g) => g.id === id);
    if (idx === -1) throw { response: { status: 404, data: { detail: 'Guía no encontrada.' } } };
    mockGuias[idx] = { ...mockGuias[idx], activa: false, estado_actual: 'cerrado' };
    const rIdx = mockResumen.findIndex((g) => g.id === id);
    if (rIdx !== -1) mockResumen[rIdx] = { ...mockResumen[rIdx], activa: false, estado_actual: 'cerrado' };
    return mockGuias[idx];
  },

  async refresh(id: string): Promise<Guia> {
    await delay(800);
    const found = mockGuias.find((g) => g.id === id);
    if (!found) throw { response: { status: 404, data: { detail: 'Guía no encontrada.' } } };
    return { ...found, fecha_ultima_actualizacion: new Date().toISOString() };
  },
};

export const mockSystem = {
  async getHealth(): Promise<SystemHealth> {
    await delay(300);
    return {
      status: 'ok',
      version: '1.0.0-mock',
      uptime_seconds: 3600,
      ultima_consulta_tcc: '2026-04-22T12:00:00',
      scheduler_activo: true,
      scheduler_mode: 'embedded',
      email_configured: true,
      email_mode: 'smtp',
      cron_protected: true,
      total_guias_bd: mockGuias.length,
      bd_conectada: true,
      mensaje: 'Sistema operando normalmente (modo mock)',
    };
  },
};
