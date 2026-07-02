/**
 * Validador de transacciones
 * Valida campos obligatorios, rangos de montos y longitudes de texto.
 * Requirements: 4.1, 4.5, 4.6
 */

export interface TransactionFormData {
  date: string;
  type: 'Ingreso' | 'Egreso';
  categoryId: string;
  conceptId: string;
  categoryName?: string;
  conceptName?: string;
  detail?: string;
  budget?: number;
  amount: number;
  currency: string;
  notes?: string;
}

export interface TransactionValidationError {
  field: string;
  message: string;
}

export interface TransactionValidationResult {
  isValid: boolean;
  errors: TransactionValidationError[];
}

const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 999_999_999.99;
const MAX_DETAIL_LENGTH = 100;
const MAX_NOTES_LENGTH = 500;
const VALID_TYPES: readonly string[] = ['Ingreso', 'Egreso'];

export function validateTransaction(data: Partial<TransactionFormData>): TransactionValidationResult {
  const errors: TransactionValidationError[] = [];

  // Validar campos obligatorios
  if (!data.date || data.date.trim() === '') {
    errors.push({ field: 'date', message: 'La fecha es obligatoria' });
  }

  if (!data.type || data.type.trim() === '') {
    errors.push({ field: 'type', message: 'El tipo es obligatorio' });
  } else if (!VALID_TYPES.includes(data.type)) {
    errors.push({ field: 'type', message: 'El tipo debe ser Ingreso o Egreso' });
  }

  if (!data.categoryId || data.categoryId.trim() === '') {
    errors.push({ field: 'categoryId', message: 'La categoría es obligatoria' });
  }

  if (!data.conceptId || data.conceptId.trim() === '') {
    errors.push({ field: 'conceptId', message: 'El concepto es obligatorio' });
  }

  if (data.amount === undefined || data.amount === null) {
    errors.push({ field: 'amount', message: 'El monto es obligatorio' });
  } else if (typeof data.amount !== 'number' || isNaN(data.amount)) {
    errors.push({ field: 'amount', message: 'El monto debe ser un número válido' });
  } else if (data.amount < MIN_AMOUNT || data.amount > MAX_AMOUNT) {
    errors.push({ field: 'amount', message: `El monto debe estar entre ${MIN_AMOUNT} y ${MAX_AMOUNT.toLocaleString('en-US', { minimumFractionDigits: 2 })}` });
  }

  if (!data.currency || data.currency.trim() === '') {
    errors.push({ field: 'currency', message: 'La moneda es obligatoria' });
  }

  // Validar presupuesto (opcional, pero si se proporciona debe estar en rango)
  if (data.budget !== undefined && data.budget !== null) {
    if (typeof data.budget !== 'number' || isNaN(data.budget)) {
      errors.push({ field: 'budget', message: 'El presupuesto debe ser un número válido' });
    } else if (data.budget < MIN_AMOUNT || data.budget > MAX_AMOUNT) {
      errors.push({ field: 'budget', message: `El presupuesto debe estar entre ${MIN_AMOUNT} y ${MAX_AMOUNT.toLocaleString('en-US', { minimumFractionDigits: 2 })}` });
    }
  }

  // Validar longitud de detalle (opcional)
  if (data.detail !== undefined && data.detail !== null && data.detail.length > MAX_DETAIL_LENGTH) {
    errors.push({ field: 'detail', message: `El detalle no debe exceder ${MAX_DETAIL_LENGTH} caracteres` });
  }

  // Validar longitud de notas (opcional)
  if (data.notes !== undefined && data.notes !== null && data.notes.length > MAX_NOTES_LENGTH) {
    errors.push({ field: 'notes', message: `Las notas no deben exceder ${MAX_NOTES_LENGTH} caracteres` });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
