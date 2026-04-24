import { isAxiosError } from 'axios';
import { apiClient } from './client';

export interface PdfDateRange {
  fechaInicio: string;
  fechaFin: string;
}

const PDF_MEDIA_TYPE = 'application/pdf';

function buildRangePdfFilename({ fechaInicio, fechaFin }: PdfDateRange): string {
  return `informe_tcc_${fechaInicio}_al_${fechaFin}.pdf`;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
}

async function getErrorMessage(error: unknown): Promise<string> {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Error al generar el PDF.';
  }

  const data = error.response?.data;
  if (data instanceof Blob) {
    const text = await data.text();
    try {
      const parsed = JSON.parse(text) as { detail?: string; message?: string };
      return parsed.detail || parsed.message || `Error ${error.response?.status ?? ''}`.trim();
    } catch {
      return text || `Error ${error.response?.status ?? ''}`.trim();
    }
  }

  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;
  return error.message || 'Error al generar el PDF.';
}

export const reportsService = {
  async downloadRangePdf(range: PdfDateRange): Promise<void> {
    try {
      const response = await apiClient.get<Blob>('/reports/range', {
        params: {
          fecha_inicio: range.fechaInicio,
          fecha_fin: range.fechaFin,
        },
        responseType: 'blob',
        headers: {
          Accept: PDF_MEDIA_TYPE,
        },
      });

      const blob = new Blob([response.data], { type: PDF_MEDIA_TYPE });
      triggerBrowserDownload(blob, buildRangePdfFilename(range));
    } catch (error) {
      throw new Error(await getErrorMessage(error));
    }
  },
};
