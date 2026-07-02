import { useState, useMemo, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useReconciliation } from '@/hooks/useReconciliation';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/contexts/SettingsContext';
import { formatAmount, formatPercentage } from '@/lib/utils/formatting';
import ReconciliationForm from '@/components/reconciliation/ReconciliationForm';
import AccountBalances from '@/components/reconciliation/AccountBalances';
import { Button } from '@/components/ui/button';

// Colors for accounts in the chart
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#14b8a6', // teal
];

/**
 * Página de Conciliación de Caja y Bancos.
 * Permite al usuario cuadrar saldos reales con el flujo acumulado.
 * Requirements: 10.1-10.9
 */
export default function ReconciliationPage() {
  const {
    accounts,
    reconciliation,
    isLoading,
    addAccount,
    editAccountName,
    deactivateAccount,
    updateBalance,
    setManualAdjustment,
    setAutomaticAccumulated,
    saveReconciliation,
  } = useReconciliation();

  const { transactions } = useTransactions();
  const { settings } = useSettings();

  // Calculate automatic accumulated from all transactions in default currency
  // This is the total balance (income - expenses) that should be located in accounts
  const calculatedAccumulated = useMemo(() => {
    const filtered = transactions.filter(
      (t) => t.currency === settings.defaultCurrency
    );
    const income = filtered
      .filter((t) => t.type === 'Ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered
      .filter((t) => t.type === 'Egreso')
      .reduce((sum, t) => sum + t.amount, 0);
    return Math.round((income - expense) * 100) / 100;
  }, [transactions, settings.defaultCurrency]);

  // Update the accumulated value when transactions change
  useEffect(() => {
    setAutomaticAccumulated(calculatedAccumulated);
  }, [calculatedAccumulated, setAutomaticAccumulated]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [cutoffDate, setCutoffDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await saveReconciliation();
      setSaveMessage('Conciliación guardada exitosamente');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al guardar';
      setSaveMessage(`Error: ${msg}`);
      console.error('Save reconciliation error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [saveReconciliation]);

  // Chart data: distribution of balances by account (active only)
  const chartData = useMemo(() => {
    return accounts
      .filter((a) => a.isActive && a.balance !== 0)
      .map((a) => ({
        name: a.name,
        balance: a.balance,
      }));
  }, [accounts]);

  // Status indicator styles
  const statusConfig = useMemo(() => {
    switch (reconciliation.status) {
      case 'Cuadrado':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          border: 'border-green-200 dark:border-green-700',
          label: 'Cuadrado',
          description: 'Los saldos reales coinciden con el total base',
        };
      case 'Falta ubicar':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
          border: 'border-yellow-200 dark:border-yellow-700',
          label: 'Falta ubicar',
          description: 'Hay dinero sin ubicar en las cuentas',
        };
      case 'Sobra':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          border: 'border-red-200 dark:border-red-700',
          label: 'Sobra',
          description: 'Los saldos reales exceden el total base',
        };
    }
  }, [reconciliation.status]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Cargando conciliación...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Caja y Bancos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Concilia tus saldos reales con el flujo acumulado.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="size-4" />
          {isSaving ? 'Guardando...' : 'Guardar conciliación'}
        </Button>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div
          className={`text-sm px-3 py-2 rounded-md ${
            saveMessage.includes('Error')
              ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
              : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* Empty state hint when no flow data exists (Req 2.4) */}
      {reconciliation.automaticAccumulated === 0 && reconciliation.totalLocated === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-muted/30 p-6 text-center">
          <p className="text-muted-foreground">
            No hay datos de flujo de caja para conciliar aún.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Registra transacciones primero para que el acumulado automático se calcule.{' '}
            <Link to="/ingreso" className="text-primary underline hover:no-underline">
              Ir a Ingreso de Datos
            </Link>
          </p>
        </div>
      )}

      {/* Reconciliation Form */}
      <ReconciliationForm
        cutoffDate={cutoffDate}
        month={reconciliation.month}
        year={reconciliation.year}
        automaticAccumulated={reconciliation.automaticAccumulated}
        manualAdjustment={reconciliation.manualAdjustment}
        totalBase={reconciliation.totalBase}
        onCutoffDateChange={setCutoffDate}
        onManualAdjustmentChange={setManualAdjustment}
      />

      {/* Status Indicator */}
      <div className={`border ${statusConfig.border} rounded-lg p-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {statusConfig.description}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Total ubicado: </span>
              <span className="font-medium">${formatAmount(reconciliation.totalLocated)}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Pendiente: </span>
              <span className="font-medium">${formatAmount(reconciliation.pendingToLocate)}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">% ubicado: </span>
              <span className="font-medium">{formatPercentage(reconciliation.locatedPercentage)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout for accounts and chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Balances */}
        <AccountBalances
          accounts={accounts}
          onBalanceChange={updateBalance}
          onAddAccount={addAccount}
          onEditAccountName={editAccountName}
          onDeactivateAccount={deactivateAccount}
        />

        {/* Distribution Chart */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-base font-semibold mb-3">Distribución de Saldos</h3>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              Ingresa saldos en las cuentas para ver la distribución
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`$${formatAmount(Number(value))}`, 'Saldo']}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                  {chartData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
