import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  validateRecurringPayment,
  type RecurringPaymentData,
} from '@/lib/validators/recurring';

/**
 * Recurring payment record stored in the mock data layer.
 * Matches the RecurringPayment entity from the Amplify schema.
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

/**
 * Shape of a generated transaction from a recurring payment.
 * Used in the confirmation dialog before actually creating the transaction.
 * Validates: Requirements 13.4
 */
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

// --- Mock data layer ---
// Simulates Amplify Data client for RecurringPayment entities.
// Stores data per user in memory (resets on page reload).

const recurringStore: Record<string, RecurringPayment[]> = {};

function getStore(userId: string): RecurringPayment[] {
  if (!recurringStore[userId]) {
    recurringStore[userId] = [];
  }
  return recurringStore[userId];
}

async function loadPayments(userId: string): Promise<RecurringPayment[]> {
  // Simulate async API call
  await new Promise((resolve) => setTimeout(resolve, 50));
  return getStore(userId);
}

async function persistStore(userId: string, records: RecurringPayment[]): Promise<void> {
  // Simulate async API call
  await new Promise((resolve) => setTimeout(resolve, 50));
  recurringStore[userId] = [...records];
}

// --- End mock data layer ---

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `recurring-${Date.now()}-${idCounter}`;
}

/**
 * Hook for managing recurring payments with CRUD, toggle active, and transaction generation.
 *
 * Behavior:
 * - Loads recurring payments for authenticated user (owner-based filtering)
 * - CRUD operations validate input using validateRecurringPayment
 * - toggleActive: switches isActive state of a payment
 * - deletePayment: permanent deletion (Req 13.6)
 * - generateTransaction: creates a transaction object from the payment with current date (Req 13.4)
 *
 * Requirements: 13.1, 13.2, 13.4, 13.6
 */
export function useRecurringPayments(): UseRecurringPaymentsReturn {
  const { user, isAuthenticated } = useAuth();

  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load payments when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const userId = user.userId;

    async function init() {
      setIsLoading(true);
      try {
        const records = await loadPayments(userId);
        if (cancelled) return;
        setPayments(records);
      } catch {
        // Keep current state on error
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  /**
   * Creates a new recurring payment after validation.
   * Throws if validation fails.
   * Requirement: 13.1, 13.7
   */
  const createPayment = useCallback(
    async (data: RecurringPaymentData) => {
      if (!user) return;

      const validation = validateRecurringPayment(data);
      if (!validation.isValid) {
        const messages = validation.errors.map((e) => `${e.field}: ${e.message}`);
        throw new Error(messages.join('. '));
      }

      const now = new Date().toISOString();
      const newPayment: RecurringPayment = {
        id: generateId(),
        name: data.name.trim(),
        type: data.type,
        categoryId: data.categoryId,
        categoryName: data.categoryId, // In real app, resolve name from catalog
        conceptId: data.conceptId,
        conceptName: data.conceptId, // In real app, resolve name from catalog
        estimatedAmount: data.estimatedAmount,
        payDay: data.payDay,
        frequency: data.frequency,
        customIntervalDays: data.customIntervalDays,
        isActive: true,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...payments, newPayment];
      setPayments(updated);
      await persistStore(user.userId, updated);
    },
    [user, payments]
  );

  /**
   * Updates an existing recurring payment by ID with partial data.
   * Validates the merged data before applying.
   * Requirement: 13.2
   */
  const updatePayment = useCallback(
    async (id: string, data: Partial<RecurringPaymentData>) => {
      if (!user) return;

      const existing = payments.find((p) => p.id === id);
      if (!existing) return;

      // Merge existing with new data for validation
      const merged: RecurringPaymentData = {
        name: data.name !== undefined ? data.name : existing.name,
        type: data.type !== undefined ? data.type : existing.type,
        categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
        conceptId: data.conceptId !== undefined ? data.conceptId : existing.conceptId,
        estimatedAmount: data.estimatedAmount !== undefined ? data.estimatedAmount : existing.estimatedAmount,
        payDay: data.payDay !== undefined ? data.payDay : existing.payDay,
        frequency: data.frequency !== undefined ? data.frequency : existing.frequency,
        customIntervalDays: data.customIntervalDays !== undefined ? data.customIntervalDays : existing.customIntervalDays,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      };

      const validation = validateRecurringPayment(merged);
      if (!validation.isValid) {
        const messages = validation.errors.map((e) => `${e.field}: ${e.message}`);
        throw new Error(messages.join('. '));
      }

      const updated = payments.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          name: merged.name.trim(),
          type: merged.type,
          categoryId: merged.categoryId,
          categoryName: merged.categoryId, // In real app, resolve name from catalog
          conceptId: merged.conceptId,
          conceptName: merged.conceptId, // In real app, resolve name from catalog
          estimatedAmount: merged.estimatedAmount,
          payDay: merged.payDay,
          frequency: merged.frequency,
          customIntervalDays: merged.customIntervalDays,
          notes: merged.notes,
          updatedAt: new Date().toISOString(),
        };
      });

      setPayments(updated);
      await persistStore(user.userId, updated);
    },
    [user, payments]
  );

  /**
   * Deletes a recurring payment permanently.
   * Requirement: 13.6 (confirmation is handled in UI layer)
   */
  const deletePayment = useCallback(
    async (id: string) => {
      if (!user) return;

      const updated = payments.filter((p) => p.id !== id);
      setPayments(updated);
      await persistStore(user.userId, updated);
    },
    [user, payments]
  );

  /**
   * Toggles the isActive state of a recurring payment.
   * Requirement: 13.2 (deactivate option)
   */
  const toggleActive = useCallback(
    async (id: string) => {
      if (!user) return;

      const updated = payments.map((p) =>
        p.id === id ? { ...p, isActive: !p.isActive } : p
      );

      setPayments(updated);
      await persistStore(user.userId, updated);
    },
    [user, payments]
  );

  /**
   * Generates a transaction object from a recurring payment.
   * Returns null if the payment doesn't exist or is inactive.
   *
   * The generated transaction uses:
   * - Current date as the transaction date
   * - Payment's type, category, concept, and estimated amount
   * - Payment's name as the transaction detail
   * - Default currency 'COP' (in real app, would use user's default currency)
   *
   * Requirement: 13.4
   */
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
