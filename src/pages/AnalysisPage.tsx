import { useState, useMemo, useCallback } from 'react';
import { Download } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/contexts/SettingsContext';
import { pivotAggregate } from '@/lib/calculations/pivot';
import type { PivotDimension } from '@/lib/calculations/pivot';
import type { CalculationTransaction } from '@/lib/calculations/types';
import { AnalysisFilters, type AnalysisFiltersState } from '@/components/analysis/AnalysisFilters';
import { PivotTable } from '@/components/analysis/PivotTable';
import { AnalysisCharts } from '@/components/analysis/AnalysisCharts';
import { downloadCSV } from '@/lib/export/csv';
import { Button } from '@/components/ui/button';

/**
 * AnalysisPage - Análisis y Agrupación de datos financieros.
 * Allows multi-dimensional grouping with date range filtering.
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.8
 */
export default function AnalysisPage() {
  const { transactions, isLoading } = useTransactions();
  const { settings } = useSettings();

  // Default date range: all transactions from the default year
  const defaultYear = settings.defaultYear;
  const [filters, setFilters] = useState<AnalysisFiltersState>({
    dimensions: ['category'] as PivotDimension[],
    startDate: `${defaultYear}-01-01`,
    endDate: `${defaultYear}-12-31`,
  });

  // Filter transactions by date range (Req 12.4)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filters.startDate && tx.date < filters.startDate) return false;
      if (filters.endDate && tx.date > filters.endDate) return false;
      return true;
    });
  }, [transactions, filters.startDate, filters.endDate]);

  // Convert to CalculationTransaction for pivot engine
  const calcTransactions: CalculationTransaction[] = useMemo(() => {
    return filteredTransactions.map((tx) => ({
      type: tx.type,
      amount: tx.amount,
      budget: tx.budget,
      category: tx.categoryName,
      concept: tx.conceptName,
      month: tx.month,
      year: tx.year,
    }));
  }, [filteredTransactions]);

  // Run pivot aggregation (Req 12.2, 12.3, 12.5)
  const pivotRows = useMemo(() => {
    if (filters.dimensions.length === 0) return [];
    return pivotAggregate(calcTransactions, filters.dimensions);
  }, [calcTransactions, filters.dimensions]);

  // Dimension labels for CSV export
  const DIMENSION_LABELS: Record<PivotDimension, string> = {
    month: 'Mes',
    year: 'Año',
    type: 'Tipo',
    category: 'Categoría',
    concept: 'Concepto',
  };

  // Export pivot data as CSV (Req 12.6)
  const handleExportCSV = useCallback(() => {
    if (pivotRows.length === 0) return;

    const dimensionHeaders = filters.dimensions.map((d) => DIMENSION_LABELS[d]);
    const headers = [...dimensionHeaders, 'Presupuesto', 'Monto real', '% Ejecución'];
    const headerRow = headers.join(',');

    const dataRows = pivotRows.map((row) => {
      const dimValues = filters.dimensions.map((d) => {
        const val = row.dimensions[d] || '';
        // Escape CSV fields
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      return [
        ...dimValues,
        String(row.budgetTotal),
        String(row.amountTotal),
        row.executionPercentage.toFixed(2),
      ].join(',');
    });

    const csvContent = [headerRow, ...dataRows].join('\n');
    downloadCSV(csvContent, `analisis_${filters.startDate}_${filters.endDate}.csv`);
  }, [pivotRows, filters.dimensions, filters.startDate, filters.endDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  const hasTransactions = transactions.length > 0;
  const hasDimensions = filters.dimensions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Análisis y Agrupación</h1>
        {hasTransactions && hasDimensions && pivotRows.length > 0 && (
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="size-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      {!hasTransactions ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No hay transacciones registradas para analizar.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Registra transacciones desde la página de Ingreso de Datos para ver análisis aquí.
          </p>
        </div>
      ) : (
        <>
          <AnalysisFilters filters={filters} onFiltersChange={setFilters} />

          {!hasDimensions ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                Selecciona al menos una dimensión de agrupación para ver resultados.
              </p>
            </div>
          ) : (
            <>
              <PivotTable rows={pivotRows} dimensions={filters.dimensions} />
              <AnalysisCharts rows={pivotRows} dimensions={filters.dimensions} />
            </>
          )}
        </>
      )}
    </div>
  );
}
