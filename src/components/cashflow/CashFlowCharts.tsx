import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BASE_MONTHS } from '@/lib/utils/constants';
import type { MonthlyFlow } from '@/hooks/useCashFlow';
import { formatAmount } from '@/lib/utils/formatting';

interface CashFlowChartsProps {
  months: MonthlyFlow[];
}

/**
 * CashFlowCharts renders:
 * - A line chart showing cumulative cash flow over 12 months (Req 9.5)
 * - A bar chart comparing monthly income vs expense (Req 9.6)
 *
 * Validates: Requirements 9.5, 9.6
 */
export default function CashFlowCharts({ months }: CashFlowChartsProps) {
  // Prepare chart data with short month labels
  const chartData = months.map((m, index) => ({
    month: BASE_MONTHS[index].substring(0, 3),
    income: m.income,
    expense: m.expense,
    cumulativeFlow: m.cumulativeFlow,
    monthlyFlow: m.monthlyFlow,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart: Cumulative Flow (Req 9.5) */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Flujo Acumulado</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(value) => formatAmount(Number(value))} />
            <Tooltip
              formatter={(value) => [formatAmount(Number(value)), 'Acumulado']}
              labelFormatter={(label) => `Mes: ${String(label)}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="cumulativeFlow"
              name="Flujo Acumulado"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart: Monthly Income vs Expense (Req 9.6) */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Ingresos vs Egresos por Mes</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(value) => formatAmount(Number(value))} />
            <Tooltip
              formatter={(value, name) => [
                formatAmount(Number(value)),
                name === 'Ingresos' ? 'Ingresos' : 'Egresos',
              ]}
              labelFormatter={(label) => `Mes: ${String(label)}`}
            />
            <Legend />
            <Bar dataKey="income" name="Ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Egresos" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
