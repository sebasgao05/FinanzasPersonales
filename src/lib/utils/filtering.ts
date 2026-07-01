/**
 * Filtering and search utilities for transactions and catalogs.
 *
 * Requirements:
 * - 5.2: Text search case-insensitive partial match on detail, category, concept, notes
 * - 5.3: Filter by month, year, type, category, concept (conjunction)
 * - 5.4: Sort by any column ascending/descending
 * - 4.3: Filter categories by type (show only active ones)
 * - 4.4: Filter concepts by category (show only active ones)
 */

export interface TransactionRecord {
  id: string;
  date: string;
  month: string;
  year: number;
  type: 'Ingreso' | 'Egreso';
  categoryId: string;
  categoryName: string;
  conceptId: string;
  conceptName: string;
  detail?: string;
  budget?: number;
  amount: number;
  currency: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TableFilters {
  month?: string;
  year?: number;
  type?: 'Ingreso' | 'Egreso';
  categoryId?: string;
  conceptId?: string;
}

/**
 * Filters transactions by multiple dimensions using conjunction (AND logic).
 * All active filters must match for a transaction to be included.
 * Undefined/null filter values are ignored (treated as "no filter on this dimension").
 *
 * @param transactions - Array of transaction records to filter
 * @param filters - Active filter values
 * @returns Filtered array of transactions matching all active filters
 */
export function filterTransactions(
  transactions: TransactionRecord[],
  filters: TableFilters
): TransactionRecord[] {
  return transactions.filter((transaction) => {
    if (filters.month !== undefined && filters.month !== null && filters.month !== '') {
      if (transaction.month !== filters.month) return false;
    }

    if (filters.year !== undefined && filters.year !== null) {
      if (transaction.year !== filters.year) return false;
    }

    if (filters.type !== undefined && filters.type !== null) {
      if (transaction.type !== filters.type) return false;
    }

    if (filters.categoryId !== undefined && filters.categoryId !== null && filters.categoryId !== '') {
      if (transaction.categoryId !== filters.categoryId) return false;
    }

    if (filters.conceptId !== undefined && filters.conceptId !== null && filters.conceptId !== '') {
      if (transaction.conceptId !== filters.conceptId) return false;
    }

    return true;
  });
}

/**
 * Searches transactions by partial text match (case-insensitive) on searchable fields:
 * detail, categoryName, conceptName, notes.
 *
 * Returns all transactions if query is empty.
 *
 * @param transactions - Array of transaction records to search
 * @param query - Search text (case-insensitive partial match)
 * @returns Filtered array of transactions where at least one searchable field contains the query
 */
export function searchTransactions(
  transactions: TransactionRecord[],
  query: string
): TransactionRecord[] {
  if (!query || query.trim() === '') {
    return transactions;
  }

  const normalizedQuery = query.toLowerCase();

  return transactions.filter((transaction) => {
    const searchableFields = [
      transaction.detail ?? '',
      transaction.categoryName,
      transaction.conceptName,
      transaction.notes ?? '',
    ];

    return searchableFields.some((field) =>
      field.toLowerCase().includes(normalizedQuery)
    );
  });
}

/**
 * Sorts transactions by a specified column in ascending or descending order.
 * Returns a new sorted array (does not mutate the input).
 *
 * @param transactions - Array of transaction records to sort
 * @param column - Column key to sort by
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns New sorted array of transactions
 */
export function sortTransactions(
  transactions: TransactionRecord[],
  column: keyof TransactionRecord,
  direction: 'asc' | 'desc'
): TransactionRecord[] {
  return [...transactions].sort((a, b) => {
    const valA = a[column];
    const valB = b[column];

    // Handle undefined/null values - push them to the end
    if (valA === undefined || valA === null) {
      return direction === 'asc' ? 1 : -1;
    }
    if (valB === undefined || valB === null) {
      return direction === 'asc' ? -1 : 1;
    }

    let comparison: number;

    if (typeof valA === 'number' && typeof valB === 'number') {
      comparison = valA - valB;
    } else {
      comparison = String(valA).localeCompare(String(valB));
    }

    return direction === 'asc' ? comparison : -comparison;
  });
}

// --- Hierarchical Catalog Filtering ---

export interface CatalogItem {
  id: string;
  name: string;
  type?: 'Ingreso' | 'Egreso';
  categoryId?: string;
  isActive: boolean;
}

/**
 * Filters categories by type, returning only active categories for the given type.
 * Used for hierarchical filtering: type → category.
 *
 * @param categories - Array of category catalog items
 * @param type - Transaction type to filter by ('Ingreso' or 'Egreso')
 * @returns Active categories matching the specified type
 */
export function filterCategoriesByType(
  categories: CatalogItem[],
  type: 'Ingreso' | 'Egreso'
): CatalogItem[] {
  return categories.filter(
    (category) => category.type === type && category.isActive === true
  );
}

/**
 * Filters concepts by category, returning only active concepts for the given category.
 * Used for hierarchical filtering: category → concept.
 *
 * @param concepts - Array of concept catalog items
 * @param categoryId - Category ID to filter by
 * @returns Active concepts belonging to the specified category
 */
export function filterConceptsByCategory(
  concepts: CatalogItem[],
  categoryId: string
): CatalogItem[] {
  return concepts.filter(
    (concept) => concept.categoryId === categoryId && concept.isActive === true
  );
}
