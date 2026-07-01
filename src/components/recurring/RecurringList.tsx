import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { RecurringPayment } from '@/hooks/useRecurringPayments';

export interface RecurringListProps {
  payments: RecurringPayment[];
  onGenerate: (payment: RecurringPayment) => void;
  onEdit: (payment: RecurringPayment) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  mensual: 'Mensual',
  quincenal: 'Quincenal',
  anual: 'Anual',
  personalizada: 'Personalizada',
};

/**
 * List/table showing all recurring payments with actions.
 * Columns: Nombre, Tipo, Categoría, Monto, Día pago, Frecuencia, Estado
 * Actions: Generar (disabled if inactive), Editar, Activar/Desactivar, Eliminar
 *
 * Requirements: 13.2, 13.5, 13.6
 */
export function RecurringList({
  payments,
  onGenerate,
  onEdit,
  onToggleActive,
  onDelete,
}: RecurringListProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  if (payments.length === 0) {
    return (
      <div className="border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">
          No hay pagos recurrentes registrados.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Usa el formulario para crear tu primer pago recurrente.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table view */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Categoría</th>
                <th className="text-right px-4 py-3 font-medium">Monto</th>
                <th className="text-center px-4 py-3 font-medium">Día pago</th>
                <th className="text-left px-4 py-3 font-medium">Frecuencia</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="text-center px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{payment.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        payment.type === 'Ingreso'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {payment.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {payment.categoryName}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    ${payment.estimatedAmount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">{payment.payDay}</td>
                  <td className="px-4 py-3">
                    {FREQUENCY_LABELS[payment.frequency] || payment.frequency}
                    {payment.frequency === 'personalizada' && payment.customIntervalDays && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({payment.customIntervalDays}d)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        payment.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {payment.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {/* Generate button - disabled if inactive (Req 13.5) */}
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => onGenerate(payment)}
                        disabled={!payment.isActive}
                        title={
                          payment.isActive
                            ? 'Generar transacción'
                            : 'No se puede generar: pago inactivo'
                        }
                      >
                        Generar
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onEdit(payment)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onToggleActive(payment.id)}
                      >
                        {payment.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => handleDeleteClick(payment.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation dialog (Req 13.6) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleDeleteCancel}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ¿Estás seguro de que deseas eliminar este pago recurrente? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleDeleteCancel}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
