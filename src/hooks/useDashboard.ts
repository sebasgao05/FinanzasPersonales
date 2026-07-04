import { useMemo, useState, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTransactions } from './useTransactions';
import { useCatalogs } from './useCatalogs';
import { totalIncome, totalExpense, balance } from '@/lib/calculations/totals';
import { categoryDistribution } from '@/lib/calculations/distribution';
import { safeDiv } from '@/lib/calculations/engine';
import type { CalculationTransaction, CategoryDistribution } from '@/lib/calculations/types';
import type { TransactionRecord } from '@/lib/utils/filtering';

/**
 * Dashboard KPI metrics.
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

export interface DashboardFilters {
  month: string;
  year: number;
  currency: string;
  categoryId: string;
}

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

function filterByDashboard(
  transactions: TransactionRecord[],
  filters: DashboardFilters
): TransactionRecord[] {
  return transactions.filter((t) => {
    if (t.month !== filters.month) return false;
    if (t.year !== filters.year) return false;
    if (t.currency !== filters.currency) return false;
    if (filters.categoryId && t.categoryId !== filters.categoryId && t.categoryName !== filters.categoryId) return false;
    return true;
  });
}

function computeKPIs(transactions: CalculationTransaction[]): DashboardKPIs {
  const income = totalIncome(transactions);
  const expense = totalExpense(transactions);
  const monthlyBalance = balance(transactions);

  const incomeBudget = transactions
    .filter((t) => t.type === 'Ingreso')
    .reduce((acc, t) => acc + (t.budget ?? 0), 0);
  const roundedIncomeBudget = Math.round(incomeBudget * 100) / 100;

  const expenseBudget = transactions
    .filter((t) => t.type === 'Egreso')
    .reduce((acc, t) => acc + (t.budget ?? 0), 0);
  const roundedExpenseBudget = Math.round(expenseBudget * 100) / 100;

  const incomeBudgetDiff = Math.round((roundedIncomeBudget - income) * 100) / 100;
  const expenseBudgetDiff = Math.round((roundedExpenseBudget - expense) * 100) / 100;
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
 * Hook for dashboard data — connected to real Amplify Data via useTransactions.
 * Filters by month/year/currency, computes KPIs and category distribution.
 */
export function useDashboard(): UseDashboardReturn {
  const { settings, isLoading: settingsLoading } = useSettings();
  const { transactions: allTransactions, isLoading: transactionsLoading } = useTransactions();
  const { categories, concepts } = useCatalogs();

  const [filters, setFiltersState] = useState<DashboardFilters>({
    month: settings.defaultMonth,
    year: settings.defaultYear,
    currency: settings.defaultCurrency,
    categoryId: '',
  });

  // Sync filters when settings load
  const effectiveFilters = useMemo(() => {
    if (settingsLoading) return filters;
    return {
      month: filters.month || settings.defaultMonth,
      year: filters.year || settings.defaultYear,
      currency: filters.currency || settings.defaultCurrency,
      categoryId: filters.categoryId || '',
    };
  }, [filters, settings, settingsLoading]);

  const setFilters = useCallback((newFilters: DashboardFilters) => {
    setFiltersState(newFilters);
  }, []);

  const filtered = useMemo(
    () => filterByDashboard(allTransactions, effectiveFilters),
    [allTransactions, effectiveFilters]
  );

  const calcTransactions = useMemo(() => {
    // Resolve category names from catalog (fixes ID-as-name issue)
    return filtered.map((r) => {
      const cat = categories.find((c) => c.id === r.categoryName || c.id === r.categoryId);
      return {
        type: r.type,
        amount: r.amount,
        budget: r.budget,
        category: cat?.name ?? r.categoryName,
        month: r.month,
        year: r.year,
      };
    });
  }, [filtered, categories]);

  const kpis = useMemo(() => {
    if (filtered.length === 0) return EMPTY_KPIS;
    return computeKPIs(calcTransactions);
  }, [filtered, calcTransactions]);

  const distribution = useMemo(() => {
    const expenseTransactions = calcTransactions.filter((t) => t.type === 'Egreso');
    if (expenseTransactions.length === 0) return [];
    return categoryDistribution(expenseTransactions);
  }, [calcTransactions]);

  const hasData = filtered.length > 0;
  const isLoading = settingsLoading || transactionsLoading;

  return {
    kpis,
    distribution,
    filters: effectiveFilters,
    isLoading,
    allTransactions,
    hasData,
    setFilters,
  };
}
