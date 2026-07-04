/**
 * FileImporter Component
 *
 * Handles file upload, parsing, validation, and import of CSV files.
 * Supports .csv, .xlsx, .xls file extensions (CSV parsing implemented,
 * Excel parsing requires adding a library like `xlsx`/`sheetjs`).
 *
 * Flow:
 * 1. User selects a file → validate format and extension
 * 2. Parse CSV → validate columns → show preview of first 10 rows
 * 3. User confirms → process each row → show summary
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ImportPreview } from './ImportPreview';
import {
  validateImportFile,
  validateImportColumns,
  validateImportRow,
  REQUIRED_IMPORT_COLUMNS,
  type ImportRowError,
} from '@/lib/validators/import';
import { extractMonth, extractYear } from '@/lib/utils/dates';

export interface ImportedTransaction {
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

export interface ImportResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: ImportRowError[];
}

export interface ImportBatchData {
  filename: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: ImportRowError[];
  status: 'completed' | 'partial' | 'failed';
}

type ImportStep = 'select' | 'preview' | 'processing' | 'summary';

export interface FileImporterProps {
  onImportComplete?: (transactions: ImportedTransaction[], batch: ImportBatchData) => void;
}

/**
 * Parses a CSV string into an array of row objects using the header row as keys.
 * Handles quoted fields and fields with commas inside quotes.
 */
function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? '').trim();
    }
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Parses a single CSV line, handling quoted fields correctly.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ""
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current);

  return fields;
}

/**
 * Parses a date string into ISO format (YYYY-MM-DD) for consistent storage.
 * Supports: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 */
function normalizeDateToISO(dateStr: string): string {
  const trimmed = dateStr.trim();

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const match = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try native Date parse as fallback
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return trimmed;
}

export function FileImporter({ onImportComplete }: FileImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>('select');
  const [filename, setFilename] = useState('');
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<Record<string, string>[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [previewErrors, setPreviewErrors] = useState<Map<number, ImportRowError[]>>(new Map());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handles file selection and initial validation.
   * Requirement 7.1, 7.2
   */
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileErrors([]);
    setFilename(file.name);

    // Validate file extension and basic properties
    const lowerName = file.name.toLowerCase();
    const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

    if (isExcel) {
      setFileErrors([
        'Los archivos Excel (.xlsx, .xls) requieren una librería adicional. Por favor, use un archivo CSV (.csv).',
      ]);
      setStep('select');
      return;
    }

    // Read and parse CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content || content.trim() === '') {
        setFileErrors(['El archivo está vacío o no contiene datos']);
        setStep('select');
        return;
      }

      const { headers: parsedHeaders, rows: parsedRows } = parseCSV(content);

      // Validate file format (extension + row count) - Req 7.2
      const fileValidation = validateImportFile(file.name, parsedRows.length);
      if (!fileValidation.isValid) {
        setFileErrors(fileValidation.errors);
        setStep('select');
        return;
      }

      // Validate columns - Req 7.1
      const columnValidation = validateImportColumns(parsedHeaders);
      if (!columnValidation.isValid) {
        setFileErrors(columnValidation.errors);
        setStep('select');
        return;
      }

      // Store parsed data
      setHeaders(parsedHeaders);
      setAllRows(parsedRows);

      // Generate preview (first 10 rows) - Req 7.3
      const preview = parsedRows.slice(0, 10);
      setPreviewRows(preview);

      // Validate preview rows for visual indicators
      const errorsMap = new Map<number, ImportRowError[]>();
      preview.forEach((row, index) => {
        const rowNumber = index + 2; // Row 1 is headers
        const result = validateImportRow(row, rowNumber);
        if (!result.isValid) {
          errorsMap.set(rowNumber, result.errors);
        }
      });
      setPreviewErrors(errorsMap);

      setStep('preview');
    };

    reader.onerror = () => {
      setFileErrors(['Error al leer el archivo. Intente de nuevo.']);
      setStep('select');
    };

    reader.readAsText(file, 'UTF-8');
  }, []);

  /**
   * Processes all rows, creating transactions for valid rows and logging errors for invalid ones.
   * Requirements: 7.4, 7.5, 7.6
   */
  const handleConfirmImport = useCallback(async () => {
    setIsProcessing(true);
    setStep('processing');

    const successfulTransactions: ImportedTransaction[] = [];
    const allErrors: ImportRowError[] = [];

    // Process row by row - Req 7.4, 7.5
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      const rowNumber = i + 2; // Row 1 is headers

      const validation = validateImportRow(row, rowNumber);

      if (!validation.isValid) {
        // Skip invalid rows, register errors - Req 7.5
        allErrors.push(...validation.errors);
        continue;
      }

      // Create transaction from valid row - Req 7.4
      const dateStr = normalizeDateToISO(row['Fecha']);
      let month: string;
      let year: number;

      try {
        month = extractMonth(dateStr);
        year = extractYear(dateStr);
      } catch {
        month = '';
        year = new Date().getFullYear();
      }

      const budgetStr = (row['Presupuesto'] ?? '').trim();
      const budget = budgetStr ? parseFloat(budgetStr) : undefined;

      const transaction: ImportedTransaction = {
        date: dateStr,
        month,
        year,
        type: row['Tipo'].trim() as 'Ingreso' | 'Egreso',
        categoryName: row['Categoría'].trim(),
        conceptName: row['Concepto'].trim(),
        detail: row['Detalle']?.trim() || undefined,
        budget: budget && !isNaN(budget) && budget > 0 ? budget : undefined,
        amount: parseFloat((row['Monto'] ?? row['Monto real'] ?? '').trim()),
        currency: row['Moneda']?.trim() || 'COP',
        notes: row['Notas']?.trim() || undefined,
      };

      successfulTransactions.push(transaction);
    }

    // Build import result summary - Req 7.6
    const result: ImportResult = {
      totalProcessed: allRows.length,
      successful: successfulTransactions.length,
      failed: allRows.length - successfulTransactions.length,
      errors: allErrors,
    };

    setImportResult(result);
    setStep('summary');
    setIsProcessing(false);

    // Create ImportBatch record and notify parent - Req 7.4
    const batchData: ImportBatchData = {
      filename,
      totalRows: allRows.length,
      successfulRows: successfulTransactions.length,
      failedRows: allRows.length - successfulTransactions.length,
      errors: allErrors,
      status:
        successfulTransactions.length === allRows.length
          ? 'completed'
          : successfulTransactions.length === 0
            ? 'failed'
            : 'partial',
    };

    if (onImportComplete) {
      onImportComplete(successfulTransactions, batchData);
    }
  }, [allRows, filename, onImportComplete]);

  /**
   * Resets the importer to initial state.
   */
  const handleReset = useCallback(() => {
    setStep('select');
    setFilename('');
    setFileErrors([]);
    setHeaders([]);
    setAllRows([]);
    setPreviewRows([]);
    setPreviewErrors(new Map());
    setImportResult(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Importar datos</h2>
        <p className="text-sm text-muted-foreground">
          Cargue un archivo CSV con sus transacciones. El archivo debe contener las columnas:{' '}
          {REQUIRED_IMPORT_COLUMNS.join(', ')}.
        </p>
      </div>

      {/* Step: File Selection */}
      {step === 'select' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="import-file"
              className="text-sm font-medium"
            >
              Seleccionar archivo
            </label>
            <input
              ref={fileInputRef}
              id="import-file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/80 cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceptados: CSV (.csv). Máximo 10,000 filas.
            </p>
          </div>

          {fileErrors.length > 0 && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 space-y-1">
              {fileErrors.map((error, index) => (
                <p key={index} className="text-sm text-destructive">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/30 p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{filename}</p>
              <p className="text-xs text-muted-foreground">
                {allRows.length} fila(s) de datos encontrada(s)
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Cambiar archivo
            </Button>
          </div>

          <ImportPreview
            headers={headers}
            rows={previewRows}
            rowErrors={previewErrors}
          />

          <div className="flex gap-3">
            <Button onClick={handleConfirmImport}>
              Confirmar importación
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && isProcessing && (
        <div className="flex flex-col items-center justify-center gap-3 p-8">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">
            Procesando {allRows.length} filas...
          </p>
        </div>
      )}

      {/* Step: Summary - Req 7.6 */}
      {step === 'summary' && importResult && (
        <div className="space-y-4">
          <div className="rounded-md border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Resumen de importación</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-md border border-border p-3 text-center">
                <p className="text-2xl font-bold">{importResult.totalProcessed}</p>
                <p className="text-xs text-muted-foreground">Total procesadas</p>
              </div>
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-center dark:border-green-800 dark:bg-green-900/20">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {importResult.successful}
                </p>
                <p className="text-xs text-muted-foreground">Exitosas</p>
              </div>
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-center dark:border-red-800 dark:bg-red-900/20">
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {importResult.failed}
                </p>
                <p className="text-xs text-muted-foreground">Con error</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">
                  Detalle de errores ({importResult.errors.length})
                </h4>
                <div className="max-h-60 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-destructive/20">
                        <th className="px-2 py-1 text-left font-medium">Fila</th>
                        <th className="px-2 py-1 text-left font-medium">Campo</th>
                        <th className="px-2 py-1 text-left font-medium">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((error, index) => (
                        <tr key={index} className="border-b border-destructive/10 last:border-0">
                          <td className="px-2 py-1">{error.row}</td>
                          <td className="px-2 py-1">{error.field}</td>
                          <td className="px-2 py-1">{error.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleReset}>
            Importar otro archivo
          </Button>
        </div>
      )}
    </div>
  );
}
