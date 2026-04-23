'use client';

import { ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { GuiaForm } from '@/components/features/guias/GuiaForm';
import { Card } from '@/components/ui/Card';

export default function NuevaGuiaPage() {
  return (
    <DashboardLayout>
      <Header
        title="Registrar guía"
        subtitle="Nuevo ingreso al sistema de seguimiento"
        actions={
          <Link href="/guias" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Link>
        }
      />
      <div className="p-6">
        <div className="mx-auto max-w-lg">
          <Card>
            <div className="mb-6 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Nueva guía TCC</h2>
                <p className="text-xs text-gray-500">El sistema consultará el estado automáticamente</p>
              </div>
            </div>
            <GuiaForm />
          </Card>

          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-medium">¿Cómo funciona?</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-blue-600">
              <li>Ingresa el número de guía y el asesor responsable</li>
              <li>El sistema consulta el estado en TCC automáticamente</li>
              <li>Recibirás actualizaciones a las 7AM, 12PM y 4PM</li>
              <li>Las alertas se generan automáticamente ante novedades</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
