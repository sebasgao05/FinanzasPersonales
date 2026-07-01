import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PivotRow, PivotDimension } from '@/lib/calculations/pivot';
import { formatAmount } from '@/lib/utils/formatting';

interface AnalysisChartsProps {
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
 * AnalysisCharts - Bar chart comparing budget vs actual for the first grouping dimension.
 * Validates: Requirements 12.7
 */
export function AnalysisCharts({ rows, dimensions }: AnalysisChartsProps) {
  const chartData = useMemo(() => {
    if (rows.length === 0 || dimensions.length === 0) return [];

    const firstDim = dimensions[0];
    return rows.map((row) => ({
      name: row.dimensions[firstDim] || '—',
      presupuesto: row.budgetTotal,
      real: row.amountTotal,
    }));
  }, [rows, dimensions]);

  if (chartData.length === 0) {
    return null;
  }

  const firstDim = dimensions[0];

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-base font-semibold mb-3">
        Presupuesto vs Real por {DIMENSION_LABELS[firstDim]}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={chartData.length > 6 ? -35 : 0}
            textAnchor={chartData.length > 6 ? 'end' : 'middle'}
            height={chartData.length > 6 ? 60 : 40}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [
              `$${formatAmount(Number(value))}`,
              '',
            ]}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend
            formatter={(value: string) =>
              value === 'presupuesto' ? 'Presupuesto' : 'Monto real'
            }
          />
          <Bar dataKey="presupuesto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="real" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
