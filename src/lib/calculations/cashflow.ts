/**
 * Motor de Cálculos - Funciones de Flujo de Caja
 *
 * Funciones puras para calcular flujo mensual y flujo acumulado.
 * Ref: Requirements 9.3, 14.1
 */

import type { CalculationTransaction } from './types';
import { sanitizeAmount } from './engine';
import { BASE_MONTHS } from '../utils/constants';

/**
 * Calcula el flujo de caja de un mes específico: ingreso menos egreso.
 * Filtra transacciones por mes, suma ingresos y resta egresos.
 * Retorna 0 para arreglos vacíos o si el mes no se encuentra en BASE_MONTHS.
 *
 * @param transactions - Arreglo de transacciones
 * @param month - Nombre del mes en español (e.g., 'Enero', 'Febrero')
 * @returns Flujo mensual redondeado a 2 decimales
 */
export function monthlyFlow(transactions: CalculationTransaction[], month: string): number {
  if (!transactions || transactions.length === 0) {
    return 0;
  }

  if (!BASE_MONTHS.includes(month as (typeof BASE_MONTHS)[number])) {
    return 0;
  }

  const monthTransactions = transactions.filter((t) => t.month === month);

  let income = 0;
  let expense = 0;

  for (const t of monthTransactions) {
    const amount = sanitizeAmount(t.amount);
    if (t.type === 'Ingreso') {
      income += amount;
    } else if (t.type === 'Egreso') {
      expense += amount;
    }
  }

  return Math.round((income - expense) * 100) / 100;
}

/**
 * Calcula el flujo acumulado desde 'Enero' hasta el mes indicado (inclusive).
 * Suma los flujos mensuales de cada mes desde enero hasta upToMonth.
 * Retorna 0 para arreglos vacíos o si el mes no se encuentra en BASE_MONTHS.
 *
 * @param transactions - Arreglo de transacciones
 * @param upToMonth - Mes hasta el cual acumular (inclusive)
 * @returns Flujo acumulado redondeado a 2 decimales
 */
export function cumulativeFlow(transactions: CalculationTransaction[], upToMonth: string): number {
  if (!transactions || transactions.length === 0) {
    return 0;
  }

  const monthIndex = BASE_MONTHS.indexOf(upToMonth as (typeof BASE_MONTHS)[number]);
  if (monthIndex === -1) {
    return 0;
  }

  let cumulative = 0;

  for (let i = 0; i <= monthIndex; i++) {
    cumulative += monthlyFlow(transactions, BASE_MONTHS[i]);
  }

  return Math.round(cumulative * 100) / 100;
}
