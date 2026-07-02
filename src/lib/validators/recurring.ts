/**
 * Validador de pagos recurrentes
 * Validates: Requirements 13.1, 13.7
 */

export interface RecurringPaymentData {
  name: string;
  type: 'Ingreso' | 'Egreso';
  categoryId: string;
  categoryName?: string;
  conceptId: string;
  conceptName?: string;
  estimatedAmount: number;
  payDay: number;
  frequency: 'mensual' | 'quincenal' | 'anual' | 'personalizada';
  customIntervalDays?: number;
  notes?: string;
}

export interface RecurringValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
}

const VALID_TYPES = ['Ingreso', 'Egreso'] as const;
const VALID_FREQUENCIES = ['mensual', 'quincenal', 'anual', 'personalizada'] as const;
const MAX_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 500;
const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 999_999_999.99;
const MIN_PAY_DAY = 1;
const MAX_PAY_DAY = 31;
const MIN_CUSTOM_INTERVAL = 1;
const MAX_CUSTOM_INTERVAL = 365;

export function validateRecurringPayment(data: Partial<RecurringPaymentData>): RecurringValidationResult {
  const errors: { field: string; message: string }[] = [];

  // Validate name: required, not empty/whitespace, max 100 characters
  if (data.name === undefined || data.name === null) {
    errors.push({ field: 'name', message: 'El nombre es obligatorio' });
  } else if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'El nombre no puede estar vacío' });
  } else if (data.name.trim().length > MAX_NAME_LENGTH) {
    errors.push({ field: 'name', message: `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres` });
  }

  // Validate type: required, must be 'Ingreso' or 'Egreso'
  if (data.type === undefined || data.type === null) {
    errors.push({ field: 'type', message: 'El tipo es obligatorio' });
  } else if (!VALID_TYPES.includes(data.type as typeof VALID_TYPES[number])) {
    errors.push({ field: 'type', message: 'El tipo debe ser Ingreso o Egreso' });
  }

  // Validate categoryId: required
  if (!data.categoryId || (typeof data.categoryId === 'string' && data.categoryId.trim().length === 0)) {
    errors.push({ field: 'categoryId', message: 'La categoría es obligatoria' });
  }

  // Validate conceptId: required
  if (!data.conceptId || (typeof data.conceptId === 'string' && data.conceptId.trim().length === 0)) {
    errors.push({ field: 'conceptId', message: 'El concepto es obligatorio' });
  }

  // Validate estimatedAmount: required, 0.01 to 999,999,999.99
  if (data.estimatedAmount === undefined || data.estimatedAmount === null) {
    errors.push({ field: 'estimatedAmount', message: 'El monto estimado es obligatorio' });
  } else if (typeof data.estimatedAmount !== 'number' || isNaN(data.estimatedAmount)) {
    errors.push({ field: 'estimatedAmount', message: 'El monto estimado debe ser un número válido' });
  } else if (data.estimatedAmount < MIN_AMOUNT || data.estimatedAmount > MAX_AMOUNT) {
    errors.push({ field: 'estimatedAmount', message: `El monto estimado debe estar entre ${MIN_AMOUNT} y ${MAX_AMOUNT.toLocaleString('en-US')}` });
  }

  // Validate payDay: required, integer 1-31
  if (data.payDay === undefined || data.payDay === null) {
    errors.push({ field: 'payDay', message: 'El día de pago es obligatorio' });
  } else if (typeof data.payDay !== 'number' || isNaN(data.payDay)) {
    errors.push({ field: 'payDay', message: 'El día de pago debe ser un número válido' });
  } else if (!Number.isInteger(data.payDay) || data.payDay < MIN_PAY_DAY || data.payDay > MAX_PAY_DAY) {
    errors.push({ field: 'payDay', message: `El día de pago debe ser un entero entre ${MIN_PAY_DAY} y ${MAX_PAY_DAY}` });
  }

  // Validate frequency: required, must be one of valid frequencies
  if (data.frequency === undefined || data.frequency === null) {
    errors.push({ field: 'frequency', message: 'La frecuencia es obligatoria' });
  } else if (!VALID_FREQUENCIES.includes(data.frequency as typeof VALID_FREQUENCIES[number])) {
    errors.push({ field: 'frequency', message: 'La frecuencia debe ser mensual, quincenal, anual o personalizada' });
  }

  // Validate customIntervalDays: required if frequency is 'personalizada', integer 1-365
  if (data.frequency === 'personalizada') {
    if (data.customIntervalDays === undefined || data.customIntervalDays === null) {
      errors.push({ field: 'customIntervalDays', message: 'El intervalo personalizado es obligatorio cuando la frecuencia es personalizada' });
    } else if (typeof data.customIntervalDays !== 'number' || isNaN(data.customIntervalDays)) {
      errors.push({ field: 'customIntervalDays', message: 'El intervalo personalizado debe ser un número válido' });
    } else if (!Number.isInteger(data.customIntervalDays) || data.customIntervalDays < MIN_CUSTOM_INTERVAL || data.customIntervalDays > MAX_CUSTOM_INTERVAL) {
      errors.push({ field: 'customIntervalDays', message: `El intervalo personalizado debe ser un entero entre ${MIN_CUSTOM_INTERVAL} y ${MAX_CUSTOM_INTERVAL} días` });
    }
  }

  // Validate notes: optional, max 500 characters
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes === 'string' && data.notes.length > MAX_NOTES_LENGTH) {
      errors.push({ field: 'notes', message: `Las notas no pueden exceder ${MAX_NOTES_LENGTH} caracteres` });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
