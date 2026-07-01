import { describe, it, expect } from 'vitest';
import {
  validateImportColumns,
  validateImportFile,
  validateImportRow,
  REQUIRED_IMPORT_COLUMNS,
} from './import';

describe('validateImportColumns', () => {
  it('should accept headers with all required columns', () => {
    const result = validateImportColumns([...REQUIRED_IMPORT_COLUMNS]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept headers with extra columns beyond required', () => {
    const headers = [...REQUIRED_IMPORT_COLUMNS, 'Extra1', 'Extra2'];
    const result = validateImportColumns(headers);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject when a required column is missing', () => {
    const headers = REQUIRED_IMPORT_COLUMNS.filter((h) => h !== 'Fecha');
    const result = validateImportColumns(headers);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Fecha');
  });

  it('should report all missing columns', () => {
    const result = validateImportColumns([]);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(REQUIRED_IMPORT_COLUMNS.length);
  });

  it('should trim header whitespace', () => {
    const headers = REQUIRED_IMPORT_COLUMNS.map((h) => `  ${h}  `);
    const result = validateImportColumns(headers);
    expect(result.isValid).toBe(true);
  });
});

describe('validateImportFile', () => {
  it('should accept a valid CSV file with rows within range', () => {
    const result = validateImportFile('datos.csv', 100);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept a valid .xlsx file', () => {
    const result = validateImportFile('datos.xlsx', 50);
    expect(result.isValid).toBe(true);
  });

  it('should accept a valid .xls file', () => {
    const result = validateImportFile('datos.xls', 1);
    expect(result.isValid).toBe(true);
  });

  it('should reject unsupported file formats', () => {
    const result = validateImportFile('datos.pdf', 10);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Formato de archivo no soportado');
  });

  it('should reject empty files (rowCount 0)', () => {
    const result = validateImportFile('datos.csv', 0);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('vacío');
  });

  it('should reject negative rowCount', () => {
    const result = validateImportFile('datos.csv', -1);
    expect(result.isValid).toBe(false);
  });

  it('should reject files exceeding 10,000 rows', () => {
    const result = validateImportFile('datos.csv', 10_001);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('10');
    expect(result.errors[0]).toContain('filas');
  });

  it('should accept exactly 10,000 rows', () => {
    const result = validateImportFile('datos.csv', 10_000);
    expect(result.isValid).toBe(true);
  });

  it('should be case-insensitive for file extensions', () => {
    const result = validateImportFile('datos.CSV', 10);
    expect(result.isValid).toBe(true);
  });

  it('should report multiple errors at once', () => {
    const result = validateImportFile('datos.pdf', 0);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('validateImportRow', () => {
  const validRow: Record<string, string> = {
    Fecha: '2024-03-15',
    Tipo: 'Ingreso',
    Categoría: 'Salario',
    Concepto: 'Mensual',
    Detalle: 'Pago marzo',
    Presupuesto: '5000000',
    'Monto real': '5000000',
    Moneda: 'COP',
    Notas: '',
  };

  it('should accept a fully valid row', () => {
    const result = validateImportRow(validRow, 1);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject row with invalid date', () => {
    const row = { ...validRow, Fecha: 'not-a-date' };
    const result = validateImportRow(row, 2);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ row: 2, field: 'Fecha' })
    );
  });

  it('should reject row with empty date', () => {
    const row = { ...validRow, Fecha: '' };
    const result = validateImportRow(row, 3);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'Fecha' })
    );
  });

  it('should accept date in DD/MM/YYYY format', () => {
    const row = { ...validRow, Fecha: '15/03/2024' };
    const result = validateImportRow(row, 1);
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid Tipo', () => {
    const row = { ...validRow, Tipo: 'Gasto' };
    const result = validateImportRow(row, 4);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ row: 4, field: 'Tipo' })
    );
  });

  it('should accept Tipo Egreso', () => {
    const row = { ...validRow, Tipo: 'Egreso' };
    const result = validateImportRow(row, 1);
    expect(result.isValid).toBe(true);
  });

  it('should reject empty Categoría', () => {
    const row = { ...validRow, Categoría: '' };
    const result = validateImportRow(row, 5);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'Categoría' })
    );
  });

  it('should reject whitespace-only Categoría', () => {
    const row = { ...validRow, Categoría: '   ' };
    const result = validateImportRow(row, 5);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'Categoría' })
    );
  });

  it('should reject empty Concepto', () => {
    const row = { ...validRow, Concepto: '' };
    const result = validateImportRow(row, 6);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'Concepto' })
    );
  });

  it('should reject non-numeric Monto real', () => {
    const row = { ...validRow, 'Monto real': 'abc' };
    const result = validateImportRow(row, 7);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'Monto real' })
    );
  });

  it('should reject Monto real equal to 0', () => {
    const row = { ...validRow, 'Monto real': '0' };
    const result = validateImportRow(row, 8);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'Monto real' })
    );
  });

  it('should reject negative Monto real', () => {
    const row = { ...validRow, 'Monto real': '-100' };
    const result = validateImportRow(row, 9);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'Monto real' })
    );
  });

  it('should accept valid positive Monto real', () => {
    const row = { ...validRow, 'Monto real': '0.01' };
    const result = validateImportRow(row, 1);
    expect(result.isValid).toBe(true);
  });

  it('should report multiple errors in a single row', () => {
    const row = {
      Fecha: '',
      Tipo: 'Invalid',
      Categoría: '',
      Concepto: '',
      Detalle: '',
      Presupuesto: '',
      'Monto real': '-5',
      Moneda: 'COP',
      Notas: '',
    };
    const result = validateImportRow(row, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(5);
  });

  it('should handle missing fields gracefully', () => {
    const row = {} as Record<string, string>;
    const result = validateImportRow(row, 11);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(5);
  });
});
