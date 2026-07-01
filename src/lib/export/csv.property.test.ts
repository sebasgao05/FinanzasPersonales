import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateCSV, EXPORT_COLUMNS, TransactionRecord } from './csv';

/**
 * Property-based tests for CSV export
 * Validates: Requirements 6.1
 */

// Generator for safe strings (alphanumeric + spaces only, no commas/quotes/newlines)
const safeStringArb = fc.stringMatching(/^[A-Za-z0-9 ]{1,20}$/);

// Generator for a safe date string
const safeDateArb = fc.integer({ min: 2000, max: 2099 }).chain((year) =>
  fc.integer({ min: 1, max: 12 }).chain((month) =>
    fc.integer({ min: 1, max: 28 }).map((day) =>
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    )
  )
);

// Generator for a TransactionRecord with safe characters (no commas, quotes, newlines)
const safeRecordArb: fc.Arbitrary<TransactionRecord> = fc.record({
  date: safeDateArb,
  month: fc.constantFrom('Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'),
  year: fc.integer({ min: 2000, max: 2099 }),
  type: fc.constantFrom('Ingreso' as const, 'Egreso' as const),
  categoryName: safeStringArb,
  conceptName: safeStringArb,
  detail: safeStringArb,
  budget: fc.double({ min: 0.01, max: 999999.99, noNaN: true }),
  amount: fc.double({ min: 0.01, max: 999999.99, noNaN: true }),
  currency: fc.constantFrom('COP', 'USD', 'EUR'),
  notes: safeStringArb,
});

describe('Property 14: CSV Export Data Preservation', () => {
  /**
   * For any set of transaction records, the generated CSV SHALL contain exactly
   * one header row plus one data row per transaction, and parsing the CSV back
   * SHALL recover the original field values.
   * Validates: Requirements 6.1
   */

  it('for any N records, generateCSV produces exactly N+1 lines (1 header + N data rows)', () => {
    fc.assert(
      fc.property(
        fc.array(safeRecordArb, { minLength: 0, maxLength: 50 }),
        (records) => {
          const csv = generateCSV(records);
          const lines = csv.split('\n');
          expect(lines.length).toBe(records.length + 1);
        }
      )
    );
  });

  it('the first line always equals the joined EXPORT_COLUMNS', () => {
    fc.assert(
      fc.property(
        fc.array(safeRecordArb, { minLength: 0, maxLength: 20 }),
        (records) => {
          const csv = generateCSV(records);
          const firstLine = csv.split('\n')[0];
          expect(firstLine).toBe(EXPORT_COLUMNS.join(','));
        }
      )
    );
  });

  it('for records with safe values, parsing back recovers the original field values', () => {
    fc.assert(
      fc.property(
        fc.array(safeRecordArb, { minLength: 1, maxLength: 20 }),
        (records) => {
          const csv = generateCSV(records);
          const lines = csv.split('\n');

          for (let i = 0; i < records.length; i++) {
            const dataLine = lines[i + 1];
            const fields = dataLine.split(',');
            const record = records[i];

            expect(fields[0]).toBe(record.date);
            expect(fields[1]).toBe(record.month);
            expect(fields[2]).toBe(String(record.year));
            expect(fields[3]).toBe(record.type);
            expect(fields[4]).toBe(record.categoryName);
            expect(fields[5]).toBe(record.conceptName);
            expect(fields[6]).toBe(record.detail ?? '');
            expect(fields[7]).toBe(record.budget != null ? String(record.budget) : '');
            expect(fields[8]).toBe(String(record.amount));
            expect(fields[9]).toBe(record.currency);
            expect(fields[10]).toBe(record.notes ?? '');
          }
        }
      )
    );
  });

  it('empty array produces exactly 1 line (headers only)', () => {
    fc.assert(
      fc.property(fc.constant([]), (records: TransactionRecord[]) => {
        const csv = generateCSV(records);
        const lines = csv.split('\n');
        expect(lines.length).toBe(1);
        expect(lines[0]).toBe(EXPORT_COLUMNS.join(','));
      })
    );
  });
});
