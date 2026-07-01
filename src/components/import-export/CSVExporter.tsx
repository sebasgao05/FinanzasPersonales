import { Download, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateCSV, generateImportTemplate, downloadCSV, type TransactionRecord as CSVTransactionRecord } from '@/lib/export/csv';
import type { TransactionRecord } from '@/lib/utils/filtering';

export interface CSVExporterProps {
  filteredTransactions: TransactionRecord[];
}

/**
 * Maps TransactionRecord from filtering module to the CSV export format.
 */
function toCSVRecords(records: TransactionRecord[]): CSVTransactionRecord[] {
  return records.map((r) => ({
    date: r.date,
    month: r.month,
    year: r.year,
    type: r.type,
    categoryName: r.categoryName,
    conceptName: r.conceptName,
    detail: r.detail,
    budget: r.budget,
    amount: r.amount,
    currency: r.currency,
    notes: r.notes,
  }));
}

/**
 * CSVExporter renders export action buttons:
 * - "Exportar CSV" generates a CSV file with all filtered records (Req 6.1, 6.2, 6.4)
 * - "Descargar plantilla" generates an import template CSV (Req 6.3)
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function CSVExporter({ filteredTransactions }: CSVExporterProps) {
  const handleExportCSV = () => {
    const csvRecords = toCSVRecords(filteredTransactions);
    const csvContent = generateCSV(csvRecords);
    downloadCSV(csvContent, 'transacciones.csv');
  };

  const handleDownloadTemplate = () => {
    const templateContent = generateImportTemplate();
    downloadCSV(templateContent, 'plantilla-importacion.csv');
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Exportar CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownloadTemplate}
        className="flex items-center gap-2"
      >
        <FileDown className="h-4 w-4" />
        Descargar plantilla
      </Button>
    </div>
  );
}
