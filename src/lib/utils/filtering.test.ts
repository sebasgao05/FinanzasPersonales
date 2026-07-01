import { describe, it, expect } from 'vitest';
import {
  filterTransactions,
  searchTransactions,
  sortTransactions,
  filterCategoriesByType,
  filterConceptsByCategory,
  TransactionRecord,
  CatalogItem,
} from './filtering';

// --- Test data factories ---

function makeTransaction(overrides: Partial<TransactionRecord> = {}): TransactionRecord {
  return {
    id: '1',
    date: '2024-03-15',
    month: 'Marzo',
    year: 2024,
    type: 'Egreso',
    categoryId: 'cat-1',
    categoryName: 'Alimentación',
    conceptId: 'con-1',
    conceptName: 'Supermercado',
    detail: 'Compra semanal',
    budget: 500000,
    amount: 450000,
    currency: 'COP',
    notes: 'Pago con tarjeta',
    ...overrides,
  };
}

const sampleTransactions: TransactionRecord[] = [
  makeTransaction({ id: '1', month: 'Enero', year: 2024, type: 'Ingreso', categoryId: 'cat-i1', categoryName: 'Salario', conceptId: 'con-i1', conceptName: 'Nómina', amount: 5000000 }),
  makeTransaction({ id: '2', month: 'Enero', year: 2024, type: 'Egreso', categoryId: 'cat-e1', categoryName: 'Alimentación', conceptId: 'con-e1', conceptName: 'Supermercado', amount: 400000 }),
  makeTransaction({ id: '3', month: 'Febrero', year: 2024, type: 'Egreso', categoryId: 'cat-e2', categoryName: 'Transporte', conceptId: 'con-e2', conceptName: 'Gasolina', amount: 200000, detail: 'Tanqueo completo', notes: 'Estación Shell' }),
  makeTransaction({ id: '4', month: 'Marzo', year: 2023, type: 'Ingreso', categoryId: 'cat-i1', categoryName: 'Salario', conceptId: 'con-i1', conceptName: 'Nómina', amount: 4500000 }),
  makeTransaction({ id: '5', month: 'Marzo', year: 2024, type: 'Egreso', categoryId: 'cat-e1', categoryName: 'Alimentación', conceptId: 'con-e3', conceptName: 'Restaurante', amount: 150000, notes: 'Almuerzo de trabajo' }),
];

// --- filterTransactions tests ---

describe('filterTransactions', () => {
  it('returns all transactions when no filters active', () => {
    const result = filterTransactions(sampleTransactions, {});
    expect(result).toHaveLength(5);
  });

  it('filters by month', () => {
    const result = filterTransactions(sampleTransactions, { month: 'Enero' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.month === 'Enero')).toBe(true);
  });

  it('filters by year', () => {
    const result = filterTransactions(sampleTransactions, { year: 2023 });
    expect(result).toHaveLength(1);
    expect(result[0].year).toBe(2023);
  });

  it('filters by type', () => {
    const result = filterTransactions(sampleTransactions, { type: 'Ingreso' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.type === 'Ingreso')).toBe(true);
  });

  it('filters by categoryId', () => {
    const result = filterTransactions(sampleTransactions, { categoryId: 'cat-e1' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.categoryId === 'cat-e1')).toBe(true);
  });

  it('filters by conceptId', () => {
    const result = filterTransactions(sampleTransactions, { conceptId: 'con-e2' });
    expect(result).toHaveLength(1);
    expect(result[0].conceptName).toBe('Gasolina');
  });

  it('applies multiple filters as conjunction (AND)', () => {
    const result = filterTransactions(sampleTransactions, {
      month: 'Enero',
      year: 2024,
      type: 'Egreso',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('returns empty array when no transactions match all filters', () => {
    const result = filterTransactions(sampleTransactions, {
      month: 'Diciembre',
      year: 2025,
    });
    expect(result).toHaveLength(0);
  });

  it('ignores undefined filter values', () => {
    const result = filterTransactions(sampleTransactions, {
      month: undefined,
      year: 2024,
      type: undefined,
    });
    expect(result).toHaveLength(4);
  });

  it('handles empty transactions array', () => {
    const result = filterTransactions([], { month: 'Enero' });
    expect(result).toHaveLength(0);
  });
});

// --- searchTransactions tests ---

describe('searchTransactions', () => {
  it('returns all transactions when query is empty', () => {
    const result = searchTransactions(sampleTransactions, '');
    expect(result).toHaveLength(5);
  });

  it('returns all transactions when query is whitespace', () => {
    const result = searchTransactions(sampleTransactions, '   ');
    expect(result).toHaveLength(5);
  });

  it('searches in detail field (case-insensitive)', () => {
    const result = searchTransactions(sampleTransactions, 'tanqueo');
    expect(result).toHaveLength(1);
    expect(result[0].detail).toBe('Tanqueo completo');
  });

  it('searches in categoryName field', () => {
    const result = searchTransactions(sampleTransactions, 'alimentación');
    expect(result).toHaveLength(2);
  });

  it('searches in conceptName field', () => {
    const result = searchTransactions(sampleTransactions, 'nómina');
    expect(result).toHaveLength(2);
  });

  it('searches in notes field', () => {
    const result = searchTransactions(sampleTransactions, 'shell');
    expect(result).toHaveLength(1);
    expect(result[0].notes).toBe('Estación Shell');
  });

  it('performs partial match', () => {
    const result = searchTransactions(sampleTransactions, 'super');
    expect(result).toHaveLength(1);
    expect(result[0].conceptName).toBe('Supermercado');
  });

  it('is case-insensitive', () => {
    const resultLower = searchTransactions(sampleTransactions, 'salario');
    const resultUpper = searchTransactions(sampleTransactions, 'SALARIO');
    expect(resultLower).toHaveLength(2);
    expect(resultUpper).toHaveLength(2);
  });

  it('returns empty array when no match found', () => {
    const result = searchTransactions(sampleTransactions, 'zzz_no_match');
    expect(result).toHaveLength(0);
  });

  it('handles transactions with undefined optional fields', () => {
    const txWithNoOptionals = makeTransaction({ detail: undefined, notes: undefined });
    const result = searchTransactions([txWithNoOptionals], 'Alimentación');
    expect(result).toHaveLength(1);
  });
});

// --- sortTransactions tests ---

describe('sortTransactions', () => {
  it('sorts by amount ascending', () => {
    const result = sortTransactions(sampleTransactions, 'amount', 'asc');
    for (let i = 1; i < result.length; i++) {
      expect(result[i].amount).toBeGreaterThanOrEqual(result[i - 1].amount);
    }
  });

  it('sorts by amount descending', () => {
    const result = sortTransactions(sampleTransactions, 'amount', 'desc');
    for (let i = 1; i < result.length; i++) {
      expect(result[i].amount).toBeLessThanOrEqual(result[i - 1].amount);
    }
  });

  it('sorts by date ascending', () => {
    const result = sortTransactions(sampleTransactions, 'date', 'asc');
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date >= result[i - 1].date).toBe(true);
    }
  });

  it('sorts by string columns (categoryName) ascending', () => {
    const result = sortTransactions(sampleTransactions, 'categoryName', 'asc');
    for (let i = 1; i < result.length; i++) {
      expect(result[i].categoryName.localeCompare(result[i - 1].categoryName)).toBeGreaterThanOrEqual(0);
    }
  });

  it('does not mutate the original array', () => {
    const original = [...sampleTransactions];
    sortTransactions(sampleTransactions, 'amount', 'asc');
    expect(sampleTransactions).toEqual(original);
  });

  it('handles empty array', () => {
    const result = sortTransactions([], 'amount', 'asc');
    expect(result).toHaveLength(0);
  });

  it('handles undefined values by pushing them to end (asc)', () => {
    const transactions = [
      makeTransaction({ id: '1', detail: undefined, amount: 100 }),
      makeTransaction({ id: '2', detail: 'B', amount: 200 }),
      makeTransaction({ id: '3', detail: 'A', amount: 300 }),
    ];
    const result = sortTransactions(transactions, 'detail', 'asc');
    expect(result[result.length - 1].detail).toBeUndefined();
  });
});

// --- filterCategoriesByType tests ---

describe('filterCategoriesByType', () => {
  const categories: CatalogItem[] = [
    { id: '1', name: 'Salario', type: 'Ingreso', isActive: true },
    { id: '2', name: 'Freelance', type: 'Ingreso', isActive: true },
    { id: '3', name: 'Alimentación', type: 'Egreso', isActive: true },
    { id: '4', name: 'Transporte', type: 'Egreso', isActive: true },
    { id: '5', name: 'Bonos', type: 'Ingreso', isActive: false },
    { id: '6', name: 'Entretenimiento', type: 'Egreso', isActive: false },
  ];

  it('filters categories by Ingreso type', () => {
    const result = filterCategoriesByType(categories, 'Ingreso');
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.type === 'Ingreso')).toBe(true);
  });

  it('filters categories by Egreso type', () => {
    const result = filterCategoriesByType(categories, 'Egreso');
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.type === 'Egreso')).toBe(true);
  });

  it('only returns active categories', () => {
    const result = filterCategoriesByType(categories, 'Ingreso');
    expect(result.every((c) => c.isActive === true)).toBe(true);
    expect(result.find((c) => c.name === 'Bonos')).toBeUndefined();
  });

  it('returns empty array when no matching categories', () => {
    const emptyCategories: CatalogItem[] = [
      { id: '1', name: 'Test', type: 'Egreso', isActive: true },
    ];
    const result = filterCategoriesByType(emptyCategories, 'Ingreso');
    expect(result).toHaveLength(0);
  });

  it('handles empty array input', () => {
    const result = filterCategoriesByType([], 'Ingreso');
    expect(result).toHaveLength(0);
  });
});

// --- filterConceptsByCategory tests ---

describe('filterConceptsByCategory', () => {
  const concepts: CatalogItem[] = [
    { id: '1', name: 'Supermercado', categoryId: 'cat-1', isActive: true },
    { id: '2', name: 'Restaurante', categoryId: 'cat-1', isActive: true },
    { id: '3', name: 'Gasolina', categoryId: 'cat-2', isActive: true },
    { id: '4', name: 'Uber', categoryId: 'cat-2', isActive: false },
    { id: '5', name: 'Mercado orgánico', categoryId: 'cat-1', isActive: false },
  ];

  it('filters concepts by categoryId', () => {
    const result = filterConceptsByCategory(concepts, 'cat-1');
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.categoryId === 'cat-1')).toBe(true);
  });

  it('only returns active concepts', () => {
    const result = filterConceptsByCategory(concepts, 'cat-1');
    expect(result.every((c) => c.isActive === true)).toBe(true);
    expect(result.find((c) => c.name === 'Mercado orgánico')).toBeUndefined();
  });

  it('returns empty array when no matching concepts', () => {
    const result = filterConceptsByCategory(concepts, 'cat-nonexistent');
    expect(result).toHaveLength(0);
  });

  it('handles empty array input', () => {
    const result = filterConceptsByCategory([], 'cat-1');
    expect(result).toHaveLength(0);
  });

  it('excludes inactive concepts for the matching category', () => {
    const result = filterConceptsByCategory(concepts, 'cat-2');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Gasolina');
  });
});
