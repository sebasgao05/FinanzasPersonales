import {
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
import type { DashboardFilters } from '@/hooks/useDashboard';
import type { TransactionRecord } from '@/lib/utils/filtering';

interface MonthlyTrendChartProps {
  transactions: TransactionRecord[];
  filters: DashboardFilters;
}

interface MonthlyData {
  month: string;
  ingresos: number;
  egresos: number;
}

/**
 * Bar chart showing monthly income/expense evolution for the selected year.
 * Validates: Requirements 8.6
 */
export function MonthlyTrendChart({ transactions, filters }: MonthlyTrendChartProps) {
  // Calculate monthly income/expense for the selected year and currency
  const monthlyData: MonthlyData[] = BASE_MONTHS.map((month) => {
    const monthTransactions = transactions.filter(
      (t) => t.month === month && t.year === filters.year && t.currency === filters.currency
    );

    const ingresos = monthTransactions
      .filter((t) => t.type === 'Ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    const egresos = monthTransactions
      .filter((t) => t.type === 'Egreso')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: month.substring(0, 3),
      ingresos: Math.round(ingresos * 100) / 100,
      egresos: Math.round(egresos * 100) / 100,
    };
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-medium text-gray-700">
        Evolución mensual — {filters.year}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            formatter={(value) => [
              `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            ]}
          />
          <Legend />
          <Bar dataKey="ingresos" name="Ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="egresos" name="Egresos" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
