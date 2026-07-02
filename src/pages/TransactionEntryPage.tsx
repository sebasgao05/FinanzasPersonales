import { useCallback } from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { type TransactionFormData } from '@/lib/validators/transaction';
import { useTransactions } from '@/hooks/useTransactions';
import { useCatalogs } from '@/hooks/useCatalogs';
import { useState } from 'react';

export default function TransactionEntryPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { createTransaction } = useTransactions();
  const { categories, concepts } = useCatalogs();

  const handleSave = useCallback(
    async (data: TransactionFormData & { month: string; year: number }) => {
      // Resolve category and concept names from IDs
      const category = categories.find((c) => c.id === data.categoryId);
      const concept = concepts.find((c) => c.id === data.conceptId);

      const enrichedData = {
        ...data,
        categoryName: category?.name ?? data.categoryId,
        conceptName: concept?.name ?? data.conceptId,
      };

      await createTransaction(enrichedData);

      setSuccessMessage('Transacción guardada exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    [createTransaction, categories, concepts]
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
