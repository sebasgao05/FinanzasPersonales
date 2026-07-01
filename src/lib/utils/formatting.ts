/**
 * Formats a number as currency with thousands separator and 2 decimal places.
 * Uses comma as thousands separator and dot as decimal separator.
 *
 * @param value - The numeric value to format
 * @returns The formatted string (e.g., "1,234,567.89")
 *
 * @example
 * formatAmount(1234567.89) // → "1,234,567.89"
 * formatAmount(0)          // → "0.00"
 * formatAmount(1000)       // → "1,000.00"
 */
export function formatAmount(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a number as a percentage with 1 decimal place.
 *
 * @param value - The numeric value to format (already in percentage form)
 * @returns The formatted percentage string (e.g., "85.7%")
 *
 * @example
 * formatPercentage(85.7)  // → "85.7%"
 * formatPercentage(100)   // → "100.0%"
 * formatPercentage(0)     // → "0.0%"
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
