/**
 * Motor de Cálculos - Funciones de Conciliación de Caja y Bancos
 *
 * Funciones puras para calcular totales de conciliación,
 * pendientes por ubicar, porcentaje ubicado y estado de cuadre.
 */

import { safeDiv, sanitizeAmount } from './engine';

export interface AccountBalance {
  balance: number;
  isActive: boolean;
}

export type ReconciliationStatus = 'Cuadrado' | 'Falta ubicar' | 'Sobra';

/**
 * Calcula el total ubicado: suma de saldos de cuentas activas.
 * Sanitiza cada balance antes de sumar. Redondea a 2 decimales.
 */
export function totalLocated(accounts: AccountBalance[]): number {
  const sum = accounts
    .filter((account) => account.isActive)
    .reduce((acc, account) => acc + sanitizeAmount(account.balance), 0);
  return Math.round(sum * 100) / 100;
}

/**
 * Calcula el pendiente por ubicar: totalBase - totalLocated.
 * Redondea a 2 decimales.
 */
export function pendingToLocate(totalBase: number, totalLocatedValue: number): number {
  const result = sanitizeAmount(totalBase) - sanitizeAmount(totalLocatedValue);
  return Math.round(result * 100) / 100;
}

/**
 * Calcula el porcentaje ubicado: (totalLocated / totalBase) * 100.
 * Retorna 0 si totalBase es 0. Redondea a 1 decimal.
 */
export function locatedPercentage(totalLocatedValue: number, totalBase: number): number {
  const result = safeDiv(sanitizeAmount(totalLocatedValue), sanitizeAmount(totalBase)) * 100;
  return Math.round(result * 10) / 10;
}

/**
 * Clasifica el estado de conciliación según el valor pendiente:
 * - 'Cuadrado' si pendiente === 0
 * - 'Falta ubicar' si pendiente > 0
 * - 'Sobra' si pendiente < 0
 */
export function reconciliationStatus(pendingValue: number): ReconciliationStatus {
  const sanitized = sanitizeAmount(pendingValue);
  if (sanitized === 0) {
    return 'Cuadrado';
  }
  if (sanitized > 0) {
    return 'Falta ubicar';
  }
  return 'Sobra';
}
