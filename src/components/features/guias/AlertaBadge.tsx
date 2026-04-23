import { AlertTriangle, Clock, AlertOctagon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ALERTA_CONFIG } from '@/utils/status';
import type { Alerta, TipoAlerta } from '@/types';

const ICONS: Record<TipoAlerta, React.FC<{ className?: string }>> = {
  sin_movimiento: Clock,
  novedad: AlertTriangle,
  retraso: AlertOctagon,
};

export function AlertaBadge({ alerta }: { alerta: Alerta }) {
  const config = ALERTA_CONFIG[alerta.tipo];
  const Icon = ICONS[alerta.tipo];
  return (
    <Badge className={config.badgeClass}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function AlertasList({ alertas }: { alertas: Alerta[] }) {
  if (!alertas.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {alertas.map((a) => (
        <AlertaBadge key={a.id} alerta={a} />
      ))}
    </div>
  );
}
