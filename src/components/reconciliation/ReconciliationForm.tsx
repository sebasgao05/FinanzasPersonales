import { useMemo } from 'react';
import { formatAmount } from '@/lib/utils/formatting';
import { BASE_MONTHS } from '@/lib/utils/constants';

interface ReconciliationFormProps {
  cutoffDate: string;
  month: string;
  year: number;
  automaticAccumulated: number;
  manualAdjustment: number;
  totalBase: number;
  onCutoffDateChange: (date: string) => void;
  onManualAdjustmentChange: (value: number) => void;
}

/**
 * Formulario principal de conciliación.
 * Campos: Fecha de corte, Mes, Año, Acumulado automático, Ajuste manual, Total base.
 * Requirement: 10.1
 */
export default function ReconciliationForm({
  cutoffDate,
  month,
  year,
  automaticAccumulated,
  manualAdjustment,
  totalBase,
  onCutoffDateChange,
  onManualAdjustmentChange,
}: ReconciliationFormProps) {
  // Derive month and year from cutoff date
  const derivedMonthYear = useMemo(() => {
    if (!cutoffDate) return { month, year };
    const date = new Date(cutoffDate + 'T12:00:00');
    if (isNaN(date.getTime())) return { month, year };
    const derivedMonth = BASE_MONTHS[date.getMonth()];
    const derivedYear = date.getFullYear();
    return { month: derivedMonth, year: derivedYear };
  }, [cutoffDate, month, year]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <h3 className="text-base font-semibold">Datos de Conciliación</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Fecha de corte */}
        <div>
          <label
            htmlFor="cutoff-date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Fecha de corte
          </label>
          <input
            id="cutoff-date"
            type="date"
            value={cutoffDate}
            onChange={(e) => onCutoffDateChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
          />
        </div>

        {/* Mes (auto-calculated) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mes
          </label>
          <input
            type="text"
            value={derivedMonthYear.month}
            readOnly
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
          />
        </div>

        {/* Año (auto-calculated) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Año
          </label>
          <input
            type="text"
            value={derivedMonthYear.year}
            readOnly
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
          />
        </div>

        {/* Acumulado automático (readonly, from cash flow) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Acumulado automático
          </label>
          <input
            type="text"
            value={formatAmount(automaticAccumulated)}
            readOnly
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
          />
        </div>

        {/* Ajuste manual */}
        <div>
          <label
            htmlFor="manual-adjustment"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Ajuste manual
          </label>
          <input
            id="manual-adjustment"
            type="number"
            value={manualAdjustment}
            onChange={(e) => onManualAdjustmentChange(parseFloat(e.target.value) || 0)}
            step="0.01"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
          />
        </div>

        {/* Total base (computed) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Total base
          </label>
          <input
            type="text"
            value={formatAmount(totalBase)}
            readOnly
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
