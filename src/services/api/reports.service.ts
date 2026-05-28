import { isAxiosError } from 'axios';
import { apiClient } from './client';

export interface ReportDateRange {
  fechaInicio: string;
  fechaFin: string;
}

/** @deprecated use ReportDateRange */
export type PdfDateRange = ReportDateRange;

const PDF_MEDIA_TYPE = 'application/pdf';
const XLSX_MEDIA_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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

async function getErrorMessage(error: unknown, defaultMsg = 'Error al generar el informe.'): Promise<string> {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : defaultMsg;
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
  return error.message || defaultMsg;
}

export const reportsService = {
  async downloadRangePdf(range: ReportDateRange): Promise<void> {
    try {
      const response = await apiClient.get<Blob>('/reports/range', {
        params: {
          fecha_inicio: range.fechaInicio,
          fecha_fin: range.fechaFin,
          format: 'pdf',
        },
        responseType: 'blob',
        headers: { Accept: PDF_MEDIA_TYPE },
      });

      const blob = new Blob([response.data], { type: PDF_MEDIA_TYPE });
      triggerBrowserDownload(blob, `informe_tcc_${range.fechaInicio}_al_${range.fechaFin}.pdf`);
    } catch (error) {
      throw new Error(await getErrorMessage(error, 'Error al generar el PDF.'));
    }
  },

  async downloadRangeExcel(range: ReportDateRange): Promise<void> {
    try {
      const response = await apiClient.get<Blob>('/reports/range', {
        params: {
          fecha_inicio: range.fechaInicio,
          fecha_fin: range.fechaFin,
          format: 'xlsx',
        },
        responseType: 'blob',
        headers: { Accept: XLSX_MEDIA_TYPE },
      });

      const blob = new Blob([response.data], { type: XLSX_MEDIA_TYPE });
      triggerBrowserDownload(blob, `informe_tcc_${range.fechaInicio}_al_${range.fechaFin}.xlsx`);
    } catch (error) {
      throw new Error(await getErrorMessage(error, 'Error al generar el Excel.'));
    }
  },
};
