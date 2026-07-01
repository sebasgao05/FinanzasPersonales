import type { DashboardKPIs } from '@/hooks/useDashboard';
import { formatAmount, formatPercentage } from '@/lib/utils/formatting';

interface KPICardsProps {
  kpis: DashboardKPIs;
}

interface KPICardData {
  label: string;
  value: string;
  colorClass: string;
}

/**
 * Grid of 8 KPI cards displaying financial metrics.
 * Validates: Requirements 8.2
 */
export function KPICards({ kpis }: KPICardsProps) {
  const cards: KPICardData[] = [
    {
      label: 'Ingresos totales',
      value: `$${formatAmount(kpis.totalIncome)}`,
      colorClass: 'text-green-600',
    },
    {
      label: 'Egresos totales',
      value: `$${formatAmount(kpis.totalExpense)}`,
      colorClass: 'text-red-600',
    },
    {
      label: 'Balance mensual',
      value: `$${formatAmount(kpis.monthlyBalance)}`,
      colorClass: kpis.monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      label: 'Presupuesto ingresos',
      value: `$${formatAmount(kpis.incomeBudget)}`,
      colorClass: 'text-blue-600',
    },
    {
      label: 'Presupuesto egresos',
      value: `$${formatAmount(kpis.expenseBudget)}`,
      colorClass: 'text-blue-600',
    },
    {
      label: 'Dif. presupuesto ingresos',
      value: `$${formatAmount(kpis.incomeBudgetDiff)}`,
      colorClass: kpis.incomeBudgetDiff >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      label: 'Dif. presupuesto egresos',
      value: `$${formatAmount(kpis.expenseBudgetDiff)}`,
      colorClass: kpis.expenseBudgetDiff >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      label: '% Egresos / Ingresos',
      value: formatPercentage(kpis.expensePercentage),
      colorClass: kpis.expensePercentage <= 100 ? 'text-amber-600' : 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className={`mt-1 text-xl font-semibold ${card.colorClass}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
