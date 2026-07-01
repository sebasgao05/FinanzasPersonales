import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  totalLocated,
  pendingToLocate,
  locatedPercentage,
  reconciliationStatus,
  AccountBalance,
} from './reconciliation';
import { sanitizeAmount } from './engine';

/**
 * Property-based tests for reconciliation calculations
 * Validates: Requirements 10.5, 10.6, 10.7
 */

/**
 * Smart generator for AccountBalance entries.
 * Generates arrays of account balances with realistic numeric balances
 * and boolean isActive flags.
 */
const accountBalanceArb: fc.Arbitrary<AccountBalance> = fc.record({
  balance: fc.double({ noNaN: true, noDefaultInfinity: true, min: -1_000_000, max: 1_000_000 }),
  isActive: fc.boolean(),
});

const accountBalancesArb: fc.Arbitrary<AccountBalance[]> = fc.array(accountBalanceArb, {
  minLength: 0,
  maxLength: 20,
});

describe('Property 19: Reconciliation Arithmetic', () => {
  /**
   * For any totalBase and set of account balances:
   * totalLocated = sum(active balances),
   * pendingToLocate = totalBase - totalLocated,
   * locatedPercentage = (totalLocated/totalBase)*100 (or 0 if totalBase is 0).
   * Validates: Requirements 10.5, 10.6
   */

  it('totalLocated equals the sum of all active account balances (sanitized)', () => {
    fc.assert(
      fc.property(accountBalancesArb, (accounts) => {
        const result = totalLocated(accounts);
        const expectedSum = accounts
          .filter((a) => a.isActive)
          .reduce((acc, a) => acc + sanitizeAmount(a.balance), 0);
        const expected = Math.round(expectedSum * 100) / 100;
        expect(result).toBeCloseTo(expected, 2);
      })
    );
  });

  it('pendingToLocate equals totalBase minus totalLocated', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true, min: -1_000_000, max: 1_000_000 }),
        accountBalancesArb,
        (totalBase, accounts) => {
          const located = totalLocated(accounts);
          const pending = pendingToLocate(totalBase, located);
          const expected = Math.round((sanitizeAmount(totalBase) - sanitizeAmount(located)) * 100) / 100;
          expect(pending).toBeCloseTo(expected, 2);
        }
      )
    );
  });

  it('locatedPercentage equals 0 when totalBase is 0', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true, min: -1_000_000, max: 1_000_000 }),
        (locatedValue) => {
          const result = locatedPercentage(locatedValue, 0);
          expect(result).toBe(0);
        }
      )
    );
  });

  it('locatedPercentage equals (totalLocated/totalBase)*100 when totalBase is not 0', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true, min: -1_000_000, max: 1_000_000 }),
        fc.double({ noNaN: true, noDefaultInfinity: true, min: 1, max: 1_000_000 }),
        (locatedValue, totalBase) => {
          // Ensure totalBase is non-zero (positive range from generator)
          const result = locatedPercentage(locatedValue, totalBase);
          const expected = Math.round((sanitizeAmount(locatedValue) / sanitizeAmount(totalBase)) * 100 * 10) / 10;
          expect(result).toBeCloseTo(expected, 1);
        }
      )
    );
  });
});

describe('Property 20: Reconciliation Status Classification', () => {
  /**
   * For any pendingToLocate value:
   * "Cuadrado" when 0, "Falta ubicar" when > 0, "Sobra" when < 0.
   * Validates: Requirements 10.7
   */

  it('reconciliationStatus returns "Cuadrado" when pendingToLocate is 0', () => {
    expect(reconciliationStatus(0)).toBe('Cuadrado');
  });

  it('reconciliationStatus returns "Falta ubicar" for any positive pending value', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true, min: 0.01, max: 1_000_000 }),
        (pending) => {
          const result = reconciliationStatus(pending);
          expect(result).toBe('Falta ubicar');
        }
      )
    );
  });

  it('reconciliationStatus returns "Sobra" for any negative pending value', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true, min: -1_000_000, max: -0.01 }),
        (pending) => {
          const result = reconciliationStatus(pending);
          expect(result).toBe('Sobra');
        }
      )
    );
  });

  it('reconciliationStatus classifies correctly for any numeric value', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true, min: -1_000_000, max: 1_000_000 }),
        (pending) => {
          const result = reconciliationStatus(pending);
          const sanitized = sanitizeAmount(pending);
          if (sanitized === 0) {
            expect(result).toBe('Cuadrado');
          } else if (sanitized > 0) {
            expect(result).toBe('Falta ubicar');
          } else {
            expect(result).toBe('Sobra');
          }
        }
      )
    );
  });
});
