import { describe, it, expect } from 'vitest';
import { categoryDistribution } from './distribution';
import { CalculationTransaction } from './types';

describe('categoryDistribution', () => {
  it('returns empty array for empty input', () => {
    expect(categoryDistribution([])).toEqual([]);
  });

  it('returns empty array for null/undefined-like empty transactions', () => {
    expect(categoryDistribution([] as CalculationTransaction[])).toEqual([]);
  });

  it('returns empty array when no Egreso transactions exist', () => {
    const transactions: CalculationTransaction[] = [
      { type: 'Ingreso', amount: 1000, category: 'Salario' },
      { type: 'Ingreso', amount: 500, category: 'Freelance' },
    ];
    expect(categoryDistribution(transactions)).toEqual([]);
  });

  it('returns empty array when all expense amounts are 0', () => {
    const transactions: CalculationTransaction[] = [
      { type: 'Egreso', amount: 0, category: 'Comida' },
      { type: 'Egreso', amount: 0, category: 'Transporte' },
    ];
    expect(categoryDistribution(transactions)).toEqual([]);
  });

  it('calculates distribution for a single category', () => {
    const transactions: CalculationTransaction[] = [
      { type: 'Egreso', amount: 500, category: 'Comida' },
      { type: 'Egreso', amount: 300, category: 'Comida' },
    ];
    const result = categoryDistribution(transactions);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Comida');
    expect(result[0].amount).toBe(800);
    expect(result[0].percentage).toBe(100);
  });

  it('calculates distribution for multiple categories above 5%', () => {
    const transactions: CalculationTransaction[] = [
      { type: 'Egreso', amount: 500, category: 'Comida' },
      { type: 'Egreso', amount: 300, category: 'Transporte' },
      { type: 'Egreso', amount: 200, category: 'Entretenimiento' },
    ];
    const result = categoryDistribution(transactions);
    expect(result).toHaveLength(3);

    const comida = result.find(r => r.category === 'Comida');
    const transporte = result.find(r => r.category === 'Transporte');
    const entretenimiento = result.find(r => r.category === 'Entretenimiento');

    expect(comida).toBeDefined();
    expect(comida!.amount).toBe(500);
    expect(comida!.percentage).toBe(50);

    expect(transporte).toBeDefined();
    expect(transporte!.amount).toBe(300);
    expect(transporte!.percentage).toBe(30);

    expect(entretenimiento).toBeDefined();
    expect(entretenimiento!.amount).toBe(200);
    expect(entretenimiento!.percentage).toBe(20);
  });

  it('groups categories below 5% into "Otros"', () => {
    const transactions: CalculationTransaction[] = [
      { type: 'Egreso', amount: 800, category: 'Comida' },
      { type: 'Egreso', amount: 150, category: 'Transporte' },
      { type: 'Egreso', amount: 30, category: 'Café' },
      { type: 'Egreso', amount: 20, category: 'Propinas' },
    ];
    // Total = 1000
    // Comida: 80%, Transporte: 15%, Café: 3%, Propinas: 2%
    const result = categoryDistribution(transactions);

    const mainCategories = result.filter(r => r.category !== 'Otros');
    const otros = result.find(r => r.category === 'Otros');

    expect(mainCategories).toHaveLength(2);
    expect(otros).toBeDefined();
    expect(otros!.amount).toBe(50);
  });

  it('sum of percentages equals 100%', () => {
    const transactions: CalculationTransaction[] = [
      { type: 'Egreso', amount: 333, category: 'A' },
      { type: 'Egreso', amount: 333, category: 'B' },
      { type: 'Egreso', amount: 334, category: 'C' },
    ];
    const result = categoryDistribution(transactions);
    const totalPercentage = result.reduce((sum, item) => sum + item.percentage, 0);
    expect(totalPercentage).toBe(100);
  });

  it('rounds percentages to 1 decimal place', () => {
    const transactions: CalculationTransaction[] = [
      { type: 'Egreso', amount: 700, category: 'Comida' },
      { type: 'Egreso', amount: 300, category: 'Transporte' },
    ];
    const result = categoryDistribution(transactions);
    for (const item of result) {
      const decimals = item.percentage.toString().split('.')[1];
      if (decimals) {
        expect(decimals.length).toBeLessThanOrEqual(1);
      }
    }
  });

  it('ignores Ingreso transactions in distribution', () => {
    const transactions: CalculationTransaction[] = [
      { type: 'Ingreso', amount: 5000, category: 'Salario' },
      { type: 'Egreso', amount: 600, category: 'Comida' },
      { type: 'Egreso', amount: 400, category: 'Transporte' },
    ];
    const result = categoryDistribution(transactions);
    expect(result).toHaveLength(2);
    expect(result.find(r => r.category === 'Salario')).toBeUndefined();
  });

  it('handles transactions with NaN/invalid amounts using sanitizeAmount', () => {
    const transactions: CalculationTransaction[] = [
      { type: 'Egreso', amount: NaN, category: 'Comida' },
      { type: 'Egreso', amount: 1000, category: 'Transporte' },
    ];
    const result = categoryDistribution(transactions);
    // NaN becomes 0, so only Transporte should have meaningful percentage
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Transporte');
    expect(result[0].percentage).toBe(100);
  });

  it('uses "Sin categoría" for transactions without category field', () => {
    const transactions: CalculationTransaction[] = [
      { type: 'Egreso', amount: 500 },
      { type: 'Egreso', amount: 500, category: 'Comida' },
    ];
    const result = categoryDistribution(transactions);
    expect(result.find(r => r.category === 'Sin categoría')).toBeDefined();
  });

  it('rounds amounts to 2 decimal places', () => {
    const transactions: CalculationTransaction[] = [
      { type: 'Egreso', amount: 333.333, category: 'A' },
      { type: 'Egreso', amount: 666.667, category: 'B' },
    ];
    const result = categoryDistribution(transactions);
    for (const item of result) {
      const decimals = item.amount.toString().split('.')[1];
      if (decimals) {
        expect(decimals.length).toBeLessThanOrEqual(2);
      }
    }
  });
});
