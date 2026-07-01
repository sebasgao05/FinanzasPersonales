import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { totalIncome, totalExpense, balance } from './totals';
import { CalculationTransaction } from './types';
import { BASE_MONTHS } from '../utils/constants';

/**
 * Property-based tests for totals and balance functions
 * Validates: Requirements 14.2, 14.5, 14.6, 14.7
 */

const transactionArbitrary = fc.record({
  type: fc.constantFrom('Ingreso', 'Egreso') as fc.Arbitrary<'Ingreso' | 'Egreso'>,
  amount: fc.double({ min: 0, max: 999999, noNaN: true, noDefaultInfinity: true }),
  budget: fc.option(fc.double({ min: 0, max: 999999, noNaN: true, noDefaultInfinity: true })),
  category: fc.option(fc.string()),
  month: fc.option(fc.constantFrom(...BASE_MONTHS)),
  year: fc.option(fc.integer({ min: 2020, max: 2030 })),
});

const transactionsArbitrary = fc.array(transactionArbitrary, { minLength: 0, maxLength: 100 });

describe('Property 3: Balance Consistency (Algebraic Invariant)', () => {
  /**
   * For any array of transactions, balance(transactions) SHALL always equal
   * totalIncome(transactions) - totalExpense(transactions).
   * Validates: Requirements 14.5
   */

  it('balance equals totalIncome minus totalExpense for any transactions', () => {
    fc.assert(
      fc.property(transactionsArbitrary, (transactions: CalculationTransaction[]) => {
        const b = balance(transactions);
        const income = totalIncome(transactions);
        const expense = totalExpense(transactions);
        const expected = Math.round((income - expense) * 100) / 100;
        expect(b).toBe(expected);
      })
    );
  });
});

describe('Property 4: Pure Function Determinism', () => {
  /**
   * For any array of transactions and any calculation function, calling the function
   * multiple times with the same input SHALL always produce the exact same output.
   * Validates: Requirements 14.7
   */

  it('totalIncome produces the same result on repeated calls', () => {
    fc.assert(
      fc.property(transactionsArbitrary, (transactions: CalculationTransaction[]) => {
        const result1 = totalIncome(transactions);
        const result2 = totalIncome(transactions);
        const result3 = totalIncome(transactions);
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      })
    );
  });

  it('totalExpense produces the same result on repeated calls', () => {
    fc.assert(
      fc.property(transactionsArbitrary, (transactions: CalculationTransaction[]) => {
        const result1 = totalExpense(transactions);
        const result2 = totalExpense(transactions);
        const result3 = totalExpense(transactions);
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      })
    );
  });

  it('balance produces the same result on repeated calls', () => {
    fc.assert(
      fc.property(transactionsArbitrary, (transactions: CalculationTransaction[]) => {
        const result1 = balance(transactions);
        const result2 = balance(transactions);
        const result3 = balance(transactions);
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      })
    );
  });
});

describe('Property 5: Empty Input Handling', () => {
  /**
   * For any calculation function that receives an empty array, it SHALL return
   * zero for scalar functions.
   * Validates: Requirements 14.6
   */

  it('totalIncome returns 0 for an empty array', () => {
    expect(totalIncome([])).toBe(0);
  });

  it('totalExpense returns 0 for an empty array', () => {
    expect(totalExpense([])).toBe(0);
  });

  it('balance returns 0 for an empty array', () => {
    expect(balance([])).toBe(0);
  });
});

describe('Property 6: Monetary Rounding', () => {
  /**
   * For any set of transactions, all monetary results SHALL have at most 2 decimal places,
   * and all percentage results SHALL have at most 1 decimal place.
   * Validates: Requirements 14.2
   */

  it('totalIncome result has at most 2 decimal places', () => {
    fc.assert(
      fc.property(transactionsArbitrary, (transactions: CalculationTransaction[]) => {
        const result = totalIncome(transactions);
        const decimalPart = result.toString().split('.')[1];
        if (decimalPart) {
          expect(decimalPart.length).toBeLessThanOrEqual(2);
        }
      })
    );
  });

  it('totalExpense result has at most 2 decimal places', () => {
    fc.assert(
      fc.property(transactionsArbitrary, (transactions: CalculationTransaction[]) => {
        const result = totalExpense(transactions);
        const decimalPart = result.toString().split('.')[1];
        if (decimalPart) {
          expect(decimalPart.length).toBeLessThanOrEqual(2);
        }
      })
    );
  });

  it('balance result has at most 2 decimal places', () => {
    fc.assert(
      fc.property(transactionsArbitrary, (transactions: CalculationTransaction[]) => {
        const result = balance(transactions);
        const decimalPart = result.toString().split('.')[1];
        if (decimalPart) {
          expect(decimalPart.length).toBeLessThanOrEqual(2);
        }
      })
    );
  });
});
