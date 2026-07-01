import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateCatalogName, canDeleteOrDeactivate } from './catalog';

/**
 * Property-based tests for catalog validation
 * Validates: Requirements 11.2, 11.3, 11.4, 11.9
 */

describe('Property 21: Catalog Item Name Validation', () => {
  /**
   * For any string that is empty or composed entirely of whitespace characters,
   * the catalog name validator SHALL reject it. For any name that exceeds 50
   * characters, it SHALL also be rejected.
   * Validates: Requirements 11.9, 11.3, 11.4
   */

  it('rejects any whitespace-only string', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r', '\f'), { minLength: 1, maxLength: 20 }).map(
          (chars) => chars.join('')
        ),
        (whitespaceStr) => {
          const result = validateCatalogName(whitespaceStr, []);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      )
    );
  });

  it('rejects empty string', () => {
    const result = validateCatalogName('', []);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects any string longer than 50 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 51, maxLength: 200 }).filter((s) => s.trim().length > 0),
        (longStr) => {
          const result = validateCatalogName(longStr, []);
          expect(result.isValid).toBe(false);
          expect(result.errors.some((e) => e.includes('50'))).toBe(true);
        }
      )
    );
  });

  it('accepts any non-empty trimmed string of 50 chars or less that is not in existingNames', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (validName) => {
          // Use an empty array so there is no uniqueness conflict
          const result = validateCatalogName(validName, []);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      )
    );
  });

  it('rejects a name that already exists in existingNames (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (name) => {
          // The name itself exists in the list (test case-insensitive duplicate check)
          const existingNames = [name.toUpperCase()];
          const result = validateCatalogName(name.toLowerCase(), existingNames);
          expect(result.isValid).toBe(false);
          expect(result.errors.some((e) => e.includes('existe'))).toBe(true);
        }
      )
    );
  });
});

describe('Property 22: Catalog Base Items Protection', () => {
  /**
   * For any catalog item where isBase === true, any attempt to delete or deactivate
   * SHALL be rejected regardless of other conditions.
   * Validates: Requirements 11.2
   */

  it('always rejects deletion/deactivation when isBase is true', () => {
    fc.assert(
      fc.property(
        fc.record({ isBase: fc.constant(true) }),
        (item) => {
          const result = canDeleteOrDeactivate(item);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      )
    );
  });

  it('always allows deletion/deactivation when isBase is false', () => {
    fc.assert(
      fc.property(
        fc.record({ isBase: fc.constant(false) }),
        (item) => {
          const result = canDeleteOrDeactivate(item);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      )
    );
  });
});
