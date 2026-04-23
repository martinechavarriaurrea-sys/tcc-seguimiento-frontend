'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useCerrarGuia, useGuias } from '@/hooks/useGuias';
import { formatDateTime } from '@/utils/format';
import type { EstadoGuia, GuiasFilters } from '@/types';
import { ESTADO_CONFIG } from '@/utils/status';
import { cn } from '@/utils/cn';

export function GuiasTable() {
  const [filters, setFilters] = useState<GuiasFilters>({});
  const { data, isLoading, isError } = useGuias(filters);
  const { mutate: cerrar, isPending: cerrando } = useCerrarGuia();
  const [confirmCerrar, setConfirmCerrar] = useState<string | null>(null);

  const guias = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="min-w-[180px]">
          <Input
            label="Buscar"
            placeholder="# guía o cliente..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
          />
        </div>
        <div className="min-w-[160px]">
          <Select
            label="Estado"
            value={filters.estado ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, estado: (e.target.value as EstadoGuia) || undefined }))}
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
        </div>
        <div className="min-w-[140px]">
          <Select
            label="Estado operativo"
            value={filters.activa === undefined ? '' : String(filters.activa)}
            onChange={(e) => {
              const v = e.target.value;
              setFilters((f) => ({ ...f, activa: v === '' ? undefined : v === 'true' }));
            }}
          >
            <option value="">Todas</option>
            <option value="true">Activas</option>
            <option value="false">Cerradas</option>
          </Select>
        </div>
        <div className="min-w-[160px]">
          <Input
            label="Asesor"
            placeholder="Filtrar por asesor..."
            value={filters.asesor ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, asesor: e.target.value || undefined }))}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFilters({})}
          className="self-end text-gray-500"
        >
          Limpiar filtros
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" className="text-blue-600" />
          </div>
        ) : isError ? (
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8 text-red-400" />}
            title="Error al cargar guías"
            description="No se pudieron obtener las guías. Verifica la conexión con el servidor."
          />
        ) : guias.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron guías con los filtros aplicados."
            action={
              <Button variant="secondary" size="sm" onClick={() => setFilters({})}>
                Ver todas
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['# Guía', 'Asesor', 'Cliente', 'Estado', 'Última actualización', 'Días', 'Alerta', ''].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {guias.map((g) => (
                    <tr key={g.id} className={cn('transition-colors hover:bg-gray-50', !g.activa && 'opacity-60')}>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-gray-900">
                        {g.numero_guia}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{g.asesor}</td>
                      <td className="px-4 py-3 text-gray-600">{g.cliente ?? <span className="text-gray-400">—</span>}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge estado={g.estado_actual} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        {formatDateTime(g.fecha_ultima_actualizacion)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-gray-700">
                        {g.dias_en_transito}d
                      </td>
                      <td className="px-4 py-3">
                        {g.tiene_alerta && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/guias/${g.id}`}>
                            <Button variant="ghost" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />}>
                              Ver
                            </Button>
                          </Link>
                          {g.activa && (
                            confirmCerrar === g.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  isLoading={cerrando}
                                  onClick={() => { cerrar(g.id); setConfirmCerrar(null); }}
                                >
                                  Confirmar
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setConfirmCerrar(null)}>
                                  No
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                leftIcon={<XCircle className="h-3.5 w-3.5" />}
                                onClick={() => setConfirmCerrar(g.id)}
                              >
                                Cerrar
                              </Button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
              {data?.total ?? 0} guía{(data?.total ?? 0) !== 1 ? 's' : ''} encontrada{(data?.total ?? 0) !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
