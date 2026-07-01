import type { PivotDimension } from '@/lib/calculations/pivot';

export interface AnalysisFiltersState {
  dimensions: PivotDimension[];
  startDate: string;
  endDate: string;
}

interface AnalysisFiltersProps {
  filters: AnalysisFiltersState;
  onFiltersChange: (filters: AnalysisFiltersState) => void;
}

const DIMENSION_OPTIONS: { value: PivotDimension; label: string }[] = [
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
  { value: 'type', label: 'Tipo' },
  { value: 'category', label: 'Categoría' },
  { value: 'concept', label: 'Concepto' },
];

/**
 * AnalysisFilters - dimension selection checkboxes and date range inputs.
 * Validates: Requirements 12.1, 12.4
 */
export function AnalysisFilters({ filters, onFiltersChange }: AnalysisFiltersProps) {
  function handleDimensionToggle(dimension: PivotDimension) {
    const current = filters.dimensions;
    const updated = current.includes(dimension)
      ? current.filter((d) => d !== dimension)
      : [...current, dimension];
    onFiltersChange({ ...filters, dimensions: updated });
  }

  function handleStartDateChange(value: string) {
    onFiltersChange({ ...filters, startDate: value });
  }

  function handleEndDateChange(value: string) {
    onFiltersChange({ ...filters, endDate: value });
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Dimensiones de agrupación</h3>
        <div className="flex flex-wrap gap-4">
          {DIMENSION_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.dimensions.includes(option.value)}
                onChange={() => handleDimensionToggle(option.value)}
                className="h-4 w-4 rounded border-gray-300"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Rango de fechas</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="analysis-start-date" className="text-xs text-muted-foreground">
              Fecha inicio
            </label>
            <input
              id="analysis-start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="rounded border border-input bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="analysis-end-date" className="text-xs text-muted-foreground">
              Fecha fin
            </label>
            <input
              id="analysis-end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="rounded border border-input bg-background px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
