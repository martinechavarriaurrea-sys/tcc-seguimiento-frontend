import type { EstadoGuia, TipoAlerta } from '@/types';

interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const ESTADO_CONFIG: Record<EstadoGuia, StatusConfig> = {
  registrado: {
    label: 'Registrado',
    badgeClass: 'bg-gray-100 text-gray-700 ring-gray-200',
    dotClass: 'bg-gray-400',
  },
  recogido: {
    label: 'Recogido',
    badgeClass: 'bg-sky-100 text-sky-700 ring-sky-200',
    dotClass: 'bg-sky-500',
  },
  en_transito: {
    label: 'En tránsito',
    badgeClass: 'bg-blue-100 text-blue-700 ring-blue-200',
    dotClass: 'bg-blue-500',
  },
  en_ruta_entrega: {
    label: 'En ruta de entrega',
    badgeClass: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
    dotClass: 'bg-indigo-500',
  },
  entregado: {
    label: 'Entregado',
    badgeClass: 'bg-green-100 text-green-700 ring-green-200',
    dotClass: 'bg-green-500',
  },
  novedad: {
    label: 'Novedad',
    badgeClass: 'bg-amber-100 text-amber-700 ring-amber-200',
    dotClass: 'bg-amber-500',
  },
  devuelto: {
    label: 'Devuelto',
    badgeClass: 'bg-orange-100 text-orange-700 ring-orange-200',
    dotClass: 'bg-orange-500',
  },
  cerrado: {
    label: 'Cerrado',
    badgeClass: 'bg-slate-100 text-slate-600 ring-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export function getEstadoConfig(estado: string): StatusConfig {
  return (
    ESTADO_CONFIG[estado as EstadoGuia] ?? {
      label: estado,
      badgeClass: 'bg-gray-100 text-gray-700 ring-gray-200',
      dotClass: 'bg-gray-400',
    }
  );
}

interface AlertaConfig {
  label: string;
  badgeClass: string;
  icon: string;
}

export const ALERTA_CONFIG: Record<TipoAlerta, AlertaConfig> = {
  sin_movimiento: {
    label: 'Sin movimiento',
    badgeClass: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
    icon: 'clock',
  },
  novedad: {
    label: 'Novedad',
    badgeClass: 'bg-amber-100 text-amber-800 ring-amber-200',
    icon: 'alert-triangle',
  },
  retraso: {
    label: 'Retraso',
    badgeClass: 'bg-red-100 text-red-800 ring-red-200',
    icon: 'alert-octagon',
  },
};
