/**
 * Motor de Cálculos - Funciones de distribución por categoría
 *
 * Funciones puras para calcular la distribución porcentual de egresos
 * por categoría, agrupando categorías menores al 5% en "Otros".
 */

import type { CalculationTransaction, CategoryDistribution } from './types';
import { sanitizeAmount } from './engine';

/**
 * Calcula la distribución porcentual de egresos por categoría.
 *
 * 1. Filtra solo transacciones de tipo 'Egreso'
 * 2. Agrupa por categoría, sumando montos sanitizados
 * 3. Calcula el porcentaje de cada categoría sobre el total
 * 4. Agrupa categorías con porcentaje < 5% en "Otros"
 * 5. Redondea porcentajes a 1 decimal
 * 6. Ajusta para que la suma de porcentajes sea exactamente 100%
 *
 * Retorna arreglo vacío si no hay transacciones o no hay egresos.
 */
export function categoryDistribution(transactions: CalculationTransaction[]): CategoryDistribution[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Filter only expense transactions
  const expenses = transactions.filter(t => t.type === 'Egreso');

  if (expenses.length === 0) {
    return [];
  }

  // Group by category, summing sanitized amounts
  const categoryMap = new Map<string, number>();

  for (const t of expenses) {
    const category = t.category || 'Sin categoría';
    const amount = sanitizeAmount(t.amount);
    const current = categoryMap.get(category) || 0;
    categoryMap.set(category, current + amount);
  }

  // Calculate total expenses
  let totalExpenses = 0;
  for (const amount of categoryMap.values()) {
    totalExpenses += amount;
  }

  // If total is 0, return empty array (avoid division by zero)
  if (totalExpenses === 0) {
    return [];
  }

  // Calculate percentage for each category
  const allCategories: CategoryDistribution[] = [];
  for (const [category, amount] of categoryMap.entries()) {
    const percentage = (amount / totalExpenses) * 100;
    allCategories.push({ category, amount, percentage });
  }

  // Separate categories >= 5% and < 5%
  const mainCategories: CategoryDistribution[] = [];
  let otrosAmount = 0;
  let otrosPercentage = 0;

  for (const item of allCategories) {
    if (item.percentage >= 5) {
      mainCategories.push({
        category: item.category,
        amount: Math.round(item.amount * 100) / 100,
        percentage: Math.round(item.percentage * 10) / 10,
      });
    } else {
      otrosAmount += item.amount;
      otrosPercentage += item.percentage;
    }
  }

  // Add "Otros" group if there are small categories
  if (otrosAmount > 0) {
    mainCategories.push({
      category: 'Otros',
      amount: Math.round(otrosAmount * 100) / 100,
      percentage: Math.round(otrosPercentage * 10) / 10,
    });
  }

  // Adjust percentages to sum exactly 100%
  const currentSum = mainCategories.reduce((sum, item) => sum + item.percentage, 0);
  const drift = Math.round((100 - currentSum) * 10) / 10;

  if (drift !== 0 && mainCategories.length > 0) {
    // Find the "Otros" category to adjust, or the last item
    const otrosIndex = mainCategories.findIndex(item => item.category === 'Otros');
    const adjustIndex = otrosIndex >= 0 ? otrosIndex : mainCategories.length - 1;
    mainCategories[adjustIndex].percentage = Math.round((mainCategories[adjustIndex].percentage + drift) * 10) / 10;
  }

  return mainCategories;
}
