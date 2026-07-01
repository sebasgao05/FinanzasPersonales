import { useMemo } from 'react';
import type { PivotRow, PivotDimension } from '@/lib/calculations/pivot';
import { formatAmount } from '@/lib/utils/formatting';

interface PivotTableProps {
  rows: PivotRow[];
  dimensions: PivotDimension[];
}

const DIMENSION_LABELS: Record<PivotDimension, string> = {
  month: 'Mes',
  year: 'Año',
  type: 'Tipo',
  category: 'Categoría',
  concept: 'Concepto',
};

/**
 * Formats execution percentage to 2 decimal places.
 * Requirement 12.2: porcentaje de ejecución redondeado a 2 decimales.
 */
function formatExecutionPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * PivotTable - renders pivot aggregation results in tabular form.
 * Rows = unique dimension combinations, sorted by first dimension.
 * Columns: dimension values + Presupuesto, Monto real, % Ejecución.
 * Validates: Requirements 12.2, 12.5, 12.8
 */
export function PivotTable({ rows, dimensions }: PivotTableProps) {
  // Sort rows by first dimension (Req 12.5)
  const sortedRows = useMemo(() => {
    if (rows.length === 0 || dimensions.length === 0) return rows;
    const firstDim = dimensions[0];
    return [...rows].sort((a, b) => {
      const valA = a.dimensions[firstDim] || '';
      const valB = b.dimensions[firstDim] || '';
      return valA.localeCompare(valB);
    });
  }, [rows, dimensions]);

  if (sortedRows.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          No hay datos que coincidan con los criterios seleccionados.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Ajusta las dimensiones o el rango de fechas para ver resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {dimensions.map((dim) => (
              <th key={dim} className="px-4 py-3 text-left font-medium">
                {DIMENSION_LABELS[dim]}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-medium">Presupuesto</th>
            <th className="px-4 py-3 text-right font-medium">Monto real</th>
            <th className="px-4 py-3 text-right font-medium">% Ejecución</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr key={index} className="border-b last:border-b-0 hover:bg-muted/25">
              {dimensions.map((dim) => (
                <td key={dim} className="px-4 py-2">
                  {row.dimensions[dim] || '—'}
                </td>
              ))}
              <td className="px-4 py-2 text-right tabular-nums">
                {formatAmount(row.budgetTotal)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatAmount(row.amountTotal)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatExecutionPercentage(row.executionPercentage)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
