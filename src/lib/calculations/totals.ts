/**
 * Motor de Cálculos - Funciones de Totales y Balance
 *
 * Funciones puras para calcular totales de ingresos, egresos y balance.
 * Todas las funciones sanitizan montos y redondean a 2 decimales.
 */

import type { CalculationTransaction } from './types';
import { sanitizeAmount } from './engine';

/**
 * Calcula el total de ingresos sumando los montos de transacciones tipo 'Ingreso'.
 * Sanitiza cada monto y redondea el resultado a 2 decimales.
 * Retorna 0 para arreglos vacíos.
 */
export function totalIncome(transactions: CalculationTransaction[]): number {
  const sum = transactions
    .filter((t) => t.type === 'Ingreso')
    .reduce((acc, t) => acc + sanitizeAmount(t.amount), 0);
  return Math.round(sum * 100) / 100;
}

/**
 * Calcula el total de egresos sumando los montos de transacciones tipo 'Egreso'.
 * Sanitiza cada monto y redondea el resultado a 2 decimales.
 * Retorna 0 para arreglos vacíos.
 */
export function totalExpense(transactions: CalculationTransaction[]): number {
  const sum = transactions
    .filter((t) => t.type === 'Egreso')
    .reduce((acc, t) => acc + sanitizeAmount(t.amount), 0);
  return Math.round(sum * 100) / 100;
}

/**
 * Calcula el balance: totalIncome - totalExpense.
 * Redondea el resultado a 2 decimales.
 * Retorna 0 para arreglos vacíos.
 */
export function balance(transactions: CalculationTransaction[]): number {
  const result = totalIncome(transactions) - totalExpense(transactions);
  return Math.round(result * 100) / 100;
}
