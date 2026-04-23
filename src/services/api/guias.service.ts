import type { Guia, GuiaResumen, GuiasFilters, PaginatedResponse, RegistrarGuiaPayload } from '@/types';
import { IS_MOCK } from '@/lib/constants';
import { apiClient } from './client';
import { mockGuiasService } from './mock';

export const guiasService = {
  async list(filters?: GuiasFilters): Promise<PaginatedResponse<GuiaResumen>> {
    if (IS_MOCK) return mockGuiasService.list(filters as Record<string, unknown>);
    const params = new URLSearchParams();
    if (filters?.estado) params.set('estado', filters.estado);
    if (filters?.asesor) params.set('asesor', filters.asesor);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.activa !== undefined && filters.activa !== '') params.set('activa', String(filters.activa));
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.page_size) params.set('page_size', String(filters.page_size));
    const { data } = await apiClient.get<PaginatedResponse<GuiaResumen>>(`/guias?${params}`);
    return data;
  },

  async getById(id: string): Promise<Guia> {
    if (IS_MOCK) return mockGuiasService.getById(id);
    const { data } = await apiClient.get<Guia>(`/guias/${id}`);
    return data;
  },

  async create(payload: RegistrarGuiaPayload): Promise<Guia> {
    if (IS_MOCK) return mockGuiasService.create(payload);
    const { data } = await apiClient.post<Guia>('/guias', payload);
    return data;
  },

  async cerrar(id: string): Promise<Guia> {
    if (IS_MOCK) return mockGuiasService.cerrar(id);
    const { data } = await apiClient.patch<Guia>(`/guias/${id}/cerrar`);
    return data;
  },

  async refresh(id: string): Promise<Guia> {
    if (IS_MOCK) return mockGuiasService.refresh(id);
    const { data } = await apiClient.post<Guia>(`/guias/${id}/refresh`);
    return data;
  },
};
