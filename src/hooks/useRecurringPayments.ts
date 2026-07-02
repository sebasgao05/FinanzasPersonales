import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  validateRecurringPayment,
  type RecurringPaymentData,
} from '@/lib/validators/recurring';
import { client } from '@/lib/amplify-client';

/**
 * Recurring payment record from Amplify Data.
 */
export interface RecurringPayment {
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
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedTransaction {
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

export interface UseRecurringPaymentsReturn {
  payments: RecurringPayment[];
  isLoading: boolean;
  createPayment: (data: RecurringPaymentData) => Promise<void>;
  updatePayment: (id: string, data: Partial<RecurringPaymentData>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  generateTransaction: (paymentId: string) => GeneratedTransaction | null;
}

/**
 * Hook for managing recurring payments connected to Amplify Data.
 */
export function useRecurringPayments(): UseRecurringPaymentsReturn {
  const { user, isAuthenticated } = useAuth();

  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        const { data: items } = await client.models.RecurringPayment.list({ limit: 500 });
        if (cancelled) return;

        const records: RecurringPayment[] = (items ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type as 'Ingreso' | 'Egreso',
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          conceptId: item.conceptId,
          conceptName: item.conceptName,
          estimatedAmount: item.estimatedAmount,
          payDay: item.payDay,
          frequency: item.frequency as RecurringPayment['frequency'],
          customIntervalDays: item.customIntervalDays ?? undefined,
          isActive: item.isActive,
          notes: item.notes ?? undefined,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));

        setPayments(records);
      } catch (err) {
        console.error('Error loading recurring payments:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const createPayment = useCallback(
    async (data: RecurringPaymentData) => {
      const validation = validateRecurringPayment(data);
      if (!validation.isValid) {
        const messages = validation.errors.map((e) => `${e.field}: ${e.message}`);
        throw new Error(messages.join('. '));
      }

      const { data: created } = await client.models.RecurringPayment.create({
        name: data.name.trim(),
        type: data.type,
        categoryId: data.categoryId,
        categoryName: data.categoryName ?? data.categoryId,
        conceptId: data.conceptId,
        conceptName: data.conceptName ?? data.conceptId,
        estimatedAmount: data.estimatedAmount,
        payDay: data.payDay,
        frequency: data.frequency,
        customIntervalDays: data.customIntervalDays ?? undefined,
        isActive: true,
        notes: data.notes || undefined,
      } as any);

      if (created) {
        const newPayment: RecurringPayment = {
          id: created.id,
          name: created.name,
          type: created.type as 'Ingreso' | 'Egreso',
          categoryId: created.categoryId,
          categoryName: created.categoryName,
          conceptId: created.conceptId,
          conceptName: created.conceptName,
          estimatedAmount: created.estimatedAmount,
          payDay: created.payDay,
          frequency: created.frequency as RecurringPayment['frequency'],
          customIntervalDays: created.customIntervalDays ?? undefined,
          isActive: created.isActive,
          notes: created.notes ?? undefined,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
        setPayments((prev) => [...prev, newPayment]);
      }
    },
    []
  );

  const updatePayment = useCallback(
    async (id: string, data: Partial<RecurringPaymentData>) => {
      const existing = payments.find((p) => p.id === id);
      if (!existing) return;

      const merged: RecurringPaymentData = {
        name: data.name ?? existing.name,
        type: data.type ?? existing.type,
        categoryId: data.categoryId ?? existing.categoryId,
        conceptId: data.conceptId ?? existing.conceptId,
        estimatedAmount: data.estimatedAmount ?? existing.estimatedAmount,
        payDay: data.payDay ?? existing.payDay,
        frequency: data.frequency ?? existing.frequency,
        customIntervalDays: data.customIntervalDays ?? existing.customIntervalDays,
        notes: data.notes ?? existing.notes,
      };

      const validation = validateRecurringPayment(merged);
      if (!validation.isValid) {
        const messages = validation.errors.map((e) => `${e.field}: ${e.message}`);
        throw new Error(messages.join('. '));
      }

      await client.models.RecurringPayment.update({
        id,
        name: merged.name.trim(),
        type: merged.type,
        categoryId: merged.categoryId,
        conceptId: merged.conceptId,
        estimatedAmount: merged.estimatedAmount,
        payDay: merged.payDay,
        frequency: merged.frequency,
        customIntervalDays: merged.customIntervalDays ?? undefined,
        isActive: existing.isActive,
        notes: merged.notes || undefined,
      } as any);

      setPayments((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...merged, name: merged.name.trim(), updatedAt: new Date().toISOString() }
            : p
        )
      );
    },
    [payments]
  );

  const deletePayment = useCallback(async (id: string) => {
    await client.models.RecurringPayment.delete({ id });
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleActive = useCallback(
    async (id: string) => {
      const payment = payments.find((p) => p.id === id);
      if (!payment) return;

      await client.models.RecurringPayment.update({
        id,
        isActive: !payment.isActive,
      } as any);

      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
      );
    },
    [payments]
  );

  const generateTransaction = useCallback(
    (paymentId: string): GeneratedTransaction | null => {
      const payment = payments.find((p) => p.id === paymentId);
      if (!payment || !payment.isActive) return null;

      const today = new Date().toISOString().split('T')[0];

      return {
        date: today,
        type: payment.type,
        categoryId: payment.categoryId,
        categoryName: payment.categoryName,
        conceptId: payment.conceptId,
        conceptName: payment.conceptName,
        amount: payment.estimatedAmount,
        detail: payment.name,
        currency: 'COP',
      };
    },
    [payments]
  );

  return {
    payments,
    isLoading,
    createPayment,
    updatePayment,
    deletePayment,
    toggleActive,
    generateTransaction,
  };
}
