import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_ACCOUNTS } from '@/lib/utils/constants';
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

// --- Mock data layer ---
// Simulates Amplify Data client for CashAccount, CashReconciliation,
// and CashBalance entities. Stores data per user in memory.

interface ReconciliationStore {
  accounts: CashAccount[];
  reconciliations: ReconciliationData[];
}

const reconciliationStore: Record<string, ReconciliationStore> = {};

function getStore(userId: string): ReconciliationStore {
  if (!reconciliationStore[userId]) {
    reconciliationStore[userId] = {
      accounts: buildDefaultAccounts(),
      reconciliations: [],
    };
  }
  return reconciliationStore[userId];
}

function buildDefaultAccounts(): CashAccount[] {
  return DEFAULT_ACCOUNTS.map((name, index) => ({
    id: `account-default-${index + 1}`,
    name,
    isActive: true,
    balance: 0,
  }));
}

async function loadStore(userId: string): Promise<ReconciliationStore> {
  // Simulate async API call
  await new Promise((resolve) => setTimeout(resolve, 50));
  return getStore(userId);
}

async function persistAccounts(userId: string, accounts: CashAccount[]): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const store = getStore(userId);
  store.accounts = [...accounts];
}

async function persistReconciliation(
  userId: string,
  reconciliation: ReconciliationData
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const store = getStore(userId);
  store.reconciliations = [...store.reconciliations, reconciliation];
}

// --- End mock data layer ---

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `account-${Date.now()}-${idCounter}`;
}

/**
 * Computes reconciliation totals from accounts and base values.
 */
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
 *
 * Behavior:
 * - Initializes with DEFAULT_ACCOUNTS (6 accounts: Efectivo, Nequi, Daviplata, Bancolombia, Lulo, Nu)
 * - Max 20 accounts, name max 30 chars, unique names (case-insensitive)
 * - When account balances change, recalculates: totalLocated, pendingToLocate, locatedPercentage, status
 * - totalBase = automaticAccumulated + manualAdjustment
 * - saveReconciliation persists the current state
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.9
 */
export function useReconciliation(): UseReconciliationReturn {
  const { user, isAuthenticated } = useAuth();

  const [accounts, setAccounts] = useState<CashAccount[]>(buildDefaultAccounts());
  const [isLoading, setIsLoading] = useState(true);
  const [automaticAccumulated, setAutomaticAccumulatedState] = useState(0);
  const [manualAdjustment, setManualAdjustmentState] = useState(0);
  const [cutoffDate, setCutoffDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  // Initialize month from current date
  useEffect(() => {
    const now = new Date();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    setMonth(months[now.getMonth()]);
    setYear(now.getFullYear());
    setCutoffDate(now.toISOString().split('T')[0]);
  }, []);

  // Load accounts when user is authenticated (Req 10.3)
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
        const store = await loadStore(userId);
        if (cancelled) return;
        setAccounts(store.accounts);
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

  // Compute reconciliation state reactively (Req 10.1, 10.5)
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

  /**
   * Adds a new bank account.
   * Validates: max 20 accounts, name max 30 chars, unique name.
   * Requirement: 10.4
   */
  const addAccount = useCallback(
    async (name: string) => {
      if (!user) return;

      const trimmedName = name.trim();

      // Validate name is not empty
      if (!trimmedName) {
        throw new Error('El nombre de la cuenta es obligatorio');
      }

      // Validate max length (30 chars)
      if (trimmedName.length > MAX_ACCOUNT_NAME_LENGTH) {
        throw new Error(`El nombre no puede exceder ${MAX_ACCOUNT_NAME_LENGTH} caracteres`);
      }

      // Validate unique name (case-insensitive)
      const nameExists = accounts.some(
        (a) => a.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (nameExists) {
        throw new Error('Ya existe una cuenta con ese nombre');
      }

      // Validate max accounts (20)
      if (accounts.length >= MAX_ACCOUNTS) {
        throw new Error(`No se pueden agregar más de ${MAX_ACCOUNTS} cuentas`);
      }

      const newAccount: CashAccount = {
        id: generateId(),
        name: trimmedName,
        isActive: true,
        balance: 0,
      };

      const updated = [...accounts, newAccount];
      setAccounts(updated);

      await persistAccounts(user.userId, updated);
    },
    [user, accounts]
  );

  /**
   * Edits the name of an existing account.
   * Validates: name max 30 chars, unique name.
   * Requirement: 10.4
   */
  const editAccountName = useCallback(
    async (id: string, name: string) => {
      if (!user) return;

      const trimmedName = name.trim();

      // Validate name is not empty
      if (!trimmedName) {
        throw new Error('El nombre de la cuenta es obligatorio');
      }

      // Validate max length (30 chars)
      if (trimmedName.length > MAX_ACCOUNT_NAME_LENGTH) {
        throw new Error(`El nombre no puede exceder ${MAX_ACCOUNT_NAME_LENGTH} caracteres`);
      }

      // Validate unique name (case-insensitive), excluding current account
      const nameExists = accounts.some(
        (a) => a.id !== id && a.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (nameExists) {
        throw new Error('Ya existe una cuenta con ese nombre');
      }

      const updated = accounts.map((a) =>
        a.id === id ? { ...a, name: trimmedName } : a
      );
      setAccounts(updated);

      await persistAccounts(user.userId, updated);
    },
    [user, accounts]
  );

  /**
   * Deactivates an account (sets isActive to false).
   * Requirement: 10.4
   */
  const deactivateAccount = useCallback(
    async (id: string) => {
      if (!user) return;

      const updated = accounts.map((a) =>
        a.id === id ? { ...a, isActive: false } : a
      );
      setAccounts(updated);

      await persistAccounts(user.userId, updated);
    },
    [user, accounts]
  );

  /**
   * Updates the balance of a specific account.
   * Allows negative values for overdrafts (Req 10.5).
   */
  const updateBalance = useCallback(
    (id: string, balance: number) => {
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, balance } : a))
      );
    },
    []
  );

  /**
   * Sets the manual adjustment value.
   * Requirement: 10.1
   */
  const setManualAdjustment = useCallback((value: number) => {
    setManualAdjustmentState(value);
  }, []);

  /**
   * Sets the automatic accumulated value (from cash flow module).
   * Requirement: 10.2
   */
  const setAutomaticAccumulated = useCallback((value: number) => {
    setAutomaticAccumulatedState(value);
  }, []);

  /**
   * Persists the current reconciliation state.
   * Creates CashReconciliation + CashBalance records.
   * Requirement: 10.9
   */
  const saveReconciliation = useCallback(async () => {
    if (!user) return;

    await persistReconciliation(user.userId, reconciliation);
  }, [user, reconciliation]);

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
