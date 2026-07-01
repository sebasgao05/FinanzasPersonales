import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateTransaction } from './transaction';

/**
 * Property-based tests for transaction validation
 * Validates: Requirements 4.5, 4.6
 */

const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 999_999_999.99;

/**
 * Helper: generates a fully valid transaction form data object.
 */
function validTransactionData(amount: number) {
  return {
    date: '2024-06-15',
    type: 'Ingreso' as const,
    categoryId: 'cat-001',
    conceptId: 'con-001',
    amount,
    currency: 'COP',
  };
}

describe('Property 9: Amount Range Validation', () => {
  /**
   * For any numeric value, the amount validator SHALL accept it if and only if
   * it is within [0.01, 999,999,999.99].
   * Validates: Requirements 4.5
   */

  it('accepts any amount within [0.01, 999999999.99] when all other fields are valid', () => {
    fc.assert(
      fc.property(
        fc.double({ min: MIN_AMOUNT, max: MAX_AMOUNT, noNaN: true }),
        (amount) => {
          const result = validateTransaction(validTransactionData(amount));
          expect(result.isValid).toBe(true);
          expect(result.errors.find(e => e.field === 'amount')).toBeUndefined();
        }
      )
    );
  });

  it('rejects any amount <= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ max: 0, noNaN: true, noDefaultInfinity: true }),
        (amount) => {
          const result = validateTransaction(validTransactionData(amount));
          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.field === 'amount')).toBe(true);
        }
      )
    );
  });

  it('rejects any amount > 999999999.99', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 999_999_999.995, max: 1e15, noNaN: true, noDefaultInfinity: true }),
        (amount) => {
          const result = validateTransaction(validTransactionData(amount));
          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.field === 'amount')).toBe(true);
        }
      )
    );
  });

  it('accepts the boundary values 0.01 and 999999999.99', () => {
    const resultMin = validateTransaction(validTransactionData(MIN_AMOUNT));
    expect(resultMin.isValid).toBe(true);

    const resultMax = validateTransaction(validTransactionData(MAX_AMOUNT));
    expect(resultMax.isValid).toBe(true);
  });
});

describe('Property 10: Required Fields Validation', () => {
  /**
   * For any submission where at least one required field is empty/undefined,
   * the validator SHALL return failure.
   * Validates: Requirements 4.6
   */

  const requiredFields = ['date', 'type', 'categoryId', 'conceptId', 'amount', 'currency'] as const;

  it('returns isValid=false when any single required field is missing (undefined)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...requiredFields),
        (fieldToRemove) => {
          const data = { ...validTransactionData(100) };
          delete (data as Record<string, unknown>)[fieldToRemove];

          const result = validateTransaction(data);
          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.field === fieldToRemove)).toBe(true);
        }
      )
    );
  });

  it('returns isValid=false when any single string required field is empty string', () => {
    const stringFields = ['date', 'type', 'categoryId', 'conceptId', 'currency'] as const;

    fc.assert(
      fc.property(
        fc.constantFrom(...stringFields),
        (fieldToEmpty) => {
          const data: Record<string, unknown> = { ...validTransactionData(100) };
          data[fieldToEmpty] = '';

          const result = validateTransaction(data as any);
          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.field === fieldToEmpty)).toBe(true);
        }
      )
    );
  });

  it('returns isValid=false when any single string required field is whitespace-only', () => {
    const stringFields = ['date', 'categoryId', 'conceptId', 'currency'] as const;

    fc.assert(
      fc.property(
        fc.constantFrom(...stringFields),
        fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 5 }).map(arr => arr.join('')),
        (fieldToEmpty, whitespace) => {
          const data: Record<string, unknown> = { ...validTransactionData(100) };
          data[fieldToEmpty] = whitespace;

          const result = validateTransaction(data as any);
          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.field === fieldToEmpty)).toBe(true);
        }
      )
    );
  });

  it('returns errors for ALL missing required fields when multiple are absent', () => {
    fc.assert(
      fc.property(
        fc.subarray([...requiredFields], { minLength: 2 }),
        (fieldsToRemove) => {
          const data: Record<string, unknown> = { ...validTransactionData(100) };
          for (const field of fieldsToRemove) {
            delete data[field];
          }

          const result = validateTransaction(data as any);
          expect(result.isValid).toBe(false);

          for (const field of fieldsToRemove) {
            expect(result.errors.some(e => e.field === field)).toBe(true);
          }
        }
      )
    );
  });
});
