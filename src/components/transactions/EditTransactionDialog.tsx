import { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useCatalogs } from '@/hooks/useCatalogs';
import { validateTransaction, type TransactionFormData, type TransactionValidationError } from '@/lib/validators/transaction';
import { extractMonth, extractYear } from '@/lib/utils/dates';
import { filterCategoriesByType, filterConceptsByCategory, type TransactionRecord } from '@/lib/utils/filtering';
import { BASE_TYPES } from '@/lib/utils/constants';

// ============ Delete Confirm Dialog ============

export interface DeleteConfirmDialogProps {
  transaction: TransactionRecord;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

/**
 * Dialog de confirmación para eliminar una transacción.
 * Muestra detalle de la transacción y requiere confirmación explícita.
 * Requirements: 5.7, 5.8
 */
export function DeleteConfirmDialog({ transaction, isOpen, onClose, onConfirm }: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="w-full max-w-md mx-4 rounded-lg bg-background border border-border p-6 shadow-lg">
        <h2 id="delete-dialog-title" className="text-lg font-semibold text-foreground">
          Confirmar eliminación
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.
        </p>
        <div className="mt-4 rounded-md bg-muted p-3 text-sm">
          <p><span className="font-medium">Fecha:</span> {transaction.date}</p>
          <p><span className="font-medium">Tipo:</span> {transaction.type}</p>
          <p><span className="font-medium">Categoría:</span> {transaction.categoryName}</p>
          <p><span className="font-medium">Concepto:</span> {transaction.conceptName}</p>
          {transaction.detail && (
            <p><span className="font-medium">Detalle:</span> {transaction.detail}</p>
          )}
          <p><span className="font-medium">Monto:</span> {transaction.amount.toLocaleString()} {transaction.currency}</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ Edit Transaction Dialog ============

export interface EditTransactionDialogProps {
  transaction: TransactionRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<TransactionFormData>) => Promise<void> | void;
}

interface EditFormState {
  date: string;
  type: 'Ingreso' | 'Egreso' | '';
  categoryId: string;
  conceptId: string;
  detail: string;
  budget: string;
  amount: string;
  currency: string;
  notes: string;
}

/**
 * Diálogo modal para editar una transacción existente.
 * Carga los datos actuales y permite modificarlos con las mismas
 * reglas de validación y comportamiento de dropdowns dependientes.
 * Requirements: 5.5, 5.6
 */
export function EditTransactionDialog({ transaction, isOpen, onClose, onSave }: EditTransactionDialogProps) {
  const { categories, concepts, currencies, isLoading: catalogsLoading } = useCatalogs();

  const [form, setForm] = useState<EditFormState>({
    date: '',
    type: '',
    categoryId: '',
    conceptId: '',
    detail: '',
    budget: '',
    amount: '',
    currency: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [computedMonth, setComputedMonth] = useState<string>('');
  const [computedYear, setComputedYear] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Populate form with transaction data when dialog opens
  useEffect(() => {
    if (isOpen && transaction) {
      setForm({
        date: transaction.date,
        type: transaction.type,
        categoryId: transaction.categoryId,
        conceptId: transaction.conceptId,
        detail: transaction.detail ?? '',
        budget: transaction.budget !== undefined && transaction.budget !== null
          ? String(transaction.budget)
          : '',
        amount: String(transaction.amount),
        currency: transaction.currency,
        notes: transaction.notes ?? '',
      });
      setErrors({});
    }
  }, [isOpen, transaction]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered categories based on selected type
  const filteredCategories = useMemo(() => {
    if (!form.type) return [];
    return filterCategoriesByType(categories, form.type as 'Ingreso' | 'Egreso');
  }, [categories, form.type]);

  // Filtered concepts based on selected category
  const filteredConcepts = useMemo(() => {
    if (!form.categoryId) return [];
    return filterConceptsByCategory(concepts, form.categoryId);
  }, [concepts, form.categoryId]);

  // Active currencies for dropdown
  const activeCurrencies = useMemo(() => {
    return currencies.filter((c) => c.isActive);
  }, [currencies]);

  // Compute month/year when date changes
  useEffect(() => {
    if (form.date && form.date.length >= 10) {
      try {
        const month = extractMonth(form.date);
        const year = extractYear(form.date);
        setComputedMonth(month);
        setComputedYear(year);
      } catch {
        setComputedMonth('');
        setComputedYear(null);
      }
    } else {
      setComputedMonth('');
      setComputedYear(null);
    }
  }, [form.date]);

  // Field change handler
  const handleChange = useCallback(
    (field: keyof EditFormState, value: string) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };

        // When tipo changes → reset categoría and concepto (Req 4.3)
        if (field === 'type') {
          next.categoryId = '';
          next.conceptId = '';
        }

        // When categoría changes → reset concepto (Req 4.4)
        if (field === 'categoryId') {
          next.conceptId = '';
        }

        return next;
      });

      // Clear error for the field being edited
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  // Build TransactionFormData from form state
  const buildFormData = useCallback((): Partial<TransactionFormData> => {
    return {
      date: form.date || undefined,
      type: (form.type as 'Ingreso' | 'Egreso') || undefined,
      categoryId: form.categoryId || undefined,
      conceptId: form.conceptId || undefined,
      detail: form.detail || undefined,
      budget: form.budget ? parseFloat(form.budget) : undefined,
      amount: form.amount ? parseFloat(form.amount) : (undefined as unknown as number),
      currency: form.currency || undefined,
      notes: form.notes || undefined,
    };
  }, [form]);

  // Validate form and return error map
  const validateForm = useCallback((): boolean => {
    const data = buildFormData();
    const result = validateTransaction(data);

    if (!result.isValid) {
      const errorMap: Record<string, string> = {};
      result.errors.forEach((err: TransactionValidationError) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return false;
    }

    setErrors({});
    return true;
  }, [buildFormData]);

  // Save: validate, update transaction, close dialog (Req 5.6)
  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      setIsSaving(true);
      try {
        const data = buildFormData() as TransactionFormData;
        await onSave(transaction.id, data);
        onClose();
      } catch {
        // Error handling via toast in parent
      } finally {
        setIsSaving(false);
      }
    },
    [validateForm, buildFormData, onSave, transaction.id, onClose]
  );

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-dialog-title"
    >
      <div className="w-full max-w-2xl mx-4 rounded-lg bg-background border border-border p-6 shadow-lg">
        <h2 id="edit-dialog-title" className="text-lg font-semibold text-foreground mb-4">
          Editar transacción
        </h2>

        {catalogsLoading ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Cargando catálogos...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date field */}
              <div className="space-y-1">
                <label htmlFor="edit-tx-date" className="text-sm font-medium">
                  Fecha <span className="text-destructive">*</span>
                </label>
                <input
                  id="edit-tx-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.date ? 'border-destructive' : 'border-border'
                  } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
                />
                {errors.date && (
                  <p className="text-xs text-destructive">{errors.date}</p>
                )}
                {computedMonth && computedYear && (
                  <p className="text-xs text-muted-foreground">
                    {computedMonth} {computedYear}
                  </p>
                )}
              </div>

              {/* Type field */}
              <div className="space-y-1">
                <label htmlFor="edit-tx-type" className="text-sm font-medium">
                  Tipo <span className="text-destructive">*</span>
                </label>
                <select
                  id="edit-tx-type"
                  value={form.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.type ? 'border-destructive' : 'border-border'
                  } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
                >
                  <option value="">Seleccionar tipo</option>
                  {BASE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="text-xs text-destructive">{errors.type}</p>
                )}
              </div>

              {/* Category field */}
              <div className="space-y-1">
                <label htmlFor="edit-tx-category" className="text-sm font-medium">
                  Categoría <span className="text-destructive">*</span>
                </label>
                <select
                  id="edit-tx-category"
                  value={form.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  disabled={!form.type}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.categoryId ? 'border-destructive' : 'border-border'
                  } bg-background disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring`}
                >
                  <option value="">Seleccionar categoría</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-xs text-destructive">{errors.categoryId}</p>
                )}
                {form.type && filteredCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No hay categorías activas para este tipo
                  </p>
                )}
              </div>

              {/* Concept field */}
              <div className="space-y-1">
                <label htmlFor="edit-tx-concept" className="text-sm font-medium">
                  Concepto <span className="text-destructive">*</span>
                </label>
                <select
                  id="edit-tx-concept"
                  value={form.conceptId}
                  onChange={(e) => handleChange('conceptId', e.target.value)}
                  disabled={!form.categoryId}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.conceptId ? 'border-destructive' : 'border-border'
                  } bg-background disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring`}
                >
                  <option value="">Seleccionar concepto</option>
                  {filteredConcepts.map((con) => (
                    <option key={con.id} value={con.id}>
                      {con.name}
                    </option>
                  ))}
                </select>
                {errors.conceptId && (
                  <p className="text-xs text-destructive">{errors.conceptId}</p>
                )}
                {form.categoryId && filteredConcepts.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No hay conceptos activos para esta categoría
                  </p>
                )}
              </div>

              {/* Detail field */}
              <div className="space-y-1">
                <label htmlFor="edit-tx-detail" className="text-sm font-medium">
                  Detalle
                </label>
                <input
                  id="edit-tx-detail"
                  type="text"
                  maxLength={100}
                  value={form.detail}
                  onChange={(e) => handleChange('detail', e.target.value)}
                  placeholder="Descripción breve (máx. 100)"
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.detail ? 'border-destructive' : 'border-border'
                  } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
                />
                {errors.detail && (
                  <p className="text-xs text-destructive">{errors.detail}</p>
                )}
                <p className="text-xs text-muted-foreground text-right">
                  {form.detail.length}/100
                </p>
              </div>

              {/* Budget field */}
              <div className="space-y-1">
                <label htmlFor="edit-tx-budget" className="text-sm font-medium">
                  Presupuesto
                </label>
                <input
                  id="edit-tx-budget"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="999999999.99"
                  value={form.budget}
                  onChange={(e) => handleChange('budget', e.target.value)}
                  placeholder="0.01 - 999,999,999.99"
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.budget ? 'border-destructive' : 'border-border'
                  } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
                />
                {errors.budget && (
                  <p className="text-xs text-destructive">{errors.budget}</p>
                )}
              </div>

              {/* Amount field */}
              <div className="space-y-1">
                <label htmlFor="edit-tx-amount" className="text-sm font-medium">
                  Monto real <span className="text-destructive">*</span>
                </label>
                <input
                  id="edit-tx-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="999999999.99"
                  value={form.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="0.01 - 999,999,999.99"
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.amount ? 'border-destructive' : 'border-border'
                  } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount}</p>
                )}
              </div>

              {/* Currency field */}
              <div className="space-y-1">
                <label htmlFor="edit-tx-currency" className="text-sm font-medium">
                  Moneda <span className="text-destructive">*</span>
                </label>
                <select
                  id="edit-tx-currency"
                  value={form.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.currency ? 'border-destructive' : 'border-border'
                  } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
                >
                  <option value="">Seleccionar moneda</option>
                  {activeCurrencies.map((cur) => (
                    <option key={cur.id} value={cur.name}>
                      {cur.name}
                    </option>
                  ))}
                </select>
                {errors.currency && (
                  <p className="text-xs text-destructive">{errors.currency}</p>
                )}
              </div>
            </div>

            {/* Notes field - full width */}
            <div className="space-y-1 mt-4">
              <label htmlFor="edit-tx-notes" className="text-sm font-medium">
                Notas
              </label>
              <textarea
                id="edit-tx-notes"
                maxLength={500}
                rows={3}
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Notas adicionales (máx. 500)"
                className={`w-full rounded-md border px-3 py-2 text-sm ${
                  errors.notes ? 'border-destructive' : 'border-border'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none`}
              />
              {errors.notes && (
                <p className="text-xs text-destructive">{errors.notes}</p>
              )}
              <p className="text-xs text-muted-foreground text-right">
                {form.notes.length}/500
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
