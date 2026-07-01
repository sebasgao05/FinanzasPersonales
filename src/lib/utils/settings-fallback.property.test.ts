import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveWithFallback } from './settings-fallback';

/**
 * Property-based tests for settings fallback resolution.
 * Property 27: Settings Fallback Resolution
 *
 * For any user settings where the configured default value (currency, year, or month)
 * does not exist in the active catalog items, the system SHALL resolve to the first
 * active value available in the corresponding catalog.
 *
 * **Validates: Requirements 16.4**
 */

describe('Property 27: Settings Fallback Resolution', () => {
  // Arbitrary for non-empty string values (simulating catalog items)
  const catalogItemArb = fc.string({ minLength: 1, maxLength: 20 });
  const nonEmptyCatalogArb = fc.array(catalogItemArb, { minLength: 1, maxLength: 20 });

  /**
   * If configuredValue exists in activeCatalog, returns configuredValue unchanged.
   */
  it('returns configuredValue when it exists in the active catalog', () => {
    fc.assert(
      fc.property(
        nonEmptyCatalogArb,
        fc.nat(),
        (catalog, indexSeed) => {
          // Pick a value that is guaranteed to be in the catalog
          const index = indexSeed % catalog.length;
          const configuredValue = catalog[index];

          const result = resolveWithFallback(configuredValue, catalog);
          expect(result).toBe(configuredValue);
        }
      )
    );
  });

  /**
   * If configuredValue does NOT exist in activeCatalog and catalog is non-empty,
   * returns the first item in activeCatalog.
   */
  it('returns the first active catalog item when configuredValue is not in the catalog', () => {
    fc.assert(
      fc.property(
        nonEmptyCatalogArb,
        catalogItemArb,
        (catalog, configuredValue) => {
          // Ensure the configured value is NOT in the catalog
          fc.pre(!catalog.includes(configuredValue));

          const result = resolveWithFallback(configuredValue, catalog);
          expect(result).toBe(catalog[0]);
        }
      )
    );
  });

  /**
   * If activeCatalog is empty, returns configuredValue (no fallback available).
   */
  it('returns configuredValue unchanged when the active catalog is empty', () => {
    fc.assert(
      fc.property(
        catalogItemArb,
        (configuredValue) => {
          const result = resolveWithFallback(configuredValue, []);
          expect(result).toBe(configuredValue);
        }
      )
    );
  });
});
