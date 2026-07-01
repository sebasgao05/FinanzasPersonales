import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { categoryDistribution } from './distribution';
import { CalculationTransaction } from './types';

/**
 * Property-based tests for categoryDistribution
 * **Validates: Requirements 8.4**
 */

// Smart generator: creates expense transactions with positive amounts and varied categories
const expenseTransactionArb = (categories: string[]) =>
  fc.record({
    type: fc.constant('Egreso' as const),
    amount: fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true }),
    category: fc.constantFrom(...categories),
  });

// Generator for a non-empty array of expense transactions with at least one category
const expenseTransactionsArb = fc
  .array(fc.stringMatching(/^[A-Za-z]{1,15}$/), { minLength: 1, maxLength: 10 })
  .chain((categories) => {
    const uniqueCategories = [...new Set(categories)];
    const cats = uniqueCategories.length > 0 ? uniqueCategories : ['Default'];
    return fc.array(expenseTransactionArb(cats), { minLength: 1, maxLength: 50 });
  });

// Generator for mixed transactions (some Ingreso, some Egreso)
const mixedTransactionsWithExpensesArb = fc
  .array(fc.stringMatching(/^[A-Za-z]{1,15}$/), { minLength: 1, maxLength: 10 })
  .chain((categories) => {
    const uniqueCategories = [...new Set(categories)];
    const cats = uniqueCategories.length > 0 ? uniqueCategories : ['Default'];
    const expenseArb = expenseTransactionArb(cats);
    const incomeArb = fc.record({
      type: fc.constant('Ingreso' as const),
      amount: fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true }),
      category: fc.constantFrom(...cats),
    });
    return fc.tuple(
      fc.array(expenseArb, { minLength: 1, maxLength: 30 }),
      fc.array(incomeArb, { minLength: 0, maxLength: 20 })
    ).map(([expenses, incomes]) => [...expenses, ...incomes] as CalculationTransaction[]);
  });

describe('Property 17: Category Distribution Grouping', () => {
  /**
   * For any set of expense transactions, the category distribution function SHALL
   * group all categories with individual percentage < 5% into a single "Otros" category,
   * and the sum of all category percentages (including "Otros") SHALL equal 100%.
   * **Validates: Requirements 8.4**
   */

  it('sum of all percentages equals 100% (within 0.1 tolerance for rounding)', () => {
    fc.assert(
      fc.property(expenseTransactionsArb, (transactions) => {
        const result = categoryDistribution(transactions as CalculationTransaction[]);

        if (result.length === 0) {
          // If all amounts sanitize to 0, result can be empty
          return;
        }

        const totalPercentage = result.reduce((sum, item) => sum + item.percentage, 0);
        expect(totalPercentage).toBeCloseTo(100, 0);
        expect(Math.abs(totalPercentage - 100)).toBeLessThanOrEqual(0.1);
      }),
      { numRuns: 200 }
    );
  });

  it('no category in result (except "Otros") has percentage < 5%', () => {
    fc.assert(
      fc.property(expenseTransactionsArb, (transactions) => {
        const result = categoryDistribution(transactions as CalculationTransaction[]);

        for (const item of result) {
          if (item.category !== 'Otros') {
            expect(item.percentage).toBeGreaterThanOrEqual(5);
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it('for empty input or no expense transactions, returns empty array', () => {
    // Empty input
    expect(categoryDistribution([])).toEqual([]);

    // Only income transactions
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constant('Ingreso' as const),
            amount: fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true }),
            category: fc.string(),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (transactions) => {
          const result = categoryDistribution(transactions as CalculationTransaction[]);
          expect(result).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all amounts in result are positive (>0) when result is non-empty', () => {
    fc.assert(
      fc.property(mixedTransactionsWithExpensesArb, (transactions) => {
        const result = categoryDistribution(transactions);

        if (result.length === 0) {
          return;
        }

        for (const item of result) {
          expect(item.amount).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200 }
    );
  });
});
