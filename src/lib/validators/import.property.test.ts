import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateImportColumns,
  validateImportRow,
  REQUIRED_IMPORT_COLUMNS,
} from './import';

/**
 * Property-based tests for import validation
 * Validates: Requirements 7.1, 7.5
 */

describe('Property 15: Import Column Validation', () => {
  /**
   * For any set of file column headers, the import validator SHALL accept the file
   * if and only if all required columns are present.
   * Validates: Requirements 7.1
   */

  it('accepts headers when all required columns are present (possibly with extra columns)', () => {
    const extraColumnArb = fc.string({ minLength: 1 }).filter(
      (s) => !REQUIRED_IMPORT_COLUMNS.includes(s.trim())
    );

    fc.assert(
      fc.property(fc.array(extraColumnArb, { minLength: 0, maxLength: 10 }), (extraColumns) => {
        const headers = [...REQUIRED_IMPORT_COLUMNS, ...extraColumns];
        const result = validateImportColumns(headers);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      })
    );
  });

  it('accepts headers regardless of order when all required columns are present', () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(REQUIRED_IMPORT_COLUMNS, {
          minLength: REQUIRED_IMPORT_COLUMNS.length,
          maxLength: REQUIRED_IMPORT_COLUMNS.length,
        }),
        (shuffledHeaders) => {
          const result = validateImportColumns(shuffledHeaders);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      )
    );
  });

  it('rejects headers when at least one required column is missing', () => {
    // Generate a non-empty subset of indices to remove from required columns
    const indicesToRemoveArb = fc
      .subarray(
        REQUIRED_IMPORT_COLUMNS.map((_, i) => i),
        { minLength: 1, maxLength: REQUIRED_IMPORT_COLUMNS.length }
      );

    fc.assert(
      fc.property(indicesToRemoveArb, (indicesToRemove) => {
        const headers = REQUIRED_IMPORT_COLUMNS.filter((_, i) => !indicesToRemove.includes(i));
        const result = validateImportColumns(headers);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBe(indicesToRemove.length);
      })
    );
  });

  it('isValid is true iff all required columns are present', () => {
    // Generate any subset of required columns plus some random extras
    const extraColumnArb = fc.string({ minLength: 1 }).filter(
      (s) => !REQUIRED_IMPORT_COLUMNS.includes(s.trim())
    );

    fc.assert(
      fc.property(
        fc.subarray(REQUIRED_IMPORT_COLUMNS, { minLength: 0, maxLength: REQUIRED_IMPORT_COLUMNS.length }),
        fc.array(extraColumnArb, { minLength: 0, maxLength: 5 }),
        (requiredSubset, extras) => {
          const headers = [...requiredSubset, ...extras];
          const result = validateImportColumns(headers);
          const allPresent = REQUIRED_IMPORT_COLUMNS.every((col) => headers.includes(col));
          expect(result.isValid).toBe(allPresent);
        }
      )
    );
  });
});

describe('Property 16: Import Row Processing Integrity', () => {
  /**
   * For any import file with N valid rows and M invalid rows, the processor SHALL
   * create exactly N transactions and report exactly M errors.
   * Validates: Requirements 7.5
   */

  // Helper: a safe date string arbitrary
  const safeDateStrArb = fc.integer({ min: 2000, max: 2099 }).chain((year) =>
    fc.integer({ min: 1, max: 12 }).chain((month) =>
      fc.integer({ min: 1, max: 28 }).map((day) =>
        `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      )
    )
  );

  // Generator for a valid import row
  const validRowArb = fc.record({
    'Fecha': safeDateStrArb,
    'Tipo': fc.constantFrom('Ingreso', 'Egreso'),
    'Categoría': fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
    'Concepto': fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
    'Detalle': fc.string({ maxLength: 100 }),
    'Presupuesto': fc.double({ min: 0.01, max: 999999999.99, noNaN: true }).map(String),
    'Monto real': fc.double({ min: 0.01, max: 999999999.99, noNaN: true }).map(String),
    'Moneda': fc.constantFrom('COP', 'USD', 'EUR'),
    'Notas': fc.string({ maxLength: 500 }),
  });

  // Generator for an invalid import row (at least one field is invalid)
  const invalidRowArb = fc.oneof(
    // Invalid date
    fc.record({
      'Fecha': fc.constantFrom('', 'not-a-date', '99/99/9999', 'abc'),
      'Tipo': fc.constantFrom('Ingreso', 'Egreso'),
      'Categoría': fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      'Concepto': fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      'Detalle': fc.string({ maxLength: 100 }),
      'Presupuesto': fc.double({ min: 0.01, max: 999999999.99, noNaN: true }).map(String),
      'Monto real': fc.double({ min: 0.01, max: 999999999.99, noNaN: true }).map(String),
      'Moneda': fc.constantFrom('COP', 'USD', 'EUR'),
      'Notas': fc.string({ maxLength: 500 }),
    }),
    // Invalid type
    fc.record({
      'Fecha': safeDateStrArb,
      'Tipo': fc.constantFrom('', 'InvalidType', 'ingreso', 'egreso', 'Other'),
      'Categoría': fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      'Concepto': fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      'Detalle': fc.string({ maxLength: 100 }),
      'Presupuesto': fc.double({ min: 0.01, max: 999999999.99, noNaN: true }).map(String),
      'Monto real': fc.double({ min: 0.01, max: 999999999.99, noNaN: true }).map(String),
      'Moneda': fc.constantFrom('COP', 'USD', 'EUR'),
      'Notas': fc.string({ maxLength: 500 }),
    }),
    // Invalid monto (0 or negative)
    fc.record({
      'Fecha': safeDateStrArb,
      'Tipo': fc.constantFrom('Ingreso', 'Egreso'),
      'Categoría': fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      'Concepto': fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      'Detalle': fc.string({ maxLength: 100 }),
      'Presupuesto': fc.double({ min: 0.01, max: 999999999.99, noNaN: true }).map(String),
      'Monto real': fc.constantFrom('0', '-1', '-100', '', 'abc', 'NaN'),
      'Moneda': fc.constantFrom('COP', 'USD', 'EUR'),
      'Notas': fc.string({ maxLength: 500 }),
    }),
    // Empty categoría
    fc.record({
      'Fecha': safeDateStrArb,
      'Tipo': fc.constantFrom('Ingreso', 'Egreso'),
      'Categoría': fc.constantFrom('', '   '),
      'Concepto': fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      'Detalle': fc.string({ maxLength: 100 }),
      'Presupuesto': fc.double({ min: 0.01, max: 999999999.99, noNaN: true }).map(String),
      'Monto real': fc.double({ min: 0.01, max: 999999999.99, noNaN: true }).map(String),
      'Moneda': fc.constantFrom('COP', 'USD', 'EUR'),
      'Notas': fc.string({ maxLength: 500 }),
    }),
    // Empty concepto
    fc.record({
      'Fecha': safeDateStrArb,
      'Tipo': fc.constantFrom('Ingreso', 'Egreso'),
      'Categoría': fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      'Concepto': fc.constantFrom('', '   '),
      'Detalle': fc.string({ maxLength: 100 }),
      'Presupuesto': fc.double({ min: 0.01, max: 999999999.99, noNaN: true }).map(String),
      'Monto real': fc.double({ min: 0.01, max: 999999999.99, noNaN: true }).map(String),
      'Moneda': fc.constantFrom('COP', 'USD', 'EUR'),
      'Notas': fc.string({ maxLength: 500 }),
    })
  );

  it('valid rows produce isValid=true with no errors', () => {
    fc.assert(
      fc.property(validRowArb, fc.integer({ min: 1, max: 10000 }), (row, rowNumber) => {
        const result = validateImportRow(row, rowNumber);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      })
    );
  });

  it('invalid rows produce isValid=false with at least one error', () => {
    fc.assert(
      fc.property(invalidRowArb, fc.integer({ min: 1, max: 10000 }), (row, rowNumber) => {
        const result = validateImportRow(row, rowNumber);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      })
    );
  });

  it('for N valid and M invalid rows, processing yields exactly N valid and M invalid results', () => {
    fc.assert(
      fc.property(
        fc.array(validRowArb, { minLength: 0, maxLength: 10 }),
        fc.array(invalidRowArb, { minLength: 0, maxLength: 10 }),
        (validRows, invalidRows) => {
          // Combine rows with tracking
          const allRows = [
            ...validRows.map((row) => ({ row, expectedValid: true })),
            ...invalidRows.map((row) => ({ row, expectedValid: false })),
          ];

          let validCount = 0;
          let invalidCount = 0;

          for (let i = 0; i < allRows.length; i++) {
            const result = validateImportRow(allRows[i].row, i + 1);
            if (result.isValid) {
              validCount++;
            } else {
              invalidCount++;
            }
          }

          // N + M always equals total rows
          expect(validCount + invalidCount).toBe(allRows.length);
          // Valid rows are counted correctly
          expect(validCount).toBe(validRows.length);
          // Invalid rows are counted correctly
          expect(invalidCount).toBe(invalidRows.length);
        }
      )
    );
  });

  it('each error includes the correct row number', () => {
    fc.assert(
      fc.property(invalidRowArb, fc.integer({ min: 1, max: 10000 }), (row, rowNumber) => {
        const result = validateImportRow(row, rowNumber);
        for (const error of result.errors) {
          expect(error.row).toBe(rowNumber);
        }
      })
    );
  });
});
