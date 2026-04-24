'use client';

import { useState } from 'react';
import { CalendarDays, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { reportsService } from '@/services/api/reports.service';

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 14);
  return toDateInputValue(date);
}

function getToday(): string {
  return toDateInputValue(new Date());
}

export function PdfDownloadPanel() {
  const today = getToday();
  const [fechaInicio, setFechaInicio] = useState(getDefaultStartDate);
  const [fechaFin, setFechaFin] = useState(today);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInvalidRange = fechaInicio > fechaFin;

  async function handleDownload() {
    if (isInvalidRange) {
      setError('La fecha inicio no puede ser posterior a la fecha fin.');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      await reportsService.downloadRangePdf({ fechaInicio, fechaFin });
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Error al descargar el PDF.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FileDown className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Descargar informe PDF</h2>
            <p className="text-xs text-gray-500">Rango de fechas</p>
          </div>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">PDF</span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div className="relative">
          <Input
            label="Fecha inicio"
            type="date"
            value={fechaInicio}
            max={fechaFin}
            onChange={(event) => setFechaInicio(event.target.value)}
            className="min-w-[160px] pl-9"
          />
          <CalendarDays className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-gray-400" />
        </div>

        <div className="relative">
          <Input
            label="Fecha fin"
            type="date"
            value={fechaFin}
            min={fechaInicio}
            max={today}
            onChange={(event) => setFechaFin(event.target.value)}
            className="min-w-[160px] pl-9"
          />
          <CalendarDays className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-gray-400" />
        </div>

        <Button
          type="button"
          onClick={handleDownload}
          isLoading={isDownloading}
          disabled={isInvalidRange}
          leftIcon={<FileDown className="h-4 w-4" />}
          className="h-10 w-full md:w-auto"
        >
          {isDownloading ? 'Generando...' : 'Descargar PDF'}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
