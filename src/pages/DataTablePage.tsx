import { useState, useCallback, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCatalogs } from '@/hooks/useCatalogs';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { EditTransactionDialog, DeleteConfirmDialog } from '@/components/transactions/EditTransactionDialog';
import { CSVExporter } from '@/components/import-export/CSVExporter';
import { FileImporter, type ImportedTransaction, type ImportBatchData } from '@/components/import-export/FileImporter';
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
    createTransaction,
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

  // Import state
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleImportComplete = useCallback(
    async (transactions: ImportedTransaction[], batch: ImportBatchData) => {
      // Create each imported transaction in DynamoDB
      let created = 0;
      for (const tx of transactions) {
        try {
          await createTransaction({
            date: tx.date,
            type: tx.type,
            categoryId: tx.categoryName, // Use name as ID fallback
            conceptId: tx.conceptName,   // Use name as ID fallback
            categoryName: tx.categoryName,
            conceptName: tx.conceptName,
            detail: tx.detail,
            budget: tx.budget,
            amount: tx.amount,
            currency: tx.currency,
            notes: tx.notes,
          });
          created++;
        } catch (err) {
          console.error('Error importing transaction:', err);
        }
      }

      setImportMessage(
        `Importación completada: ${created} de ${batch.totalRows} transacciones creadas exitosamente.`
      );
      setTimeout(() => setImportMessage(null), 5000);
    },
    [createTransaction]
  );

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

      {/* Import message */}
      {importMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          {importMessage}
        </div>
      )}

      {/* CSV Import */}
      <FileImporter onImportComplete={handleImportComplete} />
    </div>
  );
}
