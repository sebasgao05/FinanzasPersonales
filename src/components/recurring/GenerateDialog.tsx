import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { RecurringPayment } from '@/hooks/useRecurringPayments';

export interface GenerateDialogProps {
  payment: RecurringPayment;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Dialog for confirming generation of a transaction from a recurring payment.
 * Displays payment details: Tipo, Categoría, Concepto, Monto, Fecha (today).
 *
 * Requirements: 13.3, 13.4
 */
export function GenerateDialog({ payment, onConfirm, onCancel }: GenerateDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleConfirm = async () => {
    setIsGenerating(true);
    try {
      await onConfirm();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Generar transacción</h3>

        <p className="text-sm text-muted-foreground mb-4">
          Se creará una transacción con los siguientes datos:
        </p>

        <div className="space-y-2 mb-6 rounded-md border border-border bg-muted/30 p-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Tipo:</span>
            <span>{payment.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Categoría:</span>
            <span>{payment.categoryName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Concepto:</span>
            <span>{payment.conceptName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Monto:</span>
            <span>${payment.estimatedAmount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Fecha:</span>
            <span>{today}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Detalle:</span>
            <span className="text-right max-w-[200px] truncate">{payment.name}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generando...' : 'Generar transacción'}
          </Button>
        </div>
      </div>
    </div>
  );
}
