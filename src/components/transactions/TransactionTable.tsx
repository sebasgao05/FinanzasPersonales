import { useCallback } from 'react';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Inbox, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/lib/utils/formatting';
import type { TransactionRecord } from '@/lib/utils/filtering';

export interface TransactionTableProps {
  transactions: TransactionRecord[];
  totals: { totalIncome: number; totalExpense: number; balance: number };
  sortColumn: keyof TransactionRecord;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onSort: (column: keyof TransactionRecord, direction: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onEdit?: (transaction: TransactionRecord) => void;
  onDelete?: (transaction: TransactionRecord) => void;
}

interface ColumnDef {
  key: keyof TransactionRecord;
  label: string;
  className?: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'Fecha', className: 'min-w-[100px]' },
  { key: 'month', label: 'Mes', className: 'min-w-[90px]' },
  { key: 'year', label: 'Año', className: 'min-w-[60px]' },
  { key: 'type', label: 'Tipo', className: 'min-w-[80px]' },
  { key: 'categoryName', label: 'Categoría', className: 'min-w-[120px]' },
  { key: 'conceptName', label: 'Concepto', className: 'min-w-[120px]' },
  { key: 'detail', label: 'Detalle', className: 'min-w-[150px]' },
  { key: 'budget', label: 'Presupuesto', className: 'min-w-[120px] text-right' },
  { key: 'amount', label: 'Monto', className: 'min-w-[120px] text-right' },
  { key: 'currency', label: 'Moneda', className: 'min-w-[70px]' },
  { key: 'notes', label: 'Notas', className: 'min-w-[150px]' },
  { key: 'createdAt', label: 'Fecha creación', className: 'min-w-[140px]' },
  { key: 'updatedAt', label: 'Fecha actualización', className: 'min-w-[140px]' },
];

/**
 * TransactionTable renders the transaction data in a responsive table with:
 * - Clickable column headers for sorting (arrow indicator for active sort)
 * - Footer row with totals (income, expenses, balance)
 * - Pagination controls
 * - Empty state when no results match filters/search
 *
 * Requirements: 5.1, 5.4, 5.9, 5.11, 5.12
 */
export function TransactionTable({
  transactions,
  totals,
  sortColumn,
  sortDirection,
  currentPage,
  totalPages,
  isLoading,
  onSort,
  onPageChange,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const handleHeaderClick = useCallback(
    (column: keyof TransactionRecord) => {
      if (column === sortColumn) {
        // Toggle direction
        onSort(column, sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        // Default to ascending for new column, except date which defaults to desc
        onSort(column, column === 'date' ? 'desc' : 'asc');
      }
    },
    [sortColumn, sortDirection, onSort]
  );

  const renderSortIndicator = (column: keyof TransactionRecord) => {
    if (column !== sortColumn) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="inline h-3 w-3 ml-1" />
    );
  };

  const formatCellValue = (record: TransactionRecord, column: keyof TransactionRecord): string => {
    const value = record[column];

    if (value === undefined || value === null) return '—';

    if (column === 'amount' || column === 'budget') {
      return formatAmount(value as number);
    }

    if (column === 'createdAt' || column === 'updatedAt') {
      try {
        const d = new Date(value as string);
        return d.toLocaleString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Cargando transacciones...</p>
      </div>
    );
  }

  // Empty state (Req 5.12)
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">No hay transacciones</h3>
        <p className="text-sm text-muted-foreground mt-1">
          No se encontraron registros que coincidan con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Responsive table container with horizontal scroll on mobile */}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors ${col.className ?? ''}`}
                  onClick={() => handleHeaderClick(col.key)}
                  aria-sort={
                    col.key === sortColumn
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {col.label}
                  {renderSortIndicator(col.key)}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-3 py-2 text-left font-medium text-muted-foreground min-w-[100px]">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((record) => (
              <tr
                key={record.id}
                className="hover:bg-muted/30 transition-colors"
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 ${col.className ?? ''}`}
                  >
                    {col.key === 'type' ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          record.type === 'Ingreso'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {record.type}
                      </span>
                    ) : (
                      formatCellValue(record, col.key)
                    )}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(record)}
                          aria-label={`Editar transacción ${record.date}`}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(record)}
                          aria-label={`Eliminar transacción ${record.date}`}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {/* Totals footer (Req 5.9) */}
          <tfoot className="bg-muted/50 border-t border-border font-medium">
            <tr>
              <td colSpan={7} className="px-3 py-2 text-right">
                Totales:
              </td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2 text-right space-y-1">
                <div className="text-green-700 dark:text-green-400">
                  +{formatAmount(totals.totalIncome)}
                </div>
                <div className="text-red-700 dark:text-red-400">
                  −{formatAmount(totals.totalExpense)}
                </div>
                <div className={`font-bold ${totals.balance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  ={formatAmount(totals.balance)}
                </div>
              </td>
              <td colSpan={(onEdit || onDelete) ? 5 : 4} className="px-3 py-2" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination controls (Req 5.11) */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
