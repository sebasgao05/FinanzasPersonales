import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_ACCOUNTS } from '@/lib/utils/constants';
import { client } from '@/lib/amplify-client';
import {
  totalLocated as calcTotalLocated,
  pendingToLocate as calcPendingToLocate,
  locatedPercentage as calcLocatedPercentage,
  reconciliationStatus as calcReconciliationStatus,
  type AccountBalance as CalcAccountBalance,
} from '@/lib/calculations/reconciliation';

// --- Interfaces ---

export interface CashAccount {
  id: string;
  name: string;
  isActive: boolean;
  balance: number;
}

export interface ReconciliationData {
  cutoffDate: string;
  month: string;
  year: number;
  automaticAccumulated: number;
  manualAdjustment: number;
  totalBase: number;
  totalLocated: number;
  pendingToLocate: number;
  locatedPercentage: number;
  status: 'Cuadrado' | 'Falta ubicar' | 'Sobra';
}

export interface UseReconciliationReturn {
  accounts: CashAccount[];
  reconciliation: ReconciliationData;
  isLoading: boolean;
  addAccount: (name: string) => Promise<void>;
  editAccountName: (id: string, name: string) => Promise<void>;
  deactivateAccount: (id: string) => Promise<void>;
  reactivateAccount: (id: string) => Promise<void>;
  reorderAccounts: (fromIndex: number, toIndex: number) => Promise<void>;
  updateBalance: (id: string, balance: number) => void;
  setManualAdjustment: (value: number) => void;
  setAutomaticAccumulated: (value: number) => void;
  saveReconciliation: () => Promise<void>;
}

// --- Constants ---

const MAX_ACCOUNTS = 20;
const MAX_ACCOUNT_NAME_LENGTH = 30;

function buildDefaultAccounts(): CashAccount[] {
  return DEFAULT_ACCOUNTS.map((name, index) => ({
    id: `account-default-${index + 1}`,
    name,
    isActive: true,
    balance: 0,
  }));
}

function computeReconciliation(
  accounts: CashAccount[],
  automaticAccumulated: number,
  manualAdjustment: number,
  cutoffDate: string,
  month: string,
  year: number
): ReconciliationData {
  const totalBase = Math.round((automaticAccumulated + manualAdjustment) * 100) / 100;

  const calcAccounts: CalcAccountBalance[] = accounts.map((a) => ({
    balance: a.balance,
    isActive: a.isActive,
  }));

  const located = calcTotalLocated(calcAccounts);
  const pending = calcPendingToLocate(totalBase, located);
  const percentage = calcLocatedPercentage(located, totalBase);
  const status = calcReconciliationStatus(pending);

  return {
    cutoffDate,
    month,
    year,
    automaticAccumulated,
    manualAdjustment,
    totalBase,
    totalLocated: located,
    pendingToLocate: pending,
    locatedPercentage: percentage,
    status,
  };
}

/**
 * Hook for managing cash reconciliation (Caja y Bancos).
 * Connected to Amplify Data (CashAccount, CashReconciliation, CashBalance).
 */
export function useReconciliation(): UseReconciliationReturn {
  const { user, isAuthenticated } = useAuth();

  const [accounts, setAccounts] = useState<CashAccount[]>(buildDefaultAccounts());
  const [isLoading, setIsLoading] = useState(true);
  const [automaticAccumulated, setAutomaticAccumulatedState] = useState(0);
  const [manualAdjustment, setManualAdjustmentState] = useState(0);

  // Initialize with current date values immediately (not in useEffect)
  const now = new Date();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const [cutoffDate] = useState(now.toISOString().split('T')[0]);
  const [month] = useState(monthNames[now.getMonth()]);
  const [year] = useState(now.getFullYear());

  // Load accounts from Amplify and restore last reconciliation balances
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        const { data: items } = await client.models.CashAccount.list({ limit: 100 });

        if (cancelled) return;

        let loadedAccounts: CashAccount[];

        if (items && items.length > 0) {
          loadedAccounts = [...items]
            .sort((a, b) => ((a as any).order ?? 0) - ((b as any).order ?? 0))
            .map((item) => ({
              id: item.id,
              name: item.name,
              isActive: item.isActive,
              balance: 0,
            }));
        } else {
          // First time: create default accounts in DB
          const defaults = buildDefaultAccounts();
          const created: CashAccount[] = [];

          for (let i = 0; i < defaults.length; i++) {
            const acc = defaults[i];
            const { data: item } = await client.models.CashAccount.create({
              name: acc.name,
              isActive: true,
              order: i,
            } as any);
            if (item) {
              created.push({
                id: item.id,
                name: item.name,
                isActive: item.isActive,
                balance: 0,
              });
            }
          }

          loadedAccounts = created.length > 0 ? created : defaults;
        }

        if (cancelled) return;

        // Load the most recent reconciliation to restore balances
        try {
          const { data: reconciliations } = await (client.models as any).CashReconciliation.list({
            limit: 50,
          });

          if (reconciliations && reconciliations.length > 0) {
            // Sort by createdAt descending to get the most recent
            const sorted = [...reconciliations].sort((a: any, b: any) =>
              (b.createdAt || '').localeCompare(a.createdAt || '')
            );
            const latest = sorted[0];

            // Load balances for the latest reconciliation
            const { data: balances } = await (client.models as any).CashBalance.list({
              filter: { reconciliationId: { eq: latest.id } },
              limit: 100,
            });

            if (balances && balances.length > 0) {
              // Apply saved balances to accounts
              loadedAccounts = loadedAccounts.map((acc) => {
                const savedBalance = balances.find((b: any) => b.accountId === acc.id);
                return {
                  ...acc,
                  balance: savedBalance ? Number(savedBalance.balance) : 0,
                };
              });
            }

            // Restore manual adjustment from the last reconciliation
            if (latest.manualAdjustment != null) {
              setManualAdjustmentState(Number(latest.manualAdjustment) || 0);
            }
          }
        } catch (err) {
          console.warn('Could not load last reconciliation:', err);
        }

        if (!cancelled) {
          setAccounts(loadedAccounts);
        }
      } catch (err) {
        console.error('Error loading accounts:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  // Compute reconciliation state reactively
  const reconciliation: ReconciliationData = useMemo(() => {
    return computeReconciliation(
      accounts,
      automaticAccumulated,
      manualAdjustment,
      cutoffDate,
      month,
      year
    );
  }, [accounts, automaticAccumulated, manualAdjustment, cutoffDate, month, year]);

  const addAccount = useCallback(
    async (name: string) => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error('El nombre de la cuenta es obligatorio');
      }
      if (trimmedName.length > MAX_ACCOUNT_NAME_LENGTH) {
        throw new Error(`El nombre no puede exceder ${MAX_ACCOUNT_NAME_LENGTH} caracteres`);
      }
      const nameExists = accounts.some(
        (a) => a.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (nameExists) {
        throw new Error('Ya existe una cuenta con ese nombre');
      }
      if (accounts.length >= MAX_ACCOUNTS) {
        throw new Error(`No se pueden agregar más de ${MAX_ACCOUNTS} cuentas`);
      }

      const { data: created } = await client.models.CashAccount.create({
        name: trimmedName,
        isActive: true,
        order: accounts.length,
      } as any);

      if (created) {
        setAccounts((prev) => [
          ...prev,
          { id: created.id, name: created.name, isActive: created.isActive, balance: 0 },
        ]);
      }
    },
    [accounts]
  );

  const editAccountName = useCallback(
    async (id: string, name: string) => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error('El nombre de la cuenta es obligatorio');
      }
      if (trimmedName.length > MAX_ACCOUNT_NAME_LENGTH) {
        throw new Error(`El nombre no puede exceder ${MAX_ACCOUNT_NAME_LENGTH} caracteres`);
      }
      const nameExists = accounts.some(
        (a) => a.id !== id && a.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (nameExists) {
        throw new Error('Ya existe una cuenta con ese nombre');
      }

      await client.models.CashAccount.update({ id, name: trimmedName } as any);
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, name: trimmedName } : a))
      );
    },
    [accounts]
  );

  const deactivateAccount = useCallback(async (id: string) => {
    await client.models.CashAccount.update({ id, isActive: false } as any);
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: false } : a))
    );
  }, []);

  const reactivateAccount = useCallback(async (id: string) => {
    await client.models.CashAccount.update({ id, isActive: true } as any);
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: true } : a))
    );
  }, []);

  const reorderAccounts = useCallback(async (fromIndex: number, toIndex: number) => {
    setAccounts((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });

    // Persist new order to DB
    setAccounts((prev) => {
      prev.forEach((acc, idx) => {
        client.models.CashAccount.update({ id: acc.id, order: idx } as any).catch(() => {});
      });
      return prev;
    });
  }, []);

  const updateBalance = useCallback((id: string, balance: number) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, balance } : a))
    );
  }, []);

  const setManualAdjustment = useCallback((value: number) => {
    setManualAdjustmentState(value);
  }, []);

  const setAutomaticAccumulated = useCallback((value: number) => {
    setAutomaticAccumulatedState(value);
  }, []);

  /**
   * Persists the current reconciliation state to DynamoDB.
   * Uses a ref-based approach to always read fresh state.
   */
  const saveReconciliation = useCallback(async () => {
    // Map display status to schema enum value
    const statusToEnum: Record<string, string> = {
      'Cuadrado': 'Cuadrado',
      'Falta ubicar': 'FaltaUbicar',
      'Sobra': 'Sobra',
    };

    const enumStatus = statusToEnum[reconciliation.status] || 'FaltaUbicar';

    // Build input - all fields explicitly typed
    const createInput = {
      cutoffDate: String(reconciliation.cutoffDate),
      month: String(reconciliation.month),
      year: Number(reconciliation.year),
      automaticAccumulated: Number(reconciliation.automaticAccumulated) || 0,
      manualAdjustment: Number(reconciliation.manualAdjustment) || 0,
      totalBase: Number(reconciliation.totalBase) || 0,
      totalLocated: Number(reconciliation.totalLocated) || 0,
      pendingToLocate: Number(reconciliation.pendingToLocate) || 0,
      locatedPercentage: Number(reconciliation.locatedPercentage) || 0,
      status: enumStatus,
    };

    // Use try/catch around the actual API call
    let reconId: string;
    try {
      const result = await (client.models as any).CashReconciliation.create(createInput);
      if (result.errors?.length > 0) {
        throw new Error(result.errors.map((e: any) => e.message).join('; '));
      }
      if (!result.data?.id) {
        throw new Error('La API no retornó un ID para la conciliación creada');
      }
      reconId = result.data.id;
    } catch (err: any) {
      throw new Error(`Error al crear conciliación: ${err?.message || String(err)}`);
    }

    // Save balances
    const activeAccounts = accounts.filter((a) => a.isActive);
    const balanceErrors: string[] = [];

    for (const acc of activeAccounts) {
      try {
        const balResult = await (client.models as any).CashBalance.create({
          reconciliationId: reconId,
          accountId: acc.id,
          accountName: String(acc.name),
          balance: Number(acc.balance) || 0,
        });
        if (balResult.errors?.length > 0) {
          balanceErrors.push(`${acc.name}: ${balResult.errors[0].message}`);
        }
      } catch (err: any) {
        balanceErrors.push(`${acc.name}: ${err?.message || 'error desconocido'}`);
      }
    }

    if (balanceErrors.length > 0) {
      console.warn('Algunos saldos no se guardaron:', balanceErrors);
    }
  }, [reconciliation, accounts]);

  return {
    accounts,
    reconciliation,
    isLoading,
    addAccount,
    editAccountName,
    deactivateAccount,
    reactivateAccount,
    reorderAccounts,
    updateBalance,
    setManualAdjustment,
    setAutomaticAccumulated,
    saveReconciliation,
  };
}
