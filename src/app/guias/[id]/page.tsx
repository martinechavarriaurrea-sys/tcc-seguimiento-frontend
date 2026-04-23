'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Clock,
  User,
  Building,
  Hash,
  CalendarDays,
  Truck,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/features/guias/StatusBadge';
import { AlertasList } from '@/components/features/guias/AlertaBadge';
import { GuiaHistorial } from '@/components/features/guias/GuiaHistorial';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useGuia, useCerrarGuia, useRefreshGuia } from '@/hooks/useGuias';
import { formatDate, formatDateTime, formatRelative } from '@/utils/format';
import { HORAS_CRITICO } from '@/lib/constants';
import { cn } from '@/utils/cn';
import { useState } from 'react';
import { differenceInHours, parseISO } from 'date-fns';

interface PageProps {
  params: Promise<{ id: string }>;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.FC<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-gray-900 break-words">{value ?? '—'}</div>
      </div>
    </div>
  );
}

export default function GuiaDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: guia, isLoading, isError } = useGuia(id);
  const { mutate: cerrar, isPending: cerrando } = useCerrarGuia();
  const { mutate: refresh, isPending: refreshing } = useRefreshGuia();
  const [confirmCerrar, setConfirmCerrar] = useState(false);

  const horasSinMovimiento = guia
    ? differenceInHours(new Date(), parseISO(guia.fecha_ultima_actualizacion))
    : 0;
  const esCritico = horasSinMovimiento >= HORAS_CRITICO && guia?.activa;
  const esEntregado = guia?.estado_actual === 'entregado';

  return (
    <DashboardLayout>
      <Header
        title={guia ? `Guía ${guia.numero_guia}` : 'Detalle de guía'}
        subtitle={guia?.cliente ?? undefined}
        actions={
          <Link href="/guias" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Listado
          </Link>
        }
      />

      <div className="p-6">
        {isLoading ? (
          <PageSpinner />
        ) : isError ? (
          <Alert variant="error">
            No se pudo cargar la guía. Verifica que el ID sea correcto.
          </Alert>
        ) : guia ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Columna principal */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              {/* Estado destacado */}
              {esEntregado && (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Entregado exitosamente</p>
                    <p className="text-sm text-green-600">
                      {formatDateTime(guia.fecha_ultima_actualizacion)}
                    </p>
                  </div>
                </div>
              )}

              {esCritico && !esEntregado && (
                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <Clock className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">Sin movimiento hace {horasSinMovimiento}h</p>
                    <p className="text-sm text-red-600">Esta guía supera las {HORAS_CRITICO} horas sin actualización.</p>
                  </div>
                </div>
              )}

              {/* Alertas */}
              {guia.alertas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Alertas activas</CardTitle>
                  </CardHeader>
                  <div className="space-y-2">
                    {guia.alertas.map((alerta) => (
                      <div key={alerta.id} className="rounded-md border border-amber-100 bg-amber-50 p-3">
                        <AlertasList alertas={[alerta]} />
                        <p className="mt-1.5 text-sm text-amber-800">{alerta.mensaje}</p>
                        <p className="mt-1 text-xs text-amber-600">{formatRelative(alerta.fecha)}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Historial */}
              <Card>
                <CardHeader>
                  <CardTitle>Historial de eventos</CardTitle>
                  <span className="text-xs text-gray-400">{guia.historial.length} eventos</span>
                </CardHeader>
                <GuiaHistorial historial={guia.historial} />
              </Card>
            </div>

            {/* Sidebar derecha */}
            <div className="flex flex-col gap-4">
              {/* Info */}
              <Card padding="none">
                <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Información</h3>
                  <StatusBadge estado={guia.estado_actual} />
                </div>
                <div className="px-5">
                  <InfoRow icon={Hash} label="# Guía" value={<span className="font-mono">{guia.numero_guia}</span>} />
                  <InfoRow icon={User} label="Asesor" value={guia.asesor} />
                  <InfoRow icon={Building} label="Cliente" value={guia.cliente} />
                  <InfoRow icon={Truck} label="Estado TCC" value={guia.estado_raw} />
                  <InfoRow icon={CalendarDays} label="Fecha registro" value={formatDate(guia.fecha_creacion)} />
                  <InfoRow
                    icon={Clock}
                    label="Última actualización"
                    value={
                      <span title={formatDateTime(guia.fecha_ultima_actualizacion)}>
                        {formatRelative(guia.fecha_ultima_actualizacion)}
                      </span>
                    }
                  />
                  <InfoRow icon={CalendarDays} label="Días en tránsito" value={`${guia.dias_en_transito} día${guia.dias_en_transito !== 1 ? 's' : ''}`} />
                </div>
                <div className="border-t border-gray-100 px-5 py-3">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                    guia.activa
                      ? 'bg-blue-50 text-blue-700 ring-blue-200'
                      : 'bg-slate-100 text-slate-600 ring-slate-200'
                  )}>
                    {guia.activa ? 'Activa' : 'Cerrada'}
                  </span>
                </div>
              </Card>

              {/* Novedad */}
              {guia.ultima_novedad && (
                <Card>
                  <CardTitle className="mb-2">Última novedad</CardTitle>
                  <p className="text-sm text-gray-700">{guia.ultima_novedad}</p>
                  {guia.observacion && (
                    <p className="mt-2 text-xs text-gray-500">{guia.observacion}</p>
                  )}
                </Card>
              )}

              {/* Acciones */}
              <Card>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Acciones</h3>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    isLoading={refreshing}
                    onClick={() => refresh(guia.id)}
                  >
                    Consultar TCC ahora
                  </Button>

                  {guia.activa && (
                    confirmCerrar ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3">
                        <p className="mb-2 text-xs text-red-700 font-medium">¿Cerrar esta guía?</p>
                        <div className="flex gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            isLoading={cerrando}
                            onClick={() => { cerrar(guia.id); setConfirmCerrar(false); }}
                          >
                            Sí, cerrar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setConfirmCerrar(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                        leftIcon={<XCircle className="h-4 w-4" />}
                        onClick={() => setConfirmCerrar(true)}
                      >
                        Cerrar guía
                      </Button>
                    )
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
