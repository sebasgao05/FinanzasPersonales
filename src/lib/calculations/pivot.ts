import type { CalculationTransaction } from './types';
import { sanitizeAmount, executionPercentage } from './engine';

export interface PivotRow {
  dimensions: Record<string, string>;
  budgetTotal: number;
  amountTotal: number;
  executionPercentage: number;
}

export type PivotDimension = 'month' | 'year' | 'type' | 'category' | 'concept';

/**
 * Generates a unique key for a group based on the dimension values.
 */
function getDimensionKey(
  transaction: CalculationTransaction,
  dimensions: PivotDimension[]
): string {
  return dimensions
    .map((dim) => {
      switch (dim) {
        case 'month':
          return transaction.month ?? '';
        case 'year':
          return String(transaction.year ?? '');
        case 'type':
          return transaction.type;
        case 'category':
          return transaction.category ?? '';
        case 'concept':
          return transaction.concept ?? '';
      }
    })
    .join('|||');
}

/**
 * Extracts dimension values from a transaction for the given dimensions.
 */
function extractDimensions(
  transaction: CalculationTransaction,
  dimensions: PivotDimension[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const dim of dimensions) {
    switch (dim) {
      case 'month':
        result['month'] = transaction.month ?? '';
        break;
      case 'year':
        result['year'] = String(transaction.year ?? '');
        break;
      case 'type':
        result['type'] = transaction.type;
        break;
      case 'category':
        result['category'] = transaction.category ?? '';
        break;
      case 'concept':
        result['concept'] = transaction.concept ?? '';
        break;
    }
  }
  return result;
}

/**
 * Aggregates transactions by specified dimensions.
 * For each group, computes sum of budgets, sum of amounts, and execution percentage.
 *
 * - budgetTotal = sum of sanitized budget values (undefined treated as 0)
 * - amountTotal = sum of sanitized amount values
 * - executionPercentage = executionPercentage(budgetTotal, amountTotal) from engine.ts
 *
 * Returns empty array for empty input.
 */
export function pivotAggregate(
  transactions: CalculationTransaction[],
  dimensions: PivotDimension[]
): PivotRow[] {
  if (transactions.length === 0) {
    return [];
  }

  const groups = new Map<
    string,
    { dimensions: Record<string, string>; budgetSum: number; amountSum: number }
  >();

  for (const tx of transactions) {
    const key = getDimensionKey(tx, dimensions);

    if (!groups.has(key)) {
      groups.set(key, {
        dimensions: extractDimensions(tx, dimensions),
        budgetSum: 0,
        amountSum: 0,
      });
    }

    const group = groups.get(key)!;
    group.budgetSum += sanitizeAmount(tx.budget);
    group.amountSum += sanitizeAmount(tx.amount);
  }

  const rows: PivotRow[] = [];
  for (const group of groups.values()) {
    rows.push({
      dimensions: group.dimensions,
      budgetTotal: group.budgetSum,
      amountTotal: group.amountSum,
      executionPercentage: executionPercentage(group.budgetSum, group.amountSum),
    });
  }

  return rows;
}
