import { useState, useCallback } from 'react';
import { useRecurringPayments } from '@/hooks/useRecurringPayments';
import { useTransactions } from '@/hooks/useTransactions';
import { RecurringForm } from '@/components/recurring/RecurringForm';
import { RecurringList } from '@/components/recurring/RecurringList';
import { GenerateDialog } from '@/components/recurring/GenerateDialog';
import type { RecurringPayment } from '@/hooks/useRecurringPayments';
import type { RecurringPaymentData } from '@/lib/validators/recurring';

/**
 * Página de Pagos Recurrentes.
 * Layout: formulario arriba, lista abajo.
 * Integra RecurringForm, RecurringList y GenerateDialog.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7
 */
export default function RecurringPage() {
  const {
    payments,
    isLoading,
    createPayment,
    updatePayment,
    deletePayment,
    toggleActive,
    generateTransaction,
  } = useRecurringPayments();

  const { createTransaction } = useTransactions();

  // Edit state: when set, the form switches to edit mode
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);

  // Generate dialog state
  const [generatingPayment, setGeneratingPayment] = useState<RecurringPayment | null>(null);

  // Success/error messages
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Handle form save (create or update)
  const handleSave = useCallback(
    async (data: RecurringPaymentData) => {
      try {
        if (editingPayment) {
          await updatePayment(editingPayment.id, data);
          setEditingPayment(null);
          showMessage('success', 'Pago recurrente actualizado exitosamente');
        } else {
          await createPayment(data);
          showMessage('success', 'Pago recurrente creado exitosamente');
        }
      } catch (err) {
        if (err instanceof Error) {
          showMessage('error', err.message);
        }
        throw err; // Re-throw so form can display error
      }
    },
    [editingPayment, createPayment, updatePayment]
  );

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingPayment(null);
  }, []);

  // Handle edit action from list
  const handleEdit = useCallback((payment: RecurringPayment) => {
    setEditingPayment(payment);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle generate action from list (Req 13.3)
  const handleGenerate = useCallback((payment: RecurringPayment) => {
    setGeneratingPayment(payment);
  }, []);

  // Handle generate confirm (Req 13.4)
  const handleGenerateConfirm = useCallback(async () => {
    if (!generatingPayment) return;

    const txnData = generateTransaction(generatingPayment.id);
    if (!txnData) {
      showMessage('error', 'No se pudo generar la transacción');
      setGeneratingPayment(null);
      return;
    }

    try {
      await createTransaction({
        date: txnData.date,
        type: txnData.type,
        categoryId: txnData.categoryId,
        conceptId: txnData.conceptId,
        amount: txnData.amount,
        detail: txnData.detail,
        currency: txnData.currency,
      });
      showMessage('success', 'Transacción generada exitosamente');
    } catch {
      showMessage('error', 'Error al generar la transacción');
    } finally {
      setGeneratingPayment(null);
    }
  }, [generatingPayment, generateTransaction, createTransaction]);

  // Handle generate cancel
  const handleGenerateCancel = useCallback(() => {
    setGeneratingPayment(null);
  }, []);

  // Handle toggle active from list
  const handleToggleActive = useCallback(
    async (id: string) => {
      try {
        await toggleActive(id);
      } catch {
        showMessage('error', 'Error al cambiar el estado del pago');
      }
    },
    [toggleActive]
  );

  // Handle delete from list (Req 13.6)
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deletePayment(id);
        showMessage('success', 'Pago recurrente eliminado');
      } catch {
        showMessage('error', 'Error al eliminar el pago recurrente');
      }
    },
    [deletePayment]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando pagos recurrentes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pagos Recurrentes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registra y gestiona tus pagos recurrentes. Genera transacciones con un clic.
        </p>
      </div>

      {/* Message notification */}
      {message && (
        <div
          className={`text-sm px-3 py-2 rounded-md ${
            message.type === 'error'
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form section */}
      <div className="border border-border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">
          {editingPayment ? 'Editar pago recurrente' : 'Nuevo pago recurrente'}
        </h2>
        <RecurringForm
          key={editingPayment?.id || 'new'}
          onSave={handleSave}
          onCancel={editingPayment ? handleCancelEdit : undefined}
          initialData={editingPayment}
        />
      </div>

      {/* List section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Pagos registrados</h2>
        <RecurringList
          payments={payments}
          onGenerate={handleGenerate}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
        />
      </div>

      {/* Generate dialog (Req 13.3, 13.4) */}
      {generatingPayment && (
        <GenerateDialog
          payment={generatingPayment}
          onConfirm={handleGenerateConfirm}
          onCancel={handleGenerateCancel}
        />
      )}
    </div>
  );
}
