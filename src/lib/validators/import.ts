/**
 * Validador de Importación
 *
 * Valida archivos de importación: columnas requeridas, formato de archivo,
 * y cada fila contra las reglas de transacción.
 *
 * Requirements: 7.1, 7.2, 7.5
 */

export const REQUIRED_IMPORT_COLUMNS = [
  'Fecha',
  'Tipo',
  'Categoría',
  'Concepto',
  'Detalle',
  'Presupuesto',
  'Monto real',
  'Moneda',
  'Notas',
];

export interface ImportFileValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ImportRowError {
  row: number;
  field: string;
  message: string;
}

export interface ImportRowValidationResult {
  isValid: boolean;
  errors: ImportRowError[];
}

const VALID_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
const MAX_ROWS = 10_000;
const VALID_TYPES = ['Ingreso', 'Egreso'];

/**
 * Valida que las columnas del archivo contengan todas las columnas requeridas.
 * Requirement 7.1
 */
export function validateImportColumns(headers: string[]): ImportFileValidationResult {
  const errors: string[] = [];
  const normalizedHeaders = headers.map((h) => h.trim());

  for (const required of REQUIRED_IMPORT_COLUMNS) {
    if (!normalizedHeaders.includes(required)) {
      errors.push(`Columna requerida faltante: "${required}"`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida el formato del archivo y la cantidad de filas.
 * - Extensión debe ser .csv, .xlsx, o .xls
 * - rowCount debe ser > 0 y <= 10,000
 * Requirement 7.2
 */
export function validateImportFile(filename: string, rowCount: number): ImportFileValidationResult {
  const errors: string[] = [];

  // Validar extensión del archivo
  const lowerFilename = filename.toLowerCase();
  const hasValidExtension = VALID_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext));
  if (!hasValidExtension) {
    errors.push(
      `Formato de archivo no soportado. Solo se permiten archivos CSV (.csv) o Excel (.xlsx, .xls)`
    );
  }

  // Validar que no esté vacío
  if (rowCount <= 0) {
    errors.push('El archivo está vacío o no contiene filas de datos');
  }

  // Validar máximo de filas
  if (rowCount > MAX_ROWS) {
    errors.push(`El archivo excede el máximo de ${MAX_ROWS.toLocaleString()} filas permitidas (tiene ${rowCount.toLocaleString()} filas)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida una fila individual del archivo de importación contra las reglas de transacción.
 * - Fecha: debe tener formato de fecha válido
 * - Tipo: debe ser 'Ingreso' o 'Egreso'
 * - Categoría: no puede estar vacía
 * - Concepto: no puede estar vacío
 * - Monto real: debe ser numérico y mayor a 0
 * Requirement 7.5
 */
export function validateImportRow(
  row: Record<string, string>,
  rowNumber: number
): ImportRowValidationResult {
  const errors: ImportRowError[] = [];

  // Validar Fecha
  const fecha = (row['Fecha'] ?? '').trim();
  if (!isValidDate(fecha)) {
    errors.push({
      row: rowNumber,
      field: 'Fecha',
      message: 'Formato de fecha no reconocido',
    });
  }

  // Validar Tipo
  const tipo = (row['Tipo'] ?? '').trim();
  if (!VALID_TYPES.includes(tipo)) {
    errors.push({
      row: rowNumber,
      field: 'Tipo',
      message: `Tipo inválido. Debe ser "Ingreso" o "Egreso"`,
    });
  }

  // Validar Categoría
  const categoria = (row['Categoría'] ?? '').trim();
  if (categoria === '') {
    errors.push({
      row: rowNumber,
      field: 'Categoría',
      message: 'La categoría es obligatoria',
    });
  }

  // Validar Concepto
  const concepto = (row['Concepto'] ?? '').trim();
  if (concepto === '') {
    errors.push({
      row: rowNumber,
      field: 'Concepto',
      message: 'El concepto es obligatorio',
    });
  }

  // Validar Monto real
  const montoStr = (row['Monto real'] ?? '').trim();
  const monto = Number(montoStr);
  if (montoStr === '' || isNaN(monto) || monto <= 0) {
    errors.push({
      row: rowNumber,
      field: 'Monto real',
      message: 'El monto debe ser un número mayor a 0',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Verifica si un string tiene un formato de fecha válido.
 * Acepta formatos comunes: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY
 */
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;

  // Intentar parsear directamente con Date
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return true;
  }

  // Intentar formato DD/MM/YYYY
  const ddmmyyyy = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;
  const match = dateStr.match(ddmmyyyy);
  if (match) {
    const [, day, month, year] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return (
      !isNaN(parsed.getTime()) &&
      parsed.getDate() === Number(day) &&
      parsed.getMonth() === Number(month) - 1 &&
      parsed.getFullYear() === Number(year)
    );
  }

  return false;
}
