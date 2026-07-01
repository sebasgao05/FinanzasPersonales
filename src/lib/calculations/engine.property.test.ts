import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { safeDiv, sanitizeAmount } from './engine';

/**
 * Property-based tests for safeDiv and sanitizeAmount
 * Validates: Requirements 14.3, 14.4
 */

describe('Property 1: Safe Division', () => {
  /**
   * For any numerator and a denominator equal to zero, safeDiv SHALL return
   * zero without throwing an error or producing Infinity/NaN.
   * Validates: Requirements 14.3
   */

  it('safeDiv(n, 0) returns 0 for any numeric n', () => {
    fc.assert(
      fc.property(fc.double({ noNaN: true, noDefaultInfinity: true }), (numerator) => {
        const result = safeDiv(numerator, 0);
        expect(result).toBe(0);
      })
    );
  });

  it('safeDiv never returns Infinity for any numeric inputs', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (numerator, denominator) => {
          const result = safeDiv(numerator, denominator);
          expect(Number.isFinite(result)).toBe(true);
        }
      )
    );
  });

  it('safeDiv never returns NaN for any numeric inputs', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (numerator, denominator) => {
          const result = safeDiv(numerator, denominator);
          expect(Number.isNaN(result)).toBe(false);
        }
      )
    );
  });
});

describe('Property 2: Amount Sanitization', () => {
  /**
   * For any value that is null, undefined, NaN, or of a non-numeric type,
   * sanitizeAmount SHALL return zero. For any valid numeric value, it SHALL
   * return that value unchanged.
   * Validates: Requirements 14.4
   */

  it('sanitizeAmount returns 0 for null', () => {
    expect(sanitizeAmount(null)).toBe(0);
  });

  it('sanitizeAmount returns 0 for undefined', () => {
    expect(sanitizeAmount(undefined)).toBe(0);
  });

  it('sanitizeAmount returns 0 for NaN', () => {
    expect(sanitizeAmount(NaN)).toBe(0);
  });

  it('sanitizeAmount returns 0 for any string', () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        expect(sanitizeAmount(value)).toBe(0);
      })
    );
  });

  it('sanitizeAmount returns 0 for any boolean', () => {
    fc.assert(
      fc.property(fc.boolean(), (value) => {
        expect(sanitizeAmount(value)).toBe(0);
      })
    );
  });

  it('sanitizeAmount returns 0 for any object', () => {
    fc.assert(
      fc.property(fc.object(), (value) => {
        expect(sanitizeAmount(value)).toBe(0);
      })
    );
  });

  it('sanitizeAmount returns 0 for any array', () => {
    fc.assert(
      fc.property(fc.array(fc.anything()), (value) => {
        expect(sanitizeAmount(value)).toBe(0);
      })
    );
  });

  it('sanitizeAmount returns the exact input value for any valid finite number', () => {
    fc.assert(
      fc.property(fc.double({ noNaN: true, noDefaultInfinity: true }), (value) => {
        expect(sanitizeAmount(value)).toBe(value);
      })
    );
  });
});
