import { useState, useMemo, useCallback, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useCatalogs } from '@/hooks/useCatalogs';
import { filterCategoriesByType, filterConceptsByCategory } from '@/lib/utils/filtering';
import { BASE_TYPES } from '@/lib/utils/constants';
import { validateRecurringPayment, type RecurringPaymentData } from '@/lib/validators/recurring';
import type { RecurringPayment } from '@/hooks/useRecurringPayments';

export interface RecurringFormProps {
  onSave: (data: RecurringPaymentData) => Promise<void>;
  onCancel?: () => void;
  initialData?: RecurringPayment | null;
}

interface FormState {
  name: string;
  type: 'Ingreso' | 'Egreso' | '';
  categoryId: string;
  conceptId: string;
  estimatedAmount: string;
  payDay: string;
  frequency: 'mensual' | 'quincenal' | 'anual' | 'personalizada' | '';
  customIntervalDays: string;
  notes: string;
}

const INITIAL_FORM_STATE: FormState = {
  name: '',
  type: '',
  categoryId: '',
  conceptId: '',
  estimatedAmount: '',
  payDay: '',
  frequency: '',
  customIntervalDays: '',
  notes: '',
};

const FREQUENCIES = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'anual', label: 'Anual' },
  { value: 'personalizada', label: 'Personalizada' },
] as const;

/**
 * Form for creating/editing recurring payments.
 * Implements dependent dropdowns: tipo → categoría → concepto.
 * Validates all fields with inline error display.
 *
 * Requirements: 13.1, 13.7
 */
export function RecurringForm({ onSave, onCancel, initialData }: RecurringFormProps) {
  const { categories, concepts, isLoading: catalogsLoading } = useCatalogs();

  const [form, setForm] = useState<FormState>(() => {
    if (initialData) {
      return {
        name: initialData.name,
        type: initialData.type,
        categoryId: initialData.categoryId,
        conceptId: initialData.conceptId,
        estimatedAmount: String(initialData.estimatedAmount),
        payDay: String(initialData.payDay),
        frequency: initialData.frequency,
        customIntervalDays: initialData.customIntervalDays
          ? String(initialData.customIntervalDays)
          : '',
        notes: initialData.notes || '',
      };
    }
    return INITIAL_FORM_STATE;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Filtered categories based on selected type (Req 13.1 - dependent dropdown)
  const filteredCategories = useMemo(() => {
    if (!form.type) return [];
    return filterCategoriesByType(categories, form.type as 'Ingreso' | 'Egreso');
  }, [categories, form.type]);

  // Filtered concepts based on selected category (Req 13.1 - dependent dropdown)
  const filteredConcepts = useMemo(() => {
    if (!form.categoryId) return [];
    return filterConceptsByCategory(concepts, form.categoryId);
  }, [concepts, form.categoryId]);

  // Field change handler with cascade resets
  const handleChange = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };

        // When tipo changes → reset categoría and concepto
        if (field === 'type') {
          next.categoryId = '';
          next.conceptId = '';
        }

        // When categoría changes → reset concepto
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

  // Build RecurringPaymentData from form state
  const buildFormData = useCallback((): Partial<RecurringPaymentData> => {
    return {
      name: form.name,
      type: (form.type as 'Ingreso' | 'Egreso') || undefined,
      categoryId: form.categoryId || undefined,
      conceptId: form.conceptId || undefined,
      estimatedAmount: form.estimatedAmount ? parseFloat(form.estimatedAmount) : undefined,
      payDay: form.payDay ? parseInt(form.payDay, 10) : undefined,
      frequency: (form.frequency as RecurringPaymentData['frequency']) || undefined,
      customIntervalDays: form.customIntervalDays
        ? parseInt(form.customIntervalDays, 10)
        : undefined,
      notes: form.notes || undefined,
    };
  }, [form]);

  // Submit handler with validation (Req 13.7)
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const data = buildFormData();
      const result = validateRecurringPayment(data);

      if (!result.isValid) {
        const errorMap: Record<string, string> = {};
        result.errors.forEach((err) => {
          errorMap[err.field] = err.message;
        });
        setErrors(errorMap);
        return;
      }

      setErrors({});
      setIsSaving(true);

      try {
        await onSave(data as RecurringPaymentData);
        // Reset form only on create (not edit)
        if (!initialData) {
          setForm(INITIAL_FORM_STATE);
        }
      } catch (err) {
        // Show general error if save fails
        if (err instanceof Error) {
          setErrors({ _general: err.message });
        }
      } finally {
        setIsSaving(false);
      }
    },
    [buildFormData, onSave, initialData]
  );

  if (catalogsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando catálogos...</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {errors._general && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{errors._general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Name field */}
        <div className="space-y-1 md:col-span-2 lg:col-span-3">
          <label htmlFor="rp-name" className="text-sm font-medium">
            Nombre <span className="text-destructive">*</span>
          </label>
          <input
            id="rp-name"
            type="text"
            maxLength={100}
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Nombre del pago recurrente (máx. 100)"
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.name ? 'border-destructive' : 'border-border'
            } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          <p className="text-xs text-muted-foreground text-right">{form.name.length}/100</p>
        </div>

        {/* Type field */}
        <div className="space-y-1">
          <label htmlFor="rp-type" className="text-sm font-medium">
            Tipo <span className="text-destructive">*</span>
          </label>
          <select
            id="rp-type"
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
          {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
        </div>

        {/* Category field */}
        <div className="space-y-1">
          <label htmlFor="rp-category" className="text-sm font-medium">
            Categoría <span className="text-destructive">*</span>
          </label>
          <select
            id="rp-category"
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
          <label htmlFor="rp-concept" className="text-sm font-medium">
            Concepto <span className="text-destructive">*</span>
          </label>
          <select
            id="rp-concept"
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

        {/* Estimated amount / budget field */}
        <div className="space-y-1">
          <label htmlFor="rp-amount" className="text-sm font-medium">
            Presupuesto <span className="text-destructive">*</span>
          </label>
          <input
            id="rp-amount"
            type="number"
            step="0.01"
            min="0.01"
            max="999999999.99"
            value={form.estimatedAmount}
            onChange={(e) => handleChange('estimatedAmount', e.target.value)}
            placeholder="0.01 - 999,999,999.99"
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.estimatedAmount ? 'border-destructive' : 'border-border'
            } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
          />
          <p className="text-xs text-muted-foreground">
            Monto previsto para este pago recurrente
          </p>
          {errors.estimatedAmount && (
            <p className="text-xs text-destructive">{errors.estimatedAmount}</p>
          )}
        </div>

        {/* Pay day field */}
        <div className="space-y-1">
          <label htmlFor="rp-payday" className="text-sm font-medium">
            Día de pago <span className="text-destructive">*</span>
          </label>
          <input
            id="rp-payday"
            type="number"
            min="1"
            max="31"
            step="1"
            value={form.payDay}
            onChange={(e) => handleChange('payDay', e.target.value)}
            placeholder="1 - 31"
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.payDay ? 'border-destructive' : 'border-border'
            } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
          />
          {errors.payDay && <p className="text-xs text-destructive">{errors.payDay}</p>}
        </div>

        {/* Frequency field */}
        <div className="space-y-1">
          <label htmlFor="rp-frequency" className="text-sm font-medium">
            Frecuencia <span className="text-destructive">*</span>
          </label>
          <select
            id="rp-frequency"
            value={form.frequency}
            onChange={(e) => handleChange('frequency', e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.frequency ? 'border-destructive' : 'border-border'
            } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
          >
            <option value="">Seleccionar frecuencia</option>
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          {errors.frequency && (
            <p className="text-xs text-destructive">{errors.frequency}</p>
          )}
        </div>

        {/* Custom interval field - conditional */}
        {form.frequency === 'personalizada' && (
          <div className="space-y-1">
            <label htmlFor="rp-interval" className="text-sm font-medium">
              Intervalo (días) <span className="text-destructive">*</span>
            </label>
            <input
              id="rp-interval"
              type="number"
              min="1"
              max="365"
              step="1"
              value={form.customIntervalDays}
              onChange={(e) => handleChange('customIntervalDays', e.target.value)}
              placeholder="1 - 365"
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                errors.customIntervalDays ? 'border-destructive' : 'border-border'
              } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
            />
            {errors.customIntervalDays && (
              <p className="text-xs text-destructive">{errors.customIntervalDays}</p>
            )}
          </div>
        )}
      </div>

      {/* Notes field - full width */}
      <div className="space-y-1">
        <label htmlFor="rp-notes" className="text-sm font-medium">
          Notas
        </label>
        <textarea
          id="rp-notes"
          maxLength={500}
          rows={3}
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Notas adicionales (máx. 500)"
          className={`w-full rounded-md border px-3 py-2 text-sm ${
            errors.notes ? 'border-destructive' : 'border-border'
          } bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none`}
        />
        {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
        <p className="text-xs text-muted-foreground text-right">{form.notes.length}/500</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear pago recurrente'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
