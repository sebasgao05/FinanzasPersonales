/**
 * Catálogos base de la aplicación.
 * Estos valores son predeterminados y no pueden ser eliminados por el usuario.
 * Ref: Requirement 11.2
 */

/** Tipos de transacción base (no eliminables) */
export const BASE_TYPES = ['Ingreso', 'Egreso'] as const;

/** Meses del año en español (no eliminables) */
export const BASE_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

/** Monedas base soportadas (no eliminables) */
export const BASE_CURRENCIES = ['COP', 'USD', 'EUR'] as const;

/** Cuentas predeterminadas para conciliación bancaria */
export const DEFAULT_ACCOUNTS = [
  'Efectivo',
  'Nequi',
  'Daviplata',
  'Bancolombia',
  'Lulo',
  'Nu',
] as const;

// Tipos derivados para type-safety
export type TransactionType = (typeof BASE_TYPES)[number];
export type Month = (typeof BASE_MONTHS)[number];
export type Currency = (typeof BASE_CURRENCIES)[number];
export type DefaultAccount = (typeof DEFAULT_ACCOUNTS)[number];
