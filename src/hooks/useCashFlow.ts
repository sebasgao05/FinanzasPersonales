import { useState, useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useSettings } from '@/contexts/SettingsContext';
import { monthlyFlow, cumulativeFlow } from '@/lib/calculations/cashflow';
import { totalIncome, totalExpense } from '@/lib/calculations/totals';
import { safeDiv } from '@/lib/calculations/engine';
import { BASE_MONTHS } from '@/lib/utils/constants';
import type { CalculationTransaction } from '@/lib/calculations/types';

/**
 * Monthly cash flow data for a single month.
 */
export interface MonthlyFlow {
  month: string;
  income: number;
  expense: number;
  expensePercentage: number; // (expense/income)*100, 0 if income is 0
  monthlyFlow: number;
  cumulativeFlow: number;
}

/**
 * Complete cash flow data for a selected year.
 */
export interface CashFlowData {
  year: number;
  months: MonthlyFlow[];
}

/**
 * Return type for the useCashFlow hook.
 */
export interface UseCashFlowReturn {
  data: CashFlowData;
  selectedYear: number;
  setYear: (year: number) => void;
  isLoading: boolean;
  hasData: boolean;
}

/**
 * Converts TransactionRecord[] to CalculationTransaction[] for the calculation engine.
 */
function toCalculationTransactions(
  records: { type: 'Ingreso' | 'Egreso'; amount: number; budget?: number; categoryName: string; month: string; year: number }[]
): CalculationTransaction[] {
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
 * Hook for managing cash flow data by year.
 *
 * Behavior:
 * - Initializes with the user's default year from settings
 * - Filters transactions by selected year AND default currency
 * - For each of the 12 months, calculates: income, expense, expensePercentage,
 *   monthlyFlow, cumulativeFlow
 * - hasData is false when no transactions for the year in the default currency
 *
 * Validates: Requirements 9.2, 9.3
 */
export function useCashFlow(): UseCashFlowReturn {
  const { settings, isLoading: settingsLoading } = useSettings();
  const { transactions, isLoading: transactionsLoading } = useTransactions();

  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Use settings default year when no year has been explicitly selected
  const effectiveYear = selectedYear ?? settings.defaultYear;

  // Filter transactions by year and default currency (Req 9.3)
  const yearTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.year === effectiveYear && t.currency === settings.defaultCurrency
    );
  }, [transactions, effectiveYear, settings.defaultCurrency]);

  // Convert to calculation-compatible format
  const calcTransactions = useMemo(() => {
    return toCalculationTransactions(yearTransactions);
  }, [yearTransactions]);

  // Calculate monthly flows for all 12 months
  const months: MonthlyFlow[] = useMemo(() => {
    return BASE_MONTHS.map((month) => {
      const monthTxns = calcTransactions.filter((t) => t.month === month);
      const income = totalIncome(monthTxns);
      const expense = totalExpense(monthTxns);
      // expensePercentage: expense/income*100, 0 if income is 0 (Req 9.4)
      const expensePercentage = Math.round(safeDiv(expense, income) * 100 * 10) / 10;
      const flow = monthlyFlow(calcTransactions, month);
      const cumulative = cumulativeFlow(calcTransactions, month);

      return {
        month,
        income,
        expense,
        expensePercentage,
        monthlyFlow: flow,
        cumulativeFlow: cumulative,
      };
    });
  }, [calcTransactions]);

  // hasData: false when no transactions for the year in the default currency
  const hasData = useMemo(() => {
    return yearTransactions.length > 0;
  }, [yearTransactions]);

  const data: CashFlowData = useMemo(() => ({
    year: effectiveYear,
    months,
  }), [effectiveYear, months]);

  const isLoading = settingsLoading || transactionsLoading;

  const setYear = (year: number) => {
    setSelectedYear(year);
  };

  return {
    data,
    selectedYear: effectiveYear,
    setYear,
    isLoading,
    hasData,
  };
}
