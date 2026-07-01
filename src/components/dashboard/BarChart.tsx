import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardKPIs } from '@/hooks/useDashboard';

interface IncomeExpenseBarChartProps {
  kpis: DashboardKPIs;
}

/**
 * Bar chart comparing total income vs total expenses.
 * Validates: Requirements 8.5
 */
export function IncomeExpenseBarChart({ kpis }: IncomeExpenseBarChartProps) {
  const data = [
    {
      name: 'Ingresos',
      monto: kpis.totalIncome,
    },
    {
      name: 'Egresos',
      monto: kpis.totalExpense,
    },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-medium text-gray-700">
        Ingresos vs Egresos
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value) => [
              `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              'Monto',
            ]}
          />
          <Legend />
          <Bar dataKey="monto" name="Monto" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
