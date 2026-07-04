/**
 * CSV Export Module
 * Generates CSV files with UTF-8 encoding and comma separator.
 * Handles proper escaping of fields containing commas, quotes, or newlines.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

export const EXPORT_COLUMNS = [
  'Fecha',
  'Mes',
  'Año',
  'Tipo',
  'Categoría',
  'Concepto',
  'Detalle',
  'Presupuesto',
  'Monto',
  'Moneda',
  'Notas',
];

export const IMPORT_TEMPLATE_COLUMNS = [
  'Fecha',
  'Tipo',
  'Categoría',
  'Concepto',
  'Detalle',
  'Presupuesto',
  'Monto',
  'Moneda',
  'Notas',
];

export interface TransactionRecord {
  date: string;
  month: string;
  year: number;
  type: 'Ingreso' | 'Egreso';
  categoryName: string;
  conceptName: string;
  detail?: string;
  budget?: number;
  amount: number;
  currency: string;
  notes?: string;
}

/**
 * Escapes a CSV field value.
 * Fields containing commas, double quotes, or newlines are wrapped in double quotes.
 * Double quotes within fields are escaped by doubling them.
 */
function escapeField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Converts a TransactionRecord to a CSV row array.
 */
function recordToRow(record: TransactionRecord): string[] {
  return [
    record.date,
    record.month,
    String(record.year),
    record.type,
    record.categoryName,
    record.conceptName,
    record.detail ?? '',
    record.budget != null ? String(record.budget) : '',
    String(record.amount),
    record.currency,
    record.notes ?? '',
  ];
}

/**
 * Generates a CSV string from transaction records.
 * Includes header row + one data row per transaction.
 * Returns only headers if records is empty.
 * Fields with commas, quotes, or newlines are properly escaped.
 */
export function generateCSV(records: TransactionRecord[]): string {
  const headerRow = EXPORT_COLUMNS.map(escapeField).join(',');
  const lines = [headerRow];

  for (const record of records) {
    const row = recordToRow(record).map(escapeField).join(',');
    lines.push(row);
  }

  return lines.join('\n');
}

/**
 * Generates the import template CSV (headers only).
 */
export function generateImportTemplate(): string {
  return IMPORT_TEMPLATE_COLUMNS.map(escapeField).join(',');
}

/**
 * Triggers a file download in the browser with the given content.
 * Creates a Blob with UTF-8 BOM for proper encoding in spreadsheet apps.
 */
export function downloadCSV(content: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
