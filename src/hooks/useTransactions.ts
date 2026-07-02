import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TransactionFormData } from '@/lib/validators/transaction';
import {
  type TransactionRecord,
  type TableFilters,
  filterTransactions,
  searchTransactions,
  sortTransactions,
} from '@/lib/utils/filtering';
import { totalIncome, totalExpense, balance } from '@/lib/calculations/totals';
import type { CalculationTransaction } from '@/lib/calculations/types';
import { extractMonth, extractYear } from '@/lib/utils/dates';
import { client } from '@/lib/amplify-client';

const PAGE_SIZE = 50;

export interface UseTransactionsReturn {
  transactions: TransactionRecord[];
  filteredTransactions: TransactionRecord[];
  allFilteredTransactions: TransactionRecord[];
  totals: { totalIncome: number; totalExpense: number; balance: number };
  isLoading: boolean;
  filters: TableFilters;
  searchQuery: string;
  sortColumn: keyof TransactionRecord;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  totalPages: number;
  setFilters: (filters: TableFilters) => void;
  setSearchQuery: (query: string) => void;
  setSort: (column: keyof TransactionRecord, direction: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  createTransaction: (data: TransactionFormData) => Promise<void>;
  updateTransaction: (id: string, data: Partial<TransactionFormData>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

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
 * Hook for managing transaction data with CRUD, filtering, search, sort, and pagination.
 * Connected to Amplify Data (AppSync + DynamoDB).
 */
export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<TableFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof TransactionRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Load transactions from Amplify
  useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      setIsLoading(true);
      try {
        const { data: items } = await client.models.Transaction.list({
          limit: 5000,
        });
        if (cancelled) return;

        const records: TransactionRecord[] = (items ?? []).map((item) => ({
          id: item.id,
          date: item.date,
          month: item.month,
          year: item.year,
          type: item.type as 'Ingreso' | 'Egreso',
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          conceptId: item.conceptId,
          conceptName: item.conceptName,
          detail: item.detail ?? undefined,
          budget: item.budget ?? undefined,
          amount: item.amount,
          currency: item.currency,
          notes: item.notes ?? undefined,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));

        setTransactions(records);
      } catch (err) {
        console.error('Error loading transactions:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadTransactions();

    // Subscribe to real-time changes
    const sub = client.models.Transaction.observeQuery().subscribe({
      next: ({ items }) => {
        if (cancelled) return;
        const records: TransactionRecord[] = items.map((item) => ({
          id: item.id,
          date: item.date,
          month: item.month,
          year: item.year,
          type: item.type as 'Ingreso' | 'Egreso',
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          conceptId: item.conceptId,
          conceptName: item.conceptName,
          detail: item.detail ?? undefined,
          budget: item.budget ?? undefined,
          amount: item.amount,
          currency: item.currency,
          notes: item.notes ?? undefined,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
        setTransactions(records);
        setIsLoading(false);
      },
      error: (err) => console.error('Transaction subscription error:', err),
    });

    return () => {
      cancelled = true;
      sub.unsubscribe();
    };
  }, []);

  // Compute filtered, searched, and sorted transactions
  const processedTransactions = useMemo(() => {
    let result = filterTransactions(transactions, filters);
    result = searchTransactions(result, searchQuery);
    result = sortTransactions(result, sortColumn, sortDirection);
    return result;
  }, [transactions, filters, searchQuery, sortColumn, sortDirection]);

  const totals = useMemo(() => {
    const calcTransactions = toCalculationTransactions(processedTransactions);
    return {
      totalIncome: totalIncome(calcTransactions),
      totalExpense: totalExpense(calcTransactions),
      balance: balance(calcTransactions),
    };
  }, [processedTransactions]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(processedTransactions.length / PAGE_SIZE));
  }, [processedTransactions.length]);

  const filteredTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return processedTransactions.slice(startIndex, endIndex);
  }, [processedTransactions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, sortColumn, sortDirection]);

  const setSort = useCallback(
    (column: keyof TransactionRecord, direction: 'asc' | 'desc') => {
      setSortColumn(column);
      setSortDirection(direction);
    },
    []
  );

  const setPage = useCallback(
    (page: number) => {
      const safePage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(safePage);
    },
    [totalPages]
  );

  const createTransaction = useCallback(
    async (data: TransactionFormData) => {
      const month = extractMonth(data.date);
      const year = extractYear(data.date);

      await client.models.Transaction.create({
        date: data.date,
        month,
        year,
        type: data.type,
        categoryId: data.categoryId,
        categoryName: data.categoryName ?? data.categoryId,
        conceptId: data.conceptId,
        conceptName: data.conceptName ?? data.conceptId,
        detail: data.detail || undefined,
        budget: data.budget || undefined,
        amount: data.amount,
        currency: data.currency,
        notes: data.notes || undefined,
      } as any);
    },
    []
  );

  const updateTransactionFn = useCallback(
    async (id: string, data: Partial<TransactionFormData>) => {
      const updateData: Record<string, unknown> = { id };

      if (data.date) {
        updateData.date = data.date;
        updateData.month = extractMonth(data.date);
        updateData.year = extractYear(data.date);
      }
      if (data.type) updateData.type = data.type;
      if (data.categoryId) updateData.categoryId = data.categoryId;
      if (data.categoryName) updateData.categoryName = data.categoryName;
      if (data.conceptId) updateData.conceptId = data.conceptId;
      if (data.conceptName) updateData.conceptName = data.conceptName;
      if (data.detail !== undefined) updateData.detail = data.detail || undefined;
      if (data.budget !== undefined) updateData.budget = data.budget || undefined;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.currency) updateData.currency = data.currency;
      if (data.notes !== undefined) updateData.notes = data.notes || undefined;

      await client.models.Transaction.update(updateData as any);
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    await client.models.Transaction.delete({ id });
  }, []);

  return {
    transactions,
    filteredTransactions,
    allFilteredTransactions: processedTransactions,
    totals,
    isLoading,
    filters,
    searchQuery,
    sortColumn,
    sortDirection,
    currentPage,
    totalPages,
    setFilters,
    setSearchQuery,
    setSort,
    setPage,
    createTransaction,
    updateTransaction: updateTransactionFn,
    deleteTransaction,
  };
}
