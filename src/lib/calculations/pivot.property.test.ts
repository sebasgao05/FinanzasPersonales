import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { pivotAggregate, PivotDimension } from './pivot';
import { sanitizeAmount, executionPercentage } from './engine';
import { CalculationTransaction } from './types';

/**
 * Property 24: Pivot Aggregation Correctness
 *
 * For any set of dimension selections and transactions, each row in the pivot result
 * SHALL have: budgetTotal = sum of budget values for all transactions in that group,
 * amountTotal = sum of amount values, and executionPercentage = (amountTotal / budgetTotal) * 100
 * (or 0 if budgetTotal is 0).
 *
 * **Validates: Requirements 12.2**
 */

// Generator for a CalculationTransaction with reasonable financial values
const transactionArb: fc.Arbitrary<CalculationTransaction> = fc.record({
  type: fc.constantFrom('Ingreso' as const, 'Egreso' as const),
  amount: fc.double({ min: -100000, max: 100000, noNaN: true, noDefaultInfinity: true }),
  budget: fc.option(
    fc.double({ min: -100000, max: 100000, noNaN: true, noDefaultInfinity: true }),
    { nil: undefined }
  ),
  category: fc.option(fc.constantFrom('Alimentación', 'Transporte', 'Salud', 'Vivienda', 'Ocio'), {
    nil: undefined,
  }),
  month: fc.option(
    fc.constantFrom(
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ),
    { nil: undefined }
  ),
  year: fc.option(fc.constantFrom(2022, 2023, 2024, 2025), { nil: undefined }),
});

// Generator for a non-empty array of dimensions (at least 1 selected)
const dimensionsArb: fc.Arbitrary<PivotDimension[]> = fc
  .subarray(['month', 'year', 'type', 'category'] as PivotDimension[], { minLength: 1 })
  .filter((arr) => arr.length > 0);

describe('Property 24: Pivot Aggregation Correctness', () => {
  it('sum of amountTotal across all pivot rows equals sum of all transaction amounts', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArb, { minLength: 1, maxLength: 50 }),
        dimensionsArb,
        (transactions, dimensions) => {
          const rows = pivotAggregate(transactions, dimensions);

          const totalAmountFromRows = rows.reduce((sum, row) => sum + row.amountTotal, 0);
          const totalAmountFromTransactions = transactions.reduce(
            (sum, tx) => sum + sanitizeAmount(tx.amount),
            0
          );

          expect(totalAmountFromRows).toBeCloseTo(totalAmountFromTransactions, 5);
        }
      )
    );
  });

  it('sum of budgetTotal across all pivot rows equals sum of all transaction budgets', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArb, { minLength: 1, maxLength: 50 }),
        dimensionsArb,
        (transactions, dimensions) => {
          const rows = pivotAggregate(transactions, dimensions);

          const totalBudgetFromRows = rows.reduce((sum, row) => sum + row.budgetTotal, 0);
          const totalBudgetFromTransactions = transactions.reduce(
            (sum, tx) => sum + sanitizeAmount(tx.budget),
            0
          );

          expect(totalBudgetFromRows).toBeCloseTo(totalBudgetFromTransactions, 5);
        }
      )
    );
  });

  it('each row executionPercentage matches executionPercentage(budgetTotal, amountTotal)', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArb, { minLength: 1, maxLength: 50 }),
        dimensionsArb,
        (transactions, dimensions) => {
          const rows = pivotAggregate(transactions, dimensions);

          for (const row of rows) {
            const expected = executionPercentage(row.budgetTotal, row.amountTotal);
            expect(row.executionPercentage).toBe(expected);
          }
        }
      )
    );
  });

  it('executionPercentage is 0 when budgetTotal is 0', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('Ingreso' as const, 'Egreso' as const),
            amount: fc.double({ min: 0.01, max: 10000, noNaN: true, noDefaultInfinity: true }),
            budget: fc.constant(undefined),
            category: fc.option(fc.constantFrom('Alimentación', 'Transporte', 'Salud'), {
              nil: undefined,
            }),
            month: fc.option(fc.constantFrom('Enero', 'Febrero', 'Marzo'), { nil: undefined }),
            year: fc.option(fc.constantFrom(2024, 2025), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        dimensionsArb,
        (transactions, dimensions) => {
          const rows = pivotAggregate(transactions, dimensions);

          for (const row of rows) {
            // All budgets are undefined → budgetTotal should be 0
            expect(row.budgetTotal).toBe(0);
            expect(row.executionPercentage).toBe(0);
          }
        }
      )
    );
  });

  it('returns empty array for empty transactions', () => {
    fc.assert(
      fc.property(dimensionsArb, (dimensions) => {
        const rows = pivotAggregate([], dimensions);
        expect(rows).toEqual([]);
      })
    );
  });
});
