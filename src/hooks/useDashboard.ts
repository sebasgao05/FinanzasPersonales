import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { totalIncome, totalExpense, balance } from '@/lib/calculations/totals';
import { categoryDistribution } from '@/lib/calculations/distribution';
import { safeDiv } from '@/lib/calculations/engine';
import type { CalculationTransaction, CategoryDistribution } from '@/lib/calculations/types';
import type { TransactionRecord } from '@/lib/utils/filtering';

// --- Mock data layer ---
// Simulates loading transactions from backend (same store as useTransactions).
// In production, this would query Amplify Data filtered by owner + month + year + currency.

const transactionStore: Record<string, TransactionRecord[]> = {};

function getStore(userId: string): TransactionRecord[] {
  if (!transactionStore[userId]) {
    transactionStore[userId] = [];
  }
  return transactionStore[userId];
}

async function loadTransactions(userId: string): Promise<TransactionRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return getStore(userId);
}
// --- End mock data layer ---

/**
 * Dashboard KPI metrics.
 * Validates: Requirements 8.2
 */
export interface DashboardKPIs {
  totalIncome: number;
  totalExpense: number;
  monthlyBalance: number;
  incomeBudget: number;
  expenseBudget: number;
  incomeBudgetDiff: number;
  expenseBudgetDiff: number;
  expensePercentage: number;
}

/**
 * Dashboard filter state.
 * Validates: Requirements 8.1
 */
export interface DashboardFilters {
  month: string;
  year: number;
  currency: string;
}

/**
 * Return type for the useDashboard hook.
 */
export interface UseDashboardReturn {
  kpis: DashboardKPIs;
  distribution: CategoryDistribution[];
  filters: DashboardFilters;
  isLoading: boolean;
  allTransactions: TransactionRecord[];
  hasData: boolean;
  setFilters: (filters: DashboardFilters) => void;
}

const EMPTY_KPIS: DashboardKPIs = {
  totalIncome: 0,
  totalExpense: 0,
  monthlyBalance: 0,
  incomeBudget: 0,
  expenseBudget: 0,
  incomeBudgetDiff: 0,
  expenseBudgetDiff: 0,
  expensePercentage: 0,
};

/**
 * Converts TransactionRecord[] to CalculationTransaction[] for the calculation engine.
 */
function toCalculationTransactions(records: TransactionRecord[]): CalculationTransaction[] {
  return records.map((r) => ({
    type: r.type,
    amount: r.amount,
    budget: r.budget,
    category: r.categoryName,
    month: r.month,
    year: r.year,
  }));
}

/**
 * Filters transactions by month, year, and currency.
 */
function filterByDashboard(
  transactions: TransactionRecord[],
  filters: DashboardFilters
): TransactionRecord[] {
  return transactions.filter((t) => {
    if (t.month !== filters.month) return false;
    if (t.year !== filters.year) return false;
    if (t.currency !== filters.currency) return false;
    return true;
  });
}

/**
 * Computes dashboard KPIs from filtered transactions.
 *
 * KPIs:
 * - totalIncome: sum of income amounts
 * - totalExpense: sum of expense amounts
 * - monthlyBalance: income - expense
 * - incomeBudget: sum of budget for income transactions
 * - expenseBudget: sum of budget for expense transactions
 * - incomeBudgetDiff: incomeBudget - totalIncome (budget minus real)
 * - expenseBudgetDiff: expenseBudget - totalExpense (budget minus real)
 * - expensePercentage: (expenses / income) * 100, 0 when income is 0
 *
 * Validates: Requirements 8.2, 8.7
 */
function computeKPIs(transactions: CalculationTransaction[]): DashboardKPIs {
  const income = totalIncome(transactions);
  const expense = totalExpense(transactions);
  const monthlyBalance = balance(transactions);

  // Calculate budget totals
  const incomeBudget = transactions
    .filter((t) => t.type === 'Ingreso')
    .reduce((acc, t) => acc + (t.budget ?? 0), 0);
  const roundedIncomeBudget = Math.round(incomeBudget * 100) / 100;

  const expenseBudget = transactions
    .filter((t) => t.type === 'Egreso')
    .reduce((acc, t) => acc + (t.budget ?? 0), 0);
  const roundedExpenseBudget = Math.round(expenseBudget * 100) / 100;

  // Budget differences: budget - real
  const incomeBudgetDiff = Math.round((roundedIncomeBudget - income) * 100) / 100;
  const expenseBudgetDiff = Math.round((roundedExpenseBudget - expense) * 100) / 100;

  // Expense percentage: (expense / income) * 100, returns 0 when income is 0 (Req 8.7)
  const expensePercentage = Math.round(safeDiv(expense, income) * 100 * 10) / 10;

  return {
    totalIncome: income,
    totalExpense: expense,
    monthlyBalance,
    incomeBudget: roundedIncomeBudget,
    expenseBudget: roundedExpenseBudget,
    incomeBudgetDiff,
    expenseBudgetDiff,
    expensePercentage,
  };
}

/**
 * Hook for dashboard data: loads transactions, filters by month/year/currency,
 * computes KPIs and category distribution for the donut chart.
 *
 * Behavior:
 * - Initializes filters with user's default settings (month, year, currency)
 * - Filters transactions by month, year, and currency to compute KPIs
 * - Computes category distribution on filtered expense transactions
 * - Returns 0 for expense percentage when income is 0 (safeDiv handles this)
 *
 * Validates: Requirements 8.1, 8.2, 8.3
 */
export function useDashboard(): UseDashboardReturn {
  const { user, isAuthenticated } = useAuth();
  const { settings, isLoading: settingsLoading } = useSettings();

  const [allTransactions, setAllTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFiltersState] = useState<DashboardFilters>({
    month: settings.defaultMonth,
    year: settings.defaultYear,
    currency: settings.defaultCurrency,
  });

  // Sync filters with settings when settings load (Req 8.1: precargados con valores predeterminados)
  useEffect(() => {
    if (!settingsLoading) {
      setFiltersState({
        month: settings.defaultMonth,
        year: settings.defaultYear,
        currency: settings.defaultCurrency,
      });
    }
  }, [settingsLoading, settings.defaultMonth, settings.defaultYear, settings.defaultCurrency]);

  // Load transactions when user is authenticated
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
        const records = await loadTransactions(userId);
        if (cancelled) return;
        setAllTransactions(records);
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

  // Filter transactions by dashboard filters (Req 8.3)
  const filteredTransactions = useMemo(() => {
    return filterByDashboard(allTransactions, filters);
  }, [allTransactions, filters]);

  // Compute KPIs from filtered transactions (Req 8.2)
  const kpis = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return EMPTY_KPIS;
    }
    const calcTransactions = toCalculationTransactions(filteredTransactions);
    return computeKPIs(calcTransactions);
  }, [filteredTransactions]);

  // Compute category distribution for donut chart (Req 8.4)
  const distribution = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return [];
    }
    const calcTransactions = toCalculationTransactions(filteredTransactions);
    return categoryDistribution(calcTransactions);
  }, [filteredTransactions]);

  const setFilters = useCallback((newFilters: DashboardFilters) => {
    setFiltersState(newFilters);
  }, []);

  // Whether there is data for the selected filters (Req 8.8)
  const hasData = filteredTransactions.length > 0;

  return {
    kpis,
    distribution,
    filters,
    isLoading: isLoading || settingsLoading,
    allTransactions,
    hasData,
    setFilters,
  };
}
