/**
 * Motor de Cálculos - Funciones utilitarias base
 *
 * Funciones puras sin efectos secundarios para operaciones seguras
 * con números en el contexto financiero.
 */

/**
 * División segura que retorna 0 cuando el denominador es 0.
 * Nunca lanza excepciones, nunca retorna Infinity ni NaN.
 */
export function safeDiv(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  const result = numerator / denominator;
  if (!Number.isFinite(result) || Number.isNaN(result)) {
    return 0;
  }
  return result;
}

/**
 * Sanitiza un valor de monto: retorna 0 para null, undefined, NaN
 * o valores no numéricos. Retorna el valor original para numéricos válidos.
 */
export function sanitizeAmount(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value !== 'number') {
    return 0;
  }
  if (Number.isNaN(value)) {
    return 0;
  }
  return value;
}

/**
 * Calcula el porcentaje de ejecución: (actual / budget) * 100.
 * Retorna 0 si budget es 0. Resultado redondeado a 1 decimal.
 */
export function executionPercentage(budget: number, actual: number): number {
  const safeBudget = sanitizeAmount(budget);
  const safeActual = sanitizeAmount(actual);
  const ratio = safeDiv(safeActual, safeBudget);
  const percentage = ratio * 100;
  return Math.round(percentage * 10) / 10;
}
