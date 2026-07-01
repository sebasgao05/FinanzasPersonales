import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  filterCategoriesByType,
  filterConceptsByCategory,
  searchTransactions,
  filterTransactions,
  sortTransactions,
  type CatalogItem,
  type TransactionRecord,
  type TableFilters,
} from './filtering';

/**
 * Property-based tests for filtering and search utilities.
 * Validates: Requirements 4.3, 4.4, 5.2, 5.3, 5.4
 */

// --- Generators ---

const typeArb = fc.constantFrom('Ingreso' as const, 'Egreso' as const);

const catalogItemArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  type: fc.option(typeArb, { nil: undefined }),
  categoryId: fc.option(fc.uuid(), { nil: undefined }),
  isActive: fc.boolean(),
});

const dateArb = fc
  .tuple(
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

const transactionRecordArb: fc.Arbitrary<TransactionRecord> = fc.record({
  id: fc.uuid(),
  date: dateArb,
  month: fc.constantFrom(
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ),
  year: fc.integer({ min: 2020, max: 2030 }),
  type: typeArb,
  categoryId: fc.uuid(),
  categoryName: fc.string({ minLength: 1, maxLength: 30 }),
  conceptId: fc.uuid(),
  conceptName: fc.string({ minLength: 1, maxLength: 30 }),
  detail: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
  budget: fc.option(fc.double({ min: 0.01, max: 999999, noNaN: true }), { nil: undefined }),
  amount: fc.double({ min: 0.01, max: 999999, noNaN: true }),
  currency: fc.constantFrom('COP', 'USD', 'EUR'),
  notes: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
});

// --- Property 8: Hierarchical Catalog Filtering ---

describe('Property 8: Hierarchical Catalog Filtering', () => {
  /**
   * For any type and set of categories, filterCategoriesByType returns only
   * items with matching type AND isActive === true.
   * Validates: Requirements 4.3, 4.4
   */

  it('filterCategoriesByType returns only categories matching the given type', () => {
    fc.assert(
      fc.property(
        fc.array(catalogItemArb, { minLength: 0, maxLength: 30 }),
        typeArb,
        (categories, selectedType) => {
          const result = filterCategoriesByType(categories, selectedType);

          for (const item of result) {
            expect(item.type).toBe(selectedType);
          }
        }
      )
    );
  });

  it('filterCategoriesByType returns only active categories', () => {
    fc.assert(
      fc.property(
        fc.array(catalogItemArb, { minLength: 0, maxLength: 30 }),
        typeArb,
        (categories, selectedType) => {
          const result = filterCategoriesByType(categories, selectedType);

          for (const item of result) {
            expect(item.isActive).toBe(true);
          }
        }
      )
    );
  });

  it('filterCategoriesByType does not exclude any matching active category', () => {
    fc.assert(
      fc.property(
        fc.array(catalogItemArb, { minLength: 0, maxLength: 30 }),
        typeArb,
        (categories, selectedType) => {
          const result = filterCategoriesByType(categories, selectedType);
          const expected = categories.filter(
            (c) => c.type === selectedType && c.isActive === true
          );

          expect(result.length).toBe(expected.length);
        }
      )
    );
  });

  it('filterConceptsByCategory returns only concepts matching the given categoryId and active', () => {
    fc.assert(
      fc.property(
        fc.array(catalogItemArb, { minLength: 0, maxLength: 30 }),
        fc.uuid(),
        (concepts, categoryId) => {
          const result = filterConceptsByCategory(concepts, categoryId);

          for (const item of result) {
            expect(item.categoryId).toBe(categoryId);
            expect(item.isActive).toBe(true);
          }

          // No matching active concept is excluded
          const expected = concepts.filter(
            (c) => c.categoryId === categoryId && c.isActive === true
          );
          expect(result.length).toBe(expected.length);
        }
      )
    );
  });
});

// --- Property 11: Text Search Filtering ---

describe('Property 11: Text Search Filtering', () => {
  /**
   * For any query and transactions, all results from searchTransactions contain
   * the query (case-insensitive) in at least one of: detail, categoryName, conceptName, notes.
   * Validates: Requirements 5.2
   */

  it('all returned results contain the query in at least one searchable field', () => {
    fc.assert(
      fc.property(
        fc.array(transactionRecordArb, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
        (transactions, query) => {
          const results = searchTransactions(transactions, query);
          const normalizedQuery = query.toLowerCase();

          for (const t of results) {
            const searchableFields = [
              (t.detail ?? '').toLowerCase(),
              t.categoryName.toLowerCase(),
              t.conceptName.toLowerCase(),
              (t.notes ?? '').toLowerCase(),
            ];

            const containsQuery = searchableFields.some((field) =>
              field.includes(normalizedQuery)
            );
            expect(containsQuery).toBe(true);
          }
        }
      )
    );
  });

  it('no excluded transaction contains the query in any searchable field', () => {
    fc.assert(
      fc.property(
        fc.array(transactionRecordArb, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
        (transactions, query) => {
          const results = searchTransactions(transactions, query);
          const resultIds = new Set(results.map((r) => r.id));
          const excluded = transactions.filter((t) => !resultIds.has(t.id));
          const normalizedQuery = query.toLowerCase();

          for (const t of excluded) {
            const searchableFields = [
              (t.detail ?? '').toLowerCase(),
              t.categoryName.toLowerCase(),
              t.conceptName.toLowerCase(),
              (t.notes ?? '').toLowerCase(),
            ];

            const containsQuery = searchableFields.some((field) =>
              field.includes(normalizedQuery)
            );
            expect(containsQuery).toBe(false);
          }
        }
      )
    );
  });

  it('empty query returns all transactions', () => {
    fc.assert(
      fc.property(
        fc.array(transactionRecordArb, { minLength: 0, maxLength: 20 }),
        (transactions) => {
          const results = searchTransactions(transactions, '');
          expect(results.length).toBe(transactions.length);
        }
      )
    );
  });
});

// --- Property 12: Multi-Filter Conjunction ---

describe('Property 12: Multi-Filter Conjunction', () => {
  /**
   * For any set of filters and transactions, every result from filterTransactions
   * matches ALL active filters.
   * Validates: Requirements 5.3
   */

  const filtersArb: fc.Arbitrary<TableFilters> = fc.record({
    month: fc.option(
      fc.constantFrom(
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ),
      { nil: undefined }
    ),
    year: fc.option(fc.integer({ min: 2020, max: 2030 }), { nil: undefined }),
    type: fc.option(typeArb, { nil: undefined }),
    categoryId: fc.option(fc.uuid(), { nil: undefined }),
    conceptId: fc.option(fc.uuid(), { nil: undefined }),
  });

  it('every filtered result matches ALL active filters simultaneously', () => {
    fc.assert(
      fc.property(
        fc.array(transactionRecordArb, { minLength: 0, maxLength: 20 }),
        filtersArb,
        (transactions, filters) => {
          const results = filterTransactions(transactions, filters);

          for (const t of results) {
            if (filters.month !== undefined) {
              expect(t.month).toBe(filters.month);
            }
            if (filters.year !== undefined) {
              expect(t.year).toBe(filters.year);
            }
            if (filters.type !== undefined) {
              expect(t.type).toBe(filters.type);
            }
            if (filters.categoryId !== undefined) {
              expect(t.categoryId).toBe(filters.categoryId);
            }
            if (filters.conceptId !== undefined) {
              expect(t.conceptId).toBe(filters.conceptId);
            }
          }
        }
      )
    );
  });

  it('no excluded transaction matches all active filters', () => {
    fc.assert(
      fc.property(
        fc.array(transactionRecordArb, { minLength: 0, maxLength: 20 }),
        filtersArb,
        (transactions, filters) => {
          const results = filterTransactions(transactions, filters);
          const resultIds = new Set(results.map((r) => r.id));
          const excluded = transactions.filter((t) => !resultIds.has(t.id));

          for (const t of excluded) {
            // At least one active filter must NOT match
            const matchesAll =
              (filters.month === undefined || t.month === filters.month) &&
              (filters.year === undefined || t.year === filters.year) &&
              (filters.type === undefined || t.type === filters.type) &&
              (filters.categoryId === undefined || t.categoryId === filters.categoryId) &&
              (filters.conceptId === undefined || t.conceptId === filters.conceptId);

            expect(matchesAll).toBe(false);
          }
        }
      )
    );
  });

  it('empty filters return all transactions', () => {
    fc.assert(
      fc.property(
        fc.array(transactionRecordArb, { minLength: 0, maxLength: 20 }),
        (transactions) => {
          const results = filterTransactions(transactions, {});
          expect(results.length).toBe(transactions.length);
        }
      )
    );
  });
});

// --- Property 13: Column Sorting Invariant ---

describe('Property 13: Column Sorting Invariant', () => {
  /**
   * For any sorted result, adjacent pairs satisfy ordering invariant for
   * numeric and string columns.
   * Validates: Requirements 5.4
   */

  const numericColumnArb = fc.constantFrom('year' as const, 'amount' as const);
  const stringColumnArb = fc.constantFrom(
    'date' as const,
    'month' as const,
    'type' as const,
    'categoryName' as const,
    'conceptName' as const,
    'currency' as const
  );
  const directionArb = fc.constantFrom('asc' as const, 'desc' as const);

  it('numeric columns maintain ordering invariant for adjacent pairs', () => {
    fc.assert(
      fc.property(
        fc.array(transactionRecordArb, { minLength: 2, maxLength: 20 }),
        numericColumnArb,
        directionArb,
        (transactions, column, direction) => {
          const sorted = sortTransactions(transactions, column, direction);

          for (let i = 0; i < sorted.length - 1; i++) {
            const valA = sorted[i][column];
            const valB = sorted[i + 1][column];

            // Skip pairs where either value is undefined/null (pushed to end)
            if (valA === undefined || valA === null || valB === undefined || valB === null) {
              continue;
            }

            if (direction === 'asc') {
              expect(valA).toBeLessThanOrEqual(valB as number);
            } else {
              expect(valA).toBeGreaterThanOrEqual(valB as number);
            }
          }
        }
      )
    );
  });

  it('string columns maintain ordering invariant for adjacent pairs', () => {
    fc.assert(
      fc.property(
        fc.array(transactionRecordArb, { minLength: 2, maxLength: 20 }),
        stringColumnArb,
        directionArb,
        (transactions, column, direction) => {
          const sorted = sortTransactions(transactions, column, direction);

          for (let i = 0; i < sorted.length - 1; i++) {
            const valA = sorted[i][column];
            const valB = sorted[i + 1][column];

            // Skip pairs where either value is undefined/null (pushed to end)
            if (valA === undefined || valA === null || valB === undefined || valB === null) {
              continue;
            }

            const comparison = String(valA).localeCompare(String(valB));

            if (direction === 'asc') {
              expect(comparison).toBeLessThanOrEqual(0);
            } else {
              expect(comparison).toBeGreaterThanOrEqual(0);
            }
          }
        }
      )
    );
  });

  it('sorting does not add or remove elements', () => {
    fc.assert(
      fc.property(
        fc.array(transactionRecordArb, { minLength: 0, maxLength: 20 }),
        fc.constantFrom('date' as const, 'amount' as const, 'year' as const),
        directionArb,
        (transactions, column, direction) => {
          const sorted = sortTransactions(transactions, column, direction);
          expect(sorted.length).toBe(transactions.length);
        }
      )
    );
  });
});
