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

  // Load accounts from Amplify
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

        if (items && items.length > 0) {
          const loadedAccounts: CashAccount[] = items.map((item) => ({
            id: item.id,
            name: item.name,
            isActive: item.isActive,
            balance: 0, // Balances are per-reconciliation, start at 0
          }));
          setAccounts(loadedAccounts);
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

          if (!cancelled) {
            setAccounts(created.length > 0 ? created : defaults);
          }
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
   */
  const saveReconciliation = useCallback(async () => {
    // Map display status to enum value
    const statusToEnum: Record<string, string> = {
      'Cuadrado': 'Cuadrado',
      'Falta ubicar': 'FaltaUbicar',
      'Sobra': 'Sobra',
    };

    const enumStatus = statusToEnum[reconciliation.status] ?? 'FaltaUbicar';

    const input = {
      cutoffDate: reconciliation.cutoffDate,
      month: reconciliation.month,
      year: reconciliation.year,
      automaticAccumulated: reconciliation.automaticAccumulated || 0,
      manualAdjustment: reconciliation.manualAdjustment || 0,
      totalBase: reconciliation.totalBase || 0,
      totalLocated: reconciliation.totalLocated || 0,
      pendingToLocate: reconciliation.pendingToLocate || 0,
      locatedPercentage: reconciliation.locatedPercentage || 0,
      status: enumStatus,
    };

    console.log('Saving reconciliation with input:', input);

    const result = await client.models.CashReconciliation.create(input as any);

    console.log('CashReconciliation.create result:', result);

    if (result.errors && result.errors.length > 0) {
      const errorMsg = result.errors.map((e: any) => e.message).join('; ');
      console.error('CashReconciliation create errors:', result.errors);
      throw new Error(errorMsg);
    }

    const reconRecord = result.data;
    if (!reconRecord) {
      throw new Error('No se recibió respuesta al guardar la conciliación');
    }

    // Save individual balances for active accounts
    const activeAccounts = accounts.filter((a) => a.isActive && a.balance !== 0);

    if (activeAccounts.length > 0) {
      const balanceResults = await Promise.all(
        activeAccounts.map((acc) =>
          client.models.CashBalance.create({
            reconciliationId: reconRecord.id,
            accountId: acc.id,
            accountName: acc.name,
            balance: acc.balance,
          } as any)
        )
      );

      // Check for balance creation errors
      for (const br of balanceResults) {
        if (br.errors && br.errors.length > 0) {
          console.error('CashBalance create error:', br.errors);
        }
      }
    }

    console.log('Reconciliation saved successfully, id:', reconRecord.id);
  }, [reconciliation, accounts]);

  return {
    accounts,
    reconciliation,
    isLoading,
    addAccount,
    editAccountName,
    deactivateAccount,
    updateBalance,
    setManualAdjustment,
    setAutomaticAccumulated,
    saveReconciliation,
  };
}
