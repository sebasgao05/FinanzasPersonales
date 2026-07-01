import { useCallback, useState } from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { type TransactionFormData } from '@/lib/validators/transaction';

export default function TransactionEntryPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = useCallback(
    async (data: TransactionFormData & { month: string; year: number }) => {
      // TODO: Replace with actual Amplify Data mutation when backend is connected
      // Simulates saving to DynamoDB via AppSync
      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log('Transaction saved:', data);

      setSuccessMessage('Transacción guardada exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ingreso de Datos</h1>
        <p className="text-muted-foreground mt-1">
          Registra tus ingresos y egresos usando el formulario.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          {successMessage}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6">
        <TransactionForm onSave={handleSave} />
      </div>
    </div>
  );
}
