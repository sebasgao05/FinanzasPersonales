import { useDashboard } from '@/hooks/useDashboard';
import { useCatalogs } from '@/hooks/useCatalogs';
import { KPICards } from '@/components/dashboard/KPICards';
import { DonutChart } from '@/components/dashboard/DonutChart';
import { IncomeExpenseBarChart } from '@/components/dashboard/BarChart';
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart';
import { BASE_MONTHS } from '@/lib/utils/constants';

/**
 * Dashboard page with KPIs, charts, and filters.
 * Shows financial summary with filterable metrics and visualizations.
 *
 * - Filters: Mes, Año, Moneda, Categoría precargados con valores predeterminados del usuario
 * - KPIs: 8 tarjetas de métricas financieras
 * - Gráficas: Dona (distribución egresos), Barras (ingresos vs egresos), Tendencia mensual
 * - Estado vacío cuando no hay transacciones para los filtros seleccionados
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */
export default function DashboardPage() {
  const { kpis, distribution, filters, isLoading, allTransactions, hasData, setFilters } =
    useDashboard();
  const { years: catalogYears, currencies: catalogCurrencies, categories: catalogCategories, isLoading: catalogsLoading } =
    useCatalogs();

  // Build year options: use catalog years if available, otherwise generate current year ± 5
  const currentYear = new Date().getFullYear();
  const fallbackYears = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const yearOptions =
    catalogYears.length > 0
      ? catalogYears.filter((y) => y.isActive).map((y) => Number(y.name)).sort((a, b) => a - b)
      : fallbackYears;

  // Build currency options: use catalog currencies (active only)
  const currencyOptions =
    catalogCurrencies.length > 0
      ? catalogCurrencies.filter((c) => c.isActive).map((c) => c.name)
      : ['COP', 'USD', 'EUR'];

  if (isLoading || catalogsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen visual de tus finanzas personales.
        </p>
      </div>

      {/* Filters: Mes, Año, Moneda, Categoría (Req 8.1) */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col">
          <label htmlFor="filter-month" className="mb-1 text-xs font-medium text-gray-600">
            Mes
          </label>
          <select
            id="filter-month"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {BASE_MONTHS.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="filter-year" className="mb-1 text-xs font-medium text-gray-600">
            Año
          </label>
          <select
            id="filter-year"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="filter-currency" className="mb-1 text-xs font-medium text-gray-600">
            Moneda
          </label>
          <select
            id="filter-currency"
            value={filters.currency}
            onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="filter-category" className="mb-1 text-xs font-medium text-gray-600">
            Categoría
          </label>
          <select
            id="filter-category"
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {catalogCategories
              .filter((c) => c.isActive)
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Empty state (Req 8.8) */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16">
          <p className="text-lg font-medium text-gray-500">
            No hay datos para el período seleccionado
          </p>
          <p className="mt-2 text-sm text-gray-400">
            No se encontraron transacciones para {filters.month} {filters.year} en{' '}
            {filters.currency}. Registra tus ingresos y egresos para ver el resumen aquí.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards (Req 8.2) */}
          <KPICards kpis={kpis} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Donut Chart - Expense distribution (Req 8.4) */}
            <DonutChart distribution={distribution} />

            {/* Bar Chart - Income vs Expenses (Req 8.5) */}
            <IncomeExpenseBarChart kpis={kpis} />
          </div>

          {/* Monthly Trend Chart - full width (Req 8.6) */}
          <MonthlyTrendChart transactions={allTransactions} filters={filters} />
        </>
      )}
    </div>
  );
}
