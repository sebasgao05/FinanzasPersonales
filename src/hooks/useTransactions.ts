import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

// --- Mock data layer ---
// Simulates Amplify Data client for Transaction entities.
// Stores data per user in memory (resets on page reload).

const transactionStore: Record<string, TransactionRecord[]> = {};

function getStore(userId: string): TransactionRecord[] {
  if (!transactionStore[userId]) {
    transactionStore[userId] = [];
  }
  return transactionStore[userId];
}

async function loadTransactions(userId: string): Promise<TransactionRecord[]> {
  // Simulate async API call
  await new Promise((resolve) => setTimeout(resolve, 50));
  return getStore(userId);
}

async function persistStore(userId: string, records: TransactionRecord[]): Promise<void> {
  // Simulate async API call
  await new Promise((resolve) => setTimeout(resolve, 50));
  transactionStore[userId] = [...records];
}

// --- End mock data layer ---

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `txn-${Date.now()}-${idCounter}`;
}

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
 * Hook for managing transaction data with CRUD, filtering, search, sort, and pagination.
 *
 * Behavior:
 * - Loads transactions for authenticated user (owner-based filtering)
 * - Applies filters, search, and sort to produce `filteredTransactions`
 * - Calculates totals on filtered transactions
 * - Paginates at 50 per page
 * - CRUD operations update local state immediately
 * - Default sort: date descending
 *
 * Requirements: 1.4, 5.11, 15.2
 */
export function useTransactions(): UseTransactionsReturn {
  const { user, isAuthenticated } = useAuth();

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<TableFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof TransactionRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Load transactions when user is authenticated (Req 1.4, 15.2)
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
        setTransactions(records);
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

  // Compute filtered, searched, and sorted transactions
  const processedTransactions = useMemo(() => {
    let result = filterTransactions(transactions, filters);
    result = searchTransactions(result, searchQuery);
    result = sortTransactions(result, sortColumn, sortDirection);
    return result;
  }, [transactions, filters, searchQuery, sortColumn, sortDirection]);

  // Calculate totals on filtered transactions
  const totals = useMemo(() => {
    const calcTransactions = toCalculationTransactions(processedTransactions);
    return {
      totalIncome: totalIncome(calcTransactions),
      totalExpense: totalExpense(calcTransactions),
      balance: balance(calcTransactions),
    };
  }, [processedTransactions]);

  // Pagination (Req 5.11: 50 records per page)
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(processedTransactions.length / PAGE_SIZE));
  }, [processedTransactions.length]);

  // Paginated slice
  const filteredTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return processedTransactions.slice(startIndex, endIndex);
  }, [processedTransactions, currentPage]);

  // Reset to page 1 when filters, search, or sort change
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

  /**
   * Creates a new transaction and updates local state immediately.
   * Automatically computes month and year from the date.
   * Requirement: 1.3 (owner association)
   */
  const createTransaction = useCallback(
    async (data: TransactionFormData) => {
      if (!user) return;

      const now = new Date().toISOString();
      const newRecord: TransactionRecord = {
        id: generateId(),
        date: data.date,
        month: extractMonth(data.date),
        year: extractYear(data.date),
        type: data.type,
        categoryId: data.categoryId,
        categoryName: data.categoryId, // In real app, resolve name from catalog
        conceptId: data.conceptId,
        conceptName: data.conceptId, // In real app, resolve name from catalog
        detail: data.detail,
        budget: data.budget,
        amount: data.amount,
        currency: data.currency,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...transactions, newRecord];
      setTransactions(updated);

      // Persist
      await persistStore(user.userId, updated);
    },
    [user, transactions]
  );

  /**
   * Updates an existing transaction by ID with partial data.
   * Recomputes month/year if date changes.
   */
  const updateTransaction = useCallback(
    async (id: string, data: Partial<TransactionFormData>) => {
      if (!user) return;

      const updated = transactions.map((txn) => {
        if (txn.id !== id) return txn;

        const updatedRecord: TransactionRecord = {
          ...txn,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        // Recompute month and year if date changed
        if (data.date) {
          updatedRecord.month = extractMonth(data.date);
          updatedRecord.year = extractYear(data.date);
        }

        return updatedRecord;
      });

      setTransactions(updated);
      await persistStore(user.userId, updated);
    },
    [user, transactions]
  );

  /**
   * Deletes a transaction by ID permanently.
   */
  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) return;

      const updated = transactions.filter((txn) => txn.id !== id);
      setTransactions(updated);
      await persistStore(user.userId, updated);
    },
    [user, transactions]
  );

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
    updateTransaction,
    deleteTransaction,
  };
}
