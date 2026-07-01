import { useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCatalogs } from '@/hooks/useCatalogs';
import { filterCategoriesByType, filterConceptsByCategory, type TableFilters } from '@/lib/utils/filtering';
import { BASE_TYPES, BASE_MONTHS } from '@/lib/utils/constants';

export interface TransactionFiltersProps {
  filters: TableFilters;
  searchQuery: string;
  onFiltersChange: (filters: TableFilters) => void;
  onSearchChange: (query: string) => void;
}

/**
 * TransactionFilters provides search and dropdown filters for the transaction table.
 *
 * - Search: partial text match (case-insensitive) on Detalle, Categoría, Concepto, Notas
 * - Filters: Mes, Año, Tipo, Categoría, Concepto (conjunction/AND logic)
 * - Categoría is dependent on Tipo; Concepto is dependent on Categoría
 * - "Limpiar filtros" resets all filters and search to default
 *
 * Requirements: 5.2, 5.3
 */
export function TransactionFilters({
  filters,
  searchQuery,
  onFiltersChange,
  onSearchChange,
}: TransactionFiltersProps) {
  const { categories, concepts, years } = useCatalogs();

  // Filter categories based on selected type
  const filteredCategories = useMemo(() => {
    if (!filters.type) return categories.filter((c) => c.isActive);
    return filterCategoriesByType(categories, filters.type);
  }, [categories, filters.type]);

  // Filter concepts based on selected category
  const filteredConcepts = useMemo(() => {
    if (!filters.categoryId) return concepts.filter((c) => c.isActive);
    return filterConceptsByCategory(concepts, filters.categoryId);
  }, [concepts, filters.categoryId]);

  // Available years for the dropdown
  const availableYears = useMemo(() => {
    return years.filter((y) => y.isActive).sort((a, b) => Number(b.name) - Number(a.name));
  }, [years]);

  const handleFilterChange = useCallback(
    (key: keyof TableFilters, value: string) => {
      const newFilters = { ...filters };

      if (key === 'year') {
        newFilters.year = value ? Number(value) : undefined;
      } else if (key === 'type') {
        newFilters.type = value as TableFilters['type'];
        // Reset dependent filters when type changes
        newFilters.categoryId = undefined;
        newFilters.conceptId = undefined;
      } else if (key === 'categoryId') {
        newFilters.categoryId = value || undefined;
        // Reset concept when category changes
        newFilters.conceptId = undefined;
      } else {
        (newFilters as Record<string, unknown>)[key] = value || undefined;
      }

      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  const handleClearAll = useCallback(() => {
    onFiltersChange({});
    onSearchChange('');
  }, [onFiltersChange, onSearchChange]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filters.month !== undefined ||
    filters.year !== undefined ||
    filters.type !== undefined ||
    filters.categoryId !== undefined ||
    filters.conceptId !== undefined;

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar en detalle, categoría, concepto, notas..."
          className="w-full rounded-md border border-border bg-background pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Buscar transacciones"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Mes */}
        <div className="space-y-1">
          <label htmlFor="filter-month" className="text-xs font-medium text-muted-foreground">
            Mes
          </label>
          <select
            id="filter-month"
            value={filters.month ?? ''}
            onChange={(e) => handleFilterChange('month', e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            {BASE_MONTHS.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {/* Año */}
        <div className="space-y-1">
          <label htmlFor="filter-year" className="text-xs font-medium text-muted-foreground">
            Año
          </label>
          <select
            id="filter-year"
            value={filters.year ?? ''}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            {availableYears.map((y) => (
              <option key={y.id} value={y.name}>
                {y.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div className="space-y-1">
          <label htmlFor="filter-type" className="text-xs font-medium text-muted-foreground">
            Tipo
          </label>
          <select
            id="filter-type"
            value={filters.type ?? ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            {BASE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Categoría */}
        <div className="space-y-1">
          <label htmlFor="filter-category" className="text-xs font-medium text-muted-foreground">
            Categoría
          </label>
          <select
            id="filter-category"
            value={filters.categoryId ?? ''}
            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas</option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Concepto */}
        <div className="space-y-1">
          <label htmlFor="filter-concept" className="text-xs font-medium text-muted-foreground">
            Concepto
          </label>
          <select
            id="filter-concept"
            value={filters.conceptId ?? ''}
            onChange={(e) => handleFilterChange('conceptId', e.target.value)}
            disabled={!filters.categoryId}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            {filteredConcepts.map((con) => (
              <option key={con.id} value={con.id}>
                {con.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
