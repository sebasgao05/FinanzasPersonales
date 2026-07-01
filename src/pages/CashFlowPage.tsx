import { useCashFlow } from '@/hooks/useCashFlow';
import { useCatalogs } from '@/hooks/useCatalogs';
import CashFlowTable from '@/components/cashflow/CashFlowTable';
import CashFlowCharts from '@/components/cashflow/CashFlowCharts';

/**
 * CashFlowPage displays the annual cash flow view with:
 * - Year selector at top (Req 9.1)
 * - Table with 12 month columns (Req 9.2)
 * - Charts: line (cumulative) and bar (monthly comparison) (Req 9.5, 9.6)
 * - Empty state when no data for selected year (Req 9.8)
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */
export default function CashFlowPage() {
  const { data, selectedYear, isLoading, setYear, hasData } = useCashFlow();
  const { years } = useCatalogs();

  // Build year options from catalog + ensure current selected year is included
  const yearOptions = getYearOptions(years.map((y) => Number(y.name)), selectedYear);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Cargando flujo de caja...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with year selector (Req 9.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Flujo de Caja</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Flujo de caja mensual y acumulado del año.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-sm font-medium">
            Año:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-md px-3 py-1.5 text-sm bg-background"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main content: table + charts, or empty state */}
      {hasData ? (
        <>
          {/* Cash Flow Table (Req 9.2, 9.3, 9.4, 9.7) */}
          <section>
            <CashFlowTable months={data.months} />
          </section>

          {/* Cash Flow Charts (Req 9.5, 9.6) */}
          <section>
            <CashFlowCharts months={data.months} />
          </section>
        </>
      ) : (
        /* Empty state (Req 9.8) */
        <EmptyState year={selectedYear} />
      )}
    </div>
  );
}

/**
 * Empty state component shown when there's no data for the selected year.
 * Includes a description and a link to the data entry page (Req 2.4, 9.8).
 */
function EmptyState({ year }: { year: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold mb-2">Sin datos para {year}</h2>
      <p className="text-muted-foreground max-w-md mb-4">
        No se encontraron transacciones registradas para el año {year} en tu moneda
        predeterminada. Registra ingresos y egresos para ver el flujo de caja.
      </p>
      <a
        href="/ingreso"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        Registrar transacciones →
      </a>
    </div>
  );
}

/**
 * Builds year options for the dropdown selector.
 * Ensures the currently selected year is always present even if
 * it's not in the catalog.
 */
function getYearOptions(catalogYears: number[], selectedYear: number): number[] {
  const currentYear = new Date().getFullYear();
  const yearsSet = new Set<number>(catalogYears.filter((y) => !isNaN(y)));

  // Always include current year and selected year
  yearsSet.add(currentYear);
  yearsSet.add(selectedYear);

  // Add some range: currentYear - 2 to currentYear + 1
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    yearsSet.add(y);
  }

  return Array.from(yearsSet).sort((a, b) => b - a);
}
