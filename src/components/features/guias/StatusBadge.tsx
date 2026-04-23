import { Badge } from '@/components/ui/Badge';
import { getEstadoConfig } from '@/utils/status';
import type { EstadoGuia } from '@/types';

interface StatusBadgeProps {
  estado: EstadoGuia | string;
}

export function StatusBadge({ estado }: StatusBadgeProps) {
  const config = getEstadoConfig(estado);
  return (
    <Badge className={config.badgeClass} dot dotClassName={config.dotClass}>
      {config.label}
    </Badge>
  );
}
