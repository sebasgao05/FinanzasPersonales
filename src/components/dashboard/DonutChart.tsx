import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { CategoryDistribution } from '@/lib/calculations/types';
import { formatPercentage } from '@/lib/utils/formatting';

interface DonutChartProps {
  distribution: CategoryDistribution[];
}

const COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea',
  '#0891b2', '#e11d48', '#65a30d', '#c026d3', '#6366f1',
];

/**
 * Donut chart showing expense distribution by category.
 * Categories < 5% are grouped into "Otros" by the distribution engine.
 * Validates: Requirements 8.4
 */
export function DonutChart({ distribution }: DonutChartProps) {
  if (distribution.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-medium text-gray-700">
        Distribución de egresos por categoría
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={distribution}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="amount"
            nameKey="category"
            label={(entry) => {
              const item = entry as unknown as CategoryDistribution;
              return `${item.category} (${formatPercentage(item.percentage)})`;
            }}
            labelLine={false}
          >
            {distribution.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [
              `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              'Monto',
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
