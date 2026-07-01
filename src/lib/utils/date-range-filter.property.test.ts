import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 25: Date Range Filtering
 * For any date range [start, end] and set of transactions, all included transactions
 * have date >= start AND date <= end, and no excluded transactions should satisfy both conditions.
 *
 * Validates: Requirements 12.4
 */

interface TransactionWithDate {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
}

/**
 * Filters transactions by date range [start, end] inclusive.
 * This is the pure function under test, matching the inline logic used in AnalysisPage.
 */
function filterByDateRange(
  transactions: TransactionWithDate[],
  start: string,
  end: string
): TransactionWithDate[] {
  return transactions.filter((t) => t.date >= start && t.date <= end);
}

// --- Generators ---

/** Generates a valid ISO date string YYYY-MM-DD */
const dateArb = fc
  .tuple(
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(
    ([y, m, d]) =>
      `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  );

/** Generates a date range [start, end] where start <= end */
const dateRangeArb = fc
  .tuple(dateArb, dateArb)
  .map(([a, b]) => (a <= b ? { start: a, end: b } : { start: b, end: a }));

/** Generates a transaction with a random date */
const transactionArb: fc.Arbitrary<TransactionWithDate> = fc.record({
  id: fc.uuid(),
  date: dateArb,
});

// --- Tests ---

describe('Property 25: Date Range Filtering', () => {
  it('all included transactions have date >= start AND date <= end', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArb, { minLength: 0, maxLength: 30 }),
        dateRangeArb,
        (transactions, { start, end }) => {
          const result = filterByDateRange(transactions, start, end);

          for (const t of result) {
            expect(t.date >= start).toBe(true);
            expect(t.date <= end).toBe(true);
          }
        }
      )
    );
  });

  it('no excluded transaction satisfies both date >= start AND date <= end', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArb, { minLength: 0, maxLength: 30 }),
        dateRangeArb,
        (transactions, { start, end }) => {
          const result = filterByDateRange(transactions, start, end);
          const resultIds = new Set(result.map((r) => r.id));
          const excluded = transactions.filter((t) => !resultIds.has(t.id));

          for (const t of excluded) {
            // At least one condition must be false
            const inRange = t.date >= start && t.date <= end;
            expect(inRange).toBe(false);
          }
        }
      )
    );
  });

  it('result count equals the number of transactions within the date range', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArb, { minLength: 0, maxLength: 30 }),
        dateRangeArb,
        (transactions, { start, end }) => {
          const result = filterByDateRange(transactions, start, end);
          const expectedCount = transactions.filter(
            (t) => t.date >= start && t.date <= end
          ).length;

          expect(result.length).toBe(expectedCount);
        }
      )
    );
  });

  it('empty transaction array returns empty result for any date range', () => {
    fc.assert(
      fc.property(dateRangeArb, ({ start, end }) => {
        const result = filterByDateRange([], start, end);
        expect(result).toHaveLength(0);
      })
    );
  });

  it('full range (min to max) includes all transactions', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArb, { minLength: 0, maxLength: 20 }),
        (transactions) => {
          // Use a range that covers all possible generated dates
          const result = filterByDateRange(transactions, '2020-01-01', '2030-12-28');
          expect(result.length).toBe(transactions.length);
        }
      )
    );
  });
});
