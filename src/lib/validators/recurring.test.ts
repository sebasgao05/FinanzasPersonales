import { describe, it, expect } from 'vitest';
import { validateRecurringPayment, RecurringPaymentData } from './recurring';

const validData: RecurringPaymentData = {
  name: 'Arriendo mensual',
  type: 'Egreso',
  categoryId: 'cat-001',
  conceptId: 'con-001',
  estimatedAmount: 1500000,
  payDay: 5,
  frequency: 'mensual',
  notes: 'Pago de arriendo',
};

describe('validateRecurringPayment', () => {
  describe('valid data', () => {
    it('should return isValid true for complete valid data', () => {
      const result = validateRecurringPayment(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept data without optional notes', () => {
      const { notes, ...dataWithoutNotes } = validData;
      const result = validateRecurringPayment(dataWithoutNotes);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept frequency personalizada with valid customIntervalDays', () => {
      const data: RecurringPaymentData = {
        ...validData,
        frequency: 'personalizada',
        customIntervalDays: 45,
      };
      const result = validateRecurringPayment(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('name validation', () => {
    it('should reject missing name', () => {
      const { name, ...data } = validData;
      const result = validateRecurringPayment(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'name' }));
    });

    it('should reject empty name', () => {
      const result = validateRecurringPayment({ ...validData, name: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'name' }));
    });

    it('should reject whitespace-only name', () => {
      const result = validateRecurringPayment({ ...validData, name: '   ' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'name' }));
    });

    it('should reject name exceeding 100 characters', () => {
      const result = validateRecurringPayment({ ...validData, name: 'a'.repeat(101) });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'name' }));
    });

    it('should accept name with exactly 100 characters', () => {
      const result = validateRecurringPayment({ ...validData, name: 'a'.repeat(100) });
      expect(result.isValid).toBe(true);
    });
  });

  describe('type validation', () => {
    it('should reject missing type', () => {
      const { type, ...data } = validData;
      const result = validateRecurringPayment(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'type' }));
    });

    it('should reject invalid type', () => {
      const result = validateRecurringPayment({ ...validData, type: 'Otro' as any });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'type' }));
    });

    it('should accept Ingreso', () => {
      const result = validateRecurringPayment({ ...validData, type: 'Ingreso' });
      expect(result.isValid).toBe(true);
    });

    it('should accept Egreso', () => {
      const result = validateRecurringPayment({ ...validData, type: 'Egreso' });
      expect(result.isValid).toBe(true);
    });
  });

  describe('categoryId validation', () => {
    it('should reject missing categoryId', () => {
      const { categoryId, ...data } = validData;
      const result = validateRecurringPayment(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'categoryId' }));
    });

    it('should reject empty categoryId', () => {
      const result = validateRecurringPayment({ ...validData, categoryId: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'categoryId' }));
    });
  });

  describe('conceptId validation', () => {
    it('should reject missing conceptId', () => {
      const { conceptId, ...data } = validData;
      const result = validateRecurringPayment(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'conceptId' }));
    });

    it('should reject empty conceptId', () => {
      const result = validateRecurringPayment({ ...validData, conceptId: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'conceptId' }));
    });
  });

  describe('estimatedAmount validation', () => {
    it('should reject missing estimatedAmount', () => {
      const { estimatedAmount, ...data } = validData;
      const result = validateRecurringPayment(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'estimatedAmount' }));
    });

    it('should reject amount of 0', () => {
      const result = validateRecurringPayment({ ...validData, estimatedAmount: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'estimatedAmount' }));
    });

    it('should reject negative amount', () => {
      const result = validateRecurringPayment({ ...validData, estimatedAmount: -100 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'estimatedAmount' }));
    });

    it('should reject amount exceeding 999,999,999.99', () => {
      const result = validateRecurringPayment({ ...validData, estimatedAmount: 1_000_000_000 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'estimatedAmount' }));
    });

    it('should accept minimum valid amount 0.01', () => {
      const result = validateRecurringPayment({ ...validData, estimatedAmount: 0.01 });
      expect(result.isValid).toBe(true);
    });

    it('should accept maximum valid amount 999,999,999.99', () => {
      const result = validateRecurringPayment({ ...validData, estimatedAmount: 999_999_999.99 });
      expect(result.isValid).toBe(true);
    });
  });

  describe('payDay validation', () => {
    it('should reject missing payDay', () => {
      const { payDay, ...data } = validData;
      const result = validateRecurringPayment(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'payDay' }));
    });

    it('should reject payDay of 0', () => {
      const result = validateRecurringPayment({ ...validData, payDay: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'payDay' }));
    });

    it('should reject payDay greater than 31', () => {
      const result = validateRecurringPayment({ ...validData, payDay: 32 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'payDay' }));
    });

    it('should reject non-integer payDay', () => {
      const result = validateRecurringPayment({ ...validData, payDay: 15.5 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'payDay' }));
    });

    it('should accept payDay of 1', () => {
      const result = validateRecurringPayment({ ...validData, payDay: 1 });
      expect(result.isValid).toBe(true);
    });

    it('should accept payDay of 31', () => {
      const result = validateRecurringPayment({ ...validData, payDay: 31 });
      expect(result.isValid).toBe(true);
    });
  });

  describe('frequency validation', () => {
    it('should reject missing frequency', () => {
      const { frequency, ...data } = validData;
      const result = validateRecurringPayment(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'frequency' }));
    });

    it('should reject invalid frequency', () => {
      const result = validateRecurringPayment({ ...validData, frequency: 'semanal' as any });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'frequency' }));
    });

    it('should accept all valid frequencies', () => {
      for (const freq of ['mensual', 'quincenal', 'anual', 'personalizada'] as const) {
        const data: RecurringPaymentData = {
          ...validData,
          frequency: freq,
          ...(freq === 'personalizada' ? { customIntervalDays: 30 } : {}),
        };
        const result = validateRecurringPayment(data);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('customIntervalDays validation', () => {
    it('should require customIntervalDays when frequency is personalizada', () => {
      const result = validateRecurringPayment({ ...validData, frequency: 'personalizada' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'customIntervalDays' }));
    });

    it('should reject customIntervalDays of 0 for personalizada', () => {
      const result = validateRecurringPayment({
        ...validData,
        frequency: 'personalizada',
        customIntervalDays: 0,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'customIntervalDays' }));
    });

    it('should reject customIntervalDays greater than 365 for personalizada', () => {
      const result = validateRecurringPayment({
        ...validData,
        frequency: 'personalizada',
        customIntervalDays: 366,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'customIntervalDays' }));
    });

    it('should reject non-integer customIntervalDays', () => {
      const result = validateRecurringPayment({
        ...validData,
        frequency: 'personalizada',
        customIntervalDays: 30.5,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'customIntervalDays' }));
    });

    it('should accept customIntervalDays of 1', () => {
      const result = validateRecurringPayment({
        ...validData,
        frequency: 'personalizada',
        customIntervalDays: 1,
      });
      expect(result.isValid).toBe(true);
    });

    it('should accept customIntervalDays of 365', () => {
      const result = validateRecurringPayment({
        ...validData,
        frequency: 'personalizada',
        customIntervalDays: 365,
      });
      expect(result.isValid).toBe(true);
    });

    it('should not require customIntervalDays when frequency is not personalizada', () => {
      const result = validateRecurringPayment({ ...validData, frequency: 'mensual' });
      expect(result.isValid).toBe(true);
    });
  });

  describe('notes validation', () => {
    it('should accept undefined notes', () => {
      const { notes, ...data } = validData;
      const result = validateRecurringPayment(data);
      expect(result.isValid).toBe(true);
    });

    it('should accept empty string notes', () => {
      const result = validateRecurringPayment({ ...validData, notes: '' });
      expect(result.isValid).toBe(true);
    });

    it('should reject notes exceeding 500 characters', () => {
      const result = validateRecurringPayment({ ...validData, notes: 'a'.repeat(501) });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'notes' }));
    });

    it('should accept notes with exactly 500 characters', () => {
      const result = validateRecurringPayment({ ...validData, notes: 'a'.repeat(500) });
      expect(result.isValid).toBe(true);
    });
  });

  describe('multiple errors', () => {
    it('should return all errors for completely empty data', () => {
      const result = validateRecurringPayment({});
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(7);
    });

    it('should identify all invalid fields simultaneously', () => {
      const result = validateRecurringPayment({
        name: '',
        type: 'Invalid' as any,
        categoryId: '',
        conceptId: '',
        estimatedAmount: -1,
        payDay: 0,
        frequency: 'invalid' as any,
      });
      expect(result.isValid).toBe(false);
      const fields = result.errors.map(e => e.field);
      expect(fields).toContain('name');
      expect(fields).toContain('type');
      expect(fields).toContain('categoryId');
      expect(fields).toContain('conceptId');
      expect(fields).toContain('estimatedAmount');
      expect(fields).toContain('payDay');
      expect(fields).toContain('frequency');
    });
  });
});
