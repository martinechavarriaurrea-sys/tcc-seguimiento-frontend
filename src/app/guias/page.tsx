'use client';

import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { GuiasTable } from '@/components/features/guias/GuiasTable';
import { Button } from '@/components/ui/Button';

export default function GuiasPage() {
  return (
    <DashboardLayout>
      <Header
        title="Guías"
        subtitle="Seguimiento de todos los envíos registrados"
        actions={
          <Link href="/guias/nueva">
            <Button size="sm" leftIcon={<PlusCircle className="h-4 w-4" />}>
              Registrar guía
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <GuiasTable />
      </div>
    </DashboardLayout>
  );
}
