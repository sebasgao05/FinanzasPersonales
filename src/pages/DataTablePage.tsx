import { useState, useCallback, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCatalogs } from '@/hooks/useCatalogs';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { EditTransactionDialog, DeleteConfirmDialog } from '@/components/transactions/EditTransactionDialog';
import { CSVExporter } from '@/components/import-export/CSVExporter';
import type { TransactionRecord } from '@/lib/utils/filtering';
import type { TransactionFormData } from '@/lib/validators/transaction';

/**
 * DataTablePage integrates the transaction table, filters, edit/delete dialogs,
 * and CSV export/import template actions.
 *
 * Layout:
 * 1. Page title and description
 * 2. Action buttons: Exportar CSV + Descargar plantilla
 * 3. TransactionFilters (search + dropdowns)
 * 4. TransactionTable (with edit/delete actions per row)
 * 5. EditTransactionDialog (shown when editing)
 * 6. DeleteConfirmDialog (shown when deleting)
 *
 * Requirements: 5.1-5.12, 6.1-6.4
 */
export default function DataTablePage() {
  const {
    filteredTransactions,
    allFilteredTransactions,
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
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  const { categories, concepts } = useCatalogs();

  // Resolve category/concept names for transactions that have IDs stored as names
  const resolveNames = useCallback(
    (transactions: TransactionRecord[]): TransactionRecord[] => {
      return transactions.map((t) => {
        const cat = categories.find((c) => c.id === t.categoryName || c.id === t.categoryId);
        const con = concepts.find((c) => c.id === t.conceptName || c.id === t.conceptId);
        return {
          ...t,
          categoryName: cat?.name ?? t.categoryName,
          conceptName: con?.name ?? t.conceptName,
        };
      });
    },
    [categories, concepts]
  );

  const resolvedFiltered = useMemo(
    () => resolveNames(filteredTransactions),
    [filteredTransactions, resolveNames]
  );

  const resolvedAllFiltered = useMemo(
    () => resolveNames(allFilteredTransactions),
    [allFilteredTransactions, resolveNames]
  );

  // Edit dialog state
  const [editingTransaction, setEditingTransaction] = useState<TransactionRecord | null>(null);

  // Delete dialog state
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionRecord | null>(null);

  const handleEdit = useCallback((transaction: TransactionRecord) => {
    setEditingTransaction(transaction);
  }, []);

  const handleDelete = useCallback((transaction: TransactionRecord) => {
    setDeletingTransaction(transaction);
  }, []);

  const handleEditSave = useCallback(
    async (id: string, data: Partial<TransactionFormData>) => {
      await updateTransaction(id, data);
    },
    [updateTransaction]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingTransaction) return;
    await deleteTransaction(deletingTransaction.id);
  }, [deletingTransaction, deleteTransaction]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Datos</h1>
        <p className="text-muted-foreground mt-1">
          Visualiza, filtra y gestiona todos tus registros financieros. Exporta a CSV o descarga la plantilla de importación.
        </p>
      </div>

      {/* Action buttons: Export CSV + Download template */}
      <CSVExporter filteredTransactions={resolvedAllFiltered} />

      {/* Filters and search */}
      <TransactionFilters
        filters={filters}
        searchQuery={searchQuery}
        onFiltersChange={setFilters}
        onSearchChange={setSearchQuery}
      />

      {/* Transaction table with edit/delete actions */}
      <TransactionTable
        transactions={resolvedFiltered}
        totals={totals}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        onSort={setSort}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit dialog */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Delete confirmation dialog */}
      {deletingTransaction && (
        <DeleteConfirmDialog
          transaction={deletingTransaction}
          isOpen={true}
          onClose={() => setDeletingTransaction(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
