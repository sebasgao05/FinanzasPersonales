import { describe, it, expect } from 'vitest';
import { validateTransaction, TransactionFormData } from './transaction';

const validTransaction: TransactionFormData = {
  date: '2024-03-15',
  type: 'Egreso',
  categoryId: 'cat-001',
  conceptId: 'con-001',
  amount: 150.50,
  currency: 'COP',
};

describe('validateTransaction', () => {
  describe('campos obligatorios', () => {
    it('retorna válido cuando todos los campos obligatorios están presentes', () => {
      const result = validateTransaction(validTransaction);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('retorna error cuando date está vacío', () => {
      const result = validateTransaction({ ...validTransaction, date: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'date')).toBe(true);
    });

    it('retorna error cuando date es undefined', () => {
      const { date, ...rest } = validTransaction;
      const result = validateTransaction(rest);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'date')).toBe(true);
    });

    it('retorna error cuando type está vacío', () => {
      const result = validateTransaction({ ...validTransaction, type: '' as any });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('retorna error cuando type es undefined', () => {
      const { type, ...rest } = validTransaction;
      const result = validateTransaction(rest);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('retorna error cuando categoryId está vacío', () => {
      const result = validateTransaction({ ...validTransaction, categoryId: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'categoryId')).toBe(true);
    });

    it('retorna error cuando conceptId está vacío', () => {
      const result = validateTransaction({ ...validTransaction, conceptId: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'conceptId')).toBe(true);
    });

    it('retorna error cuando amount es undefined', () => {
      const { amount, ...rest } = validTransaction;
      const result = validateTransaction(rest);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'amount')).toBe(true);
    });

    it('retorna error cuando currency está vacío', () => {
      const result = validateTransaction({ ...validTransaction, currency: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'currency')).toBe(true);
    });

    it('retorna todos los errores cuando todos los campos faltan', () => {
      const result = validateTransaction({});
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(6);
      const fields = result.errors.map(e => e.field);
      expect(fields).toContain('date');
      expect(fields).toContain('type');
      expect(fields).toContain('categoryId');
      expect(fields).toContain('conceptId');
      expect(fields).toContain('amount');
      expect(fields).toContain('currency');
    });
  });

  describe('validación de tipo', () => {
    it('acepta Ingreso como tipo válido', () => {
      const result = validateTransaction({ ...validTransaction, type: 'Ingreso' });
      expect(result.isValid).toBe(true);
    });

    it('acepta Egreso como tipo válido', () => {
      const result = validateTransaction({ ...validTransaction, type: 'Egreso' });
      expect(result.isValid).toBe(true);
    });

    it('rechaza tipo inválido', () => {
      const result = validateTransaction({ ...validTransaction, type: 'Otro' as any });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });
  });

  describe('validación de rango de monto', () => {
    it('acepta monto mínimo 0.01', () => {
      const result = validateTransaction({ ...validTransaction, amount: 0.01 });
      expect(result.isValid).toBe(true);
    });

    it('acepta monto máximo 999,999,999.99', () => {
      const result = validateTransaction({ ...validTransaction, amount: 999_999_999.99 });
      expect(result.isValid).toBe(true);
    });

    it('rechaza monto menor a 0.01', () => {
      const result = validateTransaction({ ...validTransaction, amount: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'amount')).toBe(true);
    });

    it('rechaza monto negativo', () => {
      const result = validateTransaction({ ...validTransaction, amount: -10 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'amount')).toBe(true);
    });

    it('rechaza monto mayor a 999,999,999.99', () => {
      const result = validateTransaction({ ...validTransaction, amount: 1_000_000_000 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'amount')).toBe(true);
    });
  });

  describe('validación de rango de presupuesto', () => {
    it('acepta cuando presupuesto no está presente', () => {
      const result = validateTransaction(validTransaction);
      expect(result.isValid).toBe(true);
    });

    it('acepta presupuesto en rango válido', () => {
      const result = validateTransaction({ ...validTransaction, budget: 500 });
      expect(result.isValid).toBe(true);
    });

    it('rechaza presupuesto menor a 0.01', () => {
      const result = validateTransaction({ ...validTransaction, budget: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'budget')).toBe(true);
    });

    it('rechaza presupuesto mayor a 999,999,999.99', () => {
      const result = validateTransaction({ ...validTransaction, budget: 1_000_000_000 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'budget')).toBe(true);
    });
  });

  describe('validación de longitud de detalle', () => {
    it('acepta detalle con longitud menor o igual a 100', () => {
      const result = validateTransaction({ ...validTransaction, detail: 'a'.repeat(100) });
      expect(result.isValid).toBe(true);
    });

    it('rechaza detalle con longitud mayor a 100', () => {
      const result = validateTransaction({ ...validTransaction, detail: 'a'.repeat(101) });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'detail')).toBe(true);
    });

    it('acepta cuando detalle no está presente', () => {
      const result = validateTransaction(validTransaction);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validación de longitud de notas', () => {
    it('acepta notas con longitud menor o igual a 500', () => {
      const result = validateTransaction({ ...validTransaction, notes: 'a'.repeat(500) });
      expect(result.isValid).toBe(true);
    });

    it('rechaza notas con longitud mayor a 500', () => {
      const result = validateTransaction({ ...validTransaction, notes: 'a'.repeat(501) });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'notes')).toBe(true);
    });

    it('acepta cuando notas no están presentes', () => {
      const result = validateTransaction(validTransaction);
      expect(result.isValid).toBe(true);
    });
  });
});
