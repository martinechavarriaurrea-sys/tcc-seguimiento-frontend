import { MapPin } from 'lucide-react';
import { formatDateTime } from '@/utils/format';
import type { EventoHistorial } from '@/types';
import { cn } from '@/utils/cn';

interface GuiaHistorialProps {
  historial: EventoHistorial[];
}

export function GuiaHistorial({ historial }: GuiaHistorialProps) {
  if (!historial.length) {
    return <p className="py-4 text-center text-sm text-gray-400">Sin eventos registrados.</p>;
  }

  const sorted = [...historial].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <ol className="relative border-l border-gray-200 pl-6">
      {sorted.map((evento, idx) => (
        <li key={evento.id} className={cn('mb-6 last:mb-0', idx === 0 && 'font-medium')}>
          <span
            className={cn(
              'absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white',
              idx === 0 ? 'bg-blue-600' : 'bg-gray-300'
            )}
          />
          <time className="mb-0.5 block text-xs font-normal text-gray-400">
            {formatDateTime(evento.fecha)}
          </time>
          <p className="text-sm text-gray-900">{evento.descripcion}</p>
          <p className="mt-0.5 text-xs text-gray-500">{evento.estado}</p>
          {evento.ubicacion && (
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3" />
              {evento.ubicacion}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
