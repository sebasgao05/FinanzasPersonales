import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { extractMonth, extractYear } from './dates';
import { BASE_MONTHS } from './constants';

/**
 * Property-based tests for date extraction
 * Validates: Requirements 4.2
 */

describe('Property 7: Date Extraction', () => {
  /**
   * For any valid ISO date string (YYYY-MM-DD), the computed month and year
   * SHALL match the actual month and year of that date.
   * Validates: Requirements 4.2
   */

  it('extractMonth returns the correct Spanish month name for any valid date', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2100 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
        (year, month, day) => {
          const dateStr = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const result = extractMonth(dateStr);
          const expectedMonth = BASE_MONTHS[month - 1];
          expect(result).toBe(expectedMonth);
        }
      )
    );
  });

  it('extractYear returns the correct year for any valid date', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2100 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
        (year, month, day) => {
          const dateStr = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const result = extractYear(dateStr);
          expect(result).toBe(year);
        }
      )
    );
  });
});
