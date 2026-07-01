import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { monthlyFlow, cumulativeFlow } from './cashflow';
import { CalculationTransaction } from './types';
import { BASE_MONTHS } from '../utils/constants';

/**
 * Property-based tests for cumulative cash flow calculation
 * Validates: Requirements 9.3
 */

/**
 * Generator for valid CalculationTransaction arrays with constrained months.
 */
const transactionArb = fc.record({
  type: fc.constantFrom('Ingreso' as const, 'Egreso' as const),
  amount: fc.double({ min: 0.01, max: 999999.99, noNaN: true, noDefaultInfinity: true }),
  month: fc.constantFrom(...BASE_MONTHS),
});

const transactionsArb = fc.array(transactionArb, { minLength: 0, maxLength: 50 });

/**
 * Generator for month index (0-11)
 */
const monthIndexArb = fc.integer({ min: 0, max: 11 });

describe('Property 18: Cash Flow Cumulative Calculation', () => {
  /**
   * For any array of transactions and any month index i (0-11),
   * cumulativeFlow(transactions, BASE_MONTHS[i]) === sum of monthlyFlow(transactions, BASE_MONTHS[j])
   * for j from 0 to i.
   *
   * Validates: Requirements 9.3
   */

  it('cumulativeFlow for month N equals the sum of monthlyFlow from month 1 through month N', () => {
    fc.assert(
      fc.property(transactionsArb, monthIndexArb, (transactions, monthIndex) => {
        const month = BASE_MONTHS[monthIndex];
        const cumulative = cumulativeFlow(transactions as CalculationTransaction[], month);

        let expectedSum = 0;
        for (let j = 0; j <= monthIndex; j++) {
          expectedSum += monthlyFlow(transactions as CalculationTransaction[], BASE_MONTHS[j]);
        }
        // Round expected sum the same way cumulativeFlow does
        expectedSum = Math.round(expectedSum * 100) / 100;

        expect(Math.abs(cumulative - expectedSum)).toBeLessThanOrEqual(0.01);
      }),
      { numRuns: 200 }
    );
  });
});
