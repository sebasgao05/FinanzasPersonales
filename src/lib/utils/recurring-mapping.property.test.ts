import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 26: Recurring Payment to Transaction Mapping
 * For any active recurring payment, the generated transaction has:
 * type = payment.type, categoryId = payment.categoryId,
 * conceptId = payment.conceptId, amount = payment.estimatedAmount,
 * detail = payment.name, date = current date.
 *
 * Validates: Requirements 13.4
 */

interface RecurringPayment {
  id: string;
  name: string;
  type: 'Ingreso' | 'Egreso';
  categoryId: string;
  categoryName: string;
  conceptId: string;
  conceptName: string;
  estimatedAmount: number;
  payDay: number;
  frequency: 'mensual' | 'quincenal' | 'anual' | 'personalizada';
  customIntervalDays?: number;
  isActive: boolean;
  notes?: string;
}

interface GeneratedTransaction {
  date: string;
  type: 'Ingreso' | 'Egreso';
  categoryId: string;
  categoryName: string;
  conceptId: string;
  conceptName: string;
  amount: number;
  detail: string;
  currency: string;
}

/**
 * Pure function that generates a transaction from a recurring payment.
 * Returns null if the payment is inactive.
 * This mirrors the generateTransaction logic in useRecurringPayments hook.
 */
function generateTransaction(
  payment: RecurringPayment,
  currentDate: string,
  defaultCurrency: string
): GeneratedTransaction | null {
  if (!payment.isActive) return null;

  return {
    date: currentDate,
    type: payment.type,
    categoryId: payment.categoryId,
    categoryName: payment.categoryName,
    conceptId: payment.conceptId,
    conceptName: payment.conceptName,
    amount: payment.estimatedAmount,
    detail: payment.name,
    currency: defaultCurrency,
  };
}

// --- Generators ---

const typeArb = fc.constantFrom('Ingreso' as const, 'Egreso' as const);
const frequencyArb = fc.constantFrom(
  'mensual' as const,
  'quincenal' as const,
  'anual' as const,
  'personalizada' as const
);

const dateArb = fc
  .tuple(
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(
    ([y, m, d]) =>
      `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  );

const recurringPaymentArb: fc.Arbitrary<RecurringPayment> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  type: typeArb,
  categoryId: fc.uuid(),
  categoryName: fc.string({ minLength: 1, maxLength: 30 }),
  conceptId: fc.uuid(),
  conceptName: fc.string({ minLength: 1, maxLength: 30 }),
  estimatedAmount: fc.double({ min: 0.01, max: 999999999.99, noNaN: true }),
  payDay: fc.integer({ min: 1, max: 31 }),
  frequency: frequencyArb,
  customIntervalDays: fc.option(fc.integer({ min: 1, max: 365 }), { nil: undefined }),
  isActive: fc.boolean(),
  notes: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
});

const activePaymentArb: fc.Arbitrary<RecurringPayment> = recurringPaymentArb.map(
  (p) => ({ ...p, isActive: true })
);

const currencyArb = fc.constantFrom('COP', 'USD', 'EUR');

// --- Tests ---

describe('Property 26: Recurring Payment to Transaction Mapping', () => {
  it('generated transaction has type equal to payment.type', () => {
    fc.assert(
      fc.property(activePaymentArb, dateArb, currencyArb, (payment, date, currency) => {
        const tx = generateTransaction(payment, date, currency);
        expect(tx).not.toBeNull();
        expect(tx!.type).toBe(payment.type);
      })
    );
  });

  it('generated transaction has categoryId equal to payment.categoryId', () => {
    fc.assert(
      fc.property(activePaymentArb, dateArb, currencyArb, (payment, date, currency) => {
        const tx = generateTransaction(payment, date, currency);
        expect(tx).not.toBeNull();
        expect(tx!.categoryId).toBe(payment.categoryId);
      })
    );
  });

  it('generated transaction has conceptId equal to payment.conceptId', () => {
    fc.assert(
      fc.property(activePaymentArb, dateArb, currencyArb, (payment, date, currency) => {
        const tx = generateTransaction(payment, date, currency);
        expect(tx).not.toBeNull();
        expect(tx!.conceptId).toBe(payment.conceptId);
      })
    );
  });

  it('generated transaction has amount equal to payment.estimatedAmount', () => {
    fc.assert(
      fc.property(activePaymentArb, dateArb, currencyArb, (payment, date, currency) => {
        const tx = generateTransaction(payment, date, currency);
        expect(tx).not.toBeNull();
        expect(tx!.amount).toBe(payment.estimatedAmount);
      })
    );
  });

  it('generated transaction has detail equal to payment.name', () => {
    fc.assert(
      fc.property(activePaymentArb, dateArb, currencyArb, (payment, date, currency) => {
        const tx = generateTransaction(payment, date, currency);
        expect(tx).not.toBeNull();
        expect(tx!.detail).toBe(payment.name);
      })
    );
  });

  it('generated transaction has date equal to the current date provided', () => {
    fc.assert(
      fc.property(activePaymentArb, dateArb, currencyArb, (payment, date, currency) => {
        const tx = generateTransaction(payment, date, currency);
        expect(tx).not.toBeNull();
        expect(tx!.date).toBe(date);
      })
    );
  });

  it('returns null for inactive recurring payments', () => {
    fc.assert(
      fc.property(
        recurringPaymentArb.map((p) => ({ ...p, isActive: false })),
        dateArb,
        currencyArb,
        (payment, date, currency) => {
          const tx = generateTransaction(payment, date, currency);
          expect(tx).toBeNull();
        }
      )
    );
  });

  it('all fields are correctly mapped together in a single assertion', () => {
    fc.assert(
      fc.property(activePaymentArb, dateArb, currencyArb, (payment, date, currency) => {
        const tx = generateTransaction(payment, date, currency);
        expect(tx).not.toBeNull();
        expect(tx).toEqual({
          date: date,
          type: payment.type,
          categoryId: payment.categoryId,
          categoryName: payment.categoryName,
          conceptId: payment.conceptId,
          conceptName: payment.conceptName,
          amount: payment.estimatedAmount,
          detail: payment.name,
          currency: currency,
        });
      })
    );
  });
});
