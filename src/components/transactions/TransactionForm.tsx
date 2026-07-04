import { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useCatalogs } from '@/hooks/useCatalogs';
import { useSettings } from '@/contexts/SettingsContext';
import { validateTransaction, type TransactionFormData, type TransactionValidationError } from '@/lib/validators/transaction';
import { extractMonth, extractYear } from '@/lib/utils/dates';
import { filterCategoriesByType, filterConceptsByCategory } from '@/lib/utils/filtering';
import { BASE_TYPES } from '@/lib/utils/constants';

export interface TransactionFormProps {
  onSave?: (data: TransactionFormData & { month: string; year: number }) => Promise<void> | void;
}

interface FormState {
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

function getTodayISO(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

const INITIAL_FORM_STATE: FormState = {
  date: getTodayISO(),
  type: '',
  categoryId: '',
  conceptId: '',
  detail: '',
  budget: '',
  amount: '',
  currency: '',
  notes: '',
};

export function TransactionForm({ onSave }: TransactionFormProps) {
  const { categories, concepts, currencies, isLoading: catalogsLoading } = useCatalogs();
  const { settings } = useSettings();

  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [computedMonth, setComputedMonth] = useState<string>('');
  const [computedYear, setComputedYear] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Apply settings defaults on mount
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      type: prev.type || (settings.defaultCurrency ? '' : ''),
      currency: prev.currency || settings.defaultCurrency || 'COP',
    }));
  }, [settings.defaultCurrency]);

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
    (field: keyof FormState, value: string) => {
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

  // Clear all form fields to initial state
  const resetForm = useCallback(() => {
    setForm({
      ...INITIAL_FORM_STATE,
      date: getTodayISO(),
      currency: settings.defaultCurrency || 'COP',
    });
    setErrors({});
    setComputedMonth('');
    setComputedYear(null);
  }, [settings.defaultCurrency]);

  // Save: validate, create transaction, clear all fields (Req 4.7)
  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      setIsSaving(true);
      try {
        const data = buildFormData() as TransactionFormData;
        const month = computedMonth;
        const year = computedYear ?? extractYear(data.date);

        if (onSave) {
          await onSave({ ...data, month, year });
        }

        // Clear all fields
        resetForm();
      } catch {
        // Error handling via toast in parent
      } finally {
        setIsSaving(false);
      }
    },
    [validateForm, buildFormData, computedMonth, computedYear, onSave, resetForm]
  );

  // Save and create another: validate, create, keep tipo/categoría/moneda (Req 4.8)
  const handleSaveAndNew = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      setIsSaving(true);
      try {
        const data = buildFormData() as TransactionFormData;
        const month = computedMonth;
        const year = computedYear ?? extractYear(data.date);

        if (onSave) {
          await onSave({ ...data, month, year });
        }

        // Keep tipo, categoría, moneda - clear the rest, date defaults to today
        setForm((prev) => ({
          ...INITIAL_FORM_STATE,
          date: getTodayISO(),
          type: prev.type,
          categoryId: prev.categoryId,
          currency: prev.currency,
        }));
        setErrors({});
        setComputedMonth('');
        setComputedYear(null);
      } catch {
        // Error handling via toast in parent
      } finally {
        setIsSaving(false);
      }
    },
    [validateForm, buildFormData, computedMonth, computedYear, onSave]
  );

  // Clear: reset all fields without saving (Req 4.9)
  const handleClear = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      resetForm();
    },
    [resetForm]
  );

  if (catalogsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando catálogos...</p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSave} noValidate>
      {/* Date field */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label htmlFor="tx-date" className="text-sm font-medium">
            Fecha <span className="text-destructive">*</span>
          </label>
          <input
            id="tx-date"
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
          <label htmlFor="tx-type" className="text-sm font-medium">
            Tipo <span className="text-destructive">*</span>
          </label>
          <select
            id="tx-type"
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
          <label htmlFor="tx-category" className="text-sm font-medium">
            Categoría <span className="text-destructive">*</span>
          </label>
          <select
            id="tx-category"
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
          <label htmlFor="tx-concept" className="text-sm font-medium">
            Concepto <span className="text-destructive">*</span>
          </label>
          <select
            id="tx-concept"
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
          <label htmlFor="tx-detail" className="text-sm font-medium">
            Detalle
          </label>
          <input
            id="tx-detail"
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
          <label htmlFor="tx-budget" className="text-sm font-medium">
            Presupuesto
          </label>
          <input
            id="tx-budget"
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
          <label htmlFor="tx-amount" className="text-sm font-medium">
            Monto real <span className="text-destructive">*</span>
          </label>
          <input
            id="tx-amount"
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
          <label htmlFor="tx-currency" className="text-sm font-medium">
            Moneda <span className="text-destructive">*</span>
          </label>
          <select
            id="tx-currency"
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
      <div className="space-y-1">
        <label htmlFor="tx-notes" className="text-sm font-medium">
          Notas
        </label>
        <textarea
          id="tx-notes"
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
      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isSaving}
          onClick={handleSaveAndNew}
        >
          Guardar y crear otro
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={handleClear}
        >
          Limpiar
        </Button>
      </div>
    </form>
  );
}
