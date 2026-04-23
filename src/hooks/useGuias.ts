import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { guiasService } from '@/services/api/guias.service';
import { QUERY_KEYS, STALE_TIMES } from '@/lib/constants';
import { extractApiErrorMessage } from '@/utils/format';
import type { GuiasFilters, RegistrarGuiaPayload } from '@/types';

export function useGuias(filters?: GuiasFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.guias, filters],
    queryFn: () => guiasService.list(filters),
    staleTime: STALE_TIMES.guias,
  });
}

export function useGuia(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.guia(id),
    queryFn: () => guiasService.getById(id),
    staleTime: STALE_TIMES.guia,
    enabled: !!id,
  });
}

export function useRegistrarGuia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegistrarGuiaPayload) => guiasService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guias });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(`Guía ${data.numero_guia} registrada correctamente.`);
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export function useCerrarGuia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => guiasService.cerrar(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guias });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guia(data.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(`Guía ${data.numero_guia} cerrada.`);
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export function useRefreshGuia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => guiasService.refresh(id),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.guia(data.id), data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guias });
      toast.success('Estado actualizado desde TCC.');
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },
  });
}
