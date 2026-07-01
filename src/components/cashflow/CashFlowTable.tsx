import { formatAmount, formatPercentage } from '@/lib/utils/formatting';
import { BASE_MONTHS } from '@/lib/utils/constants';
import type { MonthlyFlow } from '@/hooks/useCashFlow';

interface CashFlowTableProps {
  months: MonthlyFlow[];
}

/**
 * CashFlowTable displays a horizontal table with 12 month columns.
 * Rows: Ingreso, Egreso, % Egresos/Ingresos, Flujo mensual, Flujo acumulado.
 * Supports horizontal scroll on mobile (Req 9.7).
 *
 * Validates: Requirements 9.2, 9.3, 9.4, 9.7
 */
export default function CashFlowTable({ months }: CashFlowTableProps) {
  // Month short labels for table headers
  const monthLabels = BASE_MONTHS.map((m) => m.substring(0, 3));

  const rows: { label: string; getValue: (m: MonthlyFlow) => string; colorFn?: (m: MonthlyFlow) => string }[] = [
    {
      label: 'Ingreso',
      getValue: (m) => formatAmount(m.income),
      colorFn: () => 'text-green-700',
    },
    {
      label: 'Egreso',
      getValue: (m) => formatAmount(m.expense),
      colorFn: () => 'text-red-700',
    },
    {
      label: '% Egresos/Ingresos',
      getValue: (m) => formatPercentage(m.expensePercentage),
    },
    {
      label: 'Flujo mensual',
      getValue: (m) => formatAmount(m.monthlyFlow),
      colorFn: (m) => (m.monthlyFlow >= 0 ? 'text-green-700' : 'text-red-700'),
    },
    {
      label: 'Flujo acumulado',
      getValue: (m) => formatAmount(m.cumulativeFlow),
      colorFn: (m) => (m.cumulativeFlow >= 0 ? 'text-blue-700' : 'text-red-700'),
    },
  ];

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-[900px] w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-semibold sticky left-0 bg-muted/50 min-w-[140px]">
              Concepto
            </th>
            {monthLabels.map((label, index) => (
              <th key={index} className="text-right p-3 font-semibold min-w-[90px]">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className="p-3 font-medium sticky left-0 bg-background">
                {row.label}
              </td>
              {months.map((m, index) => (
                <td
                  key={index}
                  className={`p-3 text-right tabular-nums ${row.colorFn ? row.colorFn(m) : ''}`}
                >
                  {row.getValue(m)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
