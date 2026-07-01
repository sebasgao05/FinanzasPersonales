import { BASE_MONTHS } from './constants';

/**
 * Extracts the Spanish month name from a date string.
 * Uses the month index (0-based) from the parsed date to look up the
 * corresponding name in BASE_MONTHS.
 *
 * @param dateStr - A date string in ISO format (e.g., "2024-03-15")
 * @returns The Spanish month name (e.g., "Marzo")
 *
 * @example
 * extractMonth("2024-03-15") // → "Marzo"
 * extractMonth("2024-12-01") // → "Diciembre"
 */
export function extractMonth(dateStr: string): string {
  const parts = dateStr.split('-');
  const monthIndex = parseInt(parts[1], 10) - 1;
  return BASE_MONTHS[monthIndex];
}

/**
 * Extracts the year from a date string.
 *
 * @param dateStr - A date string in ISO format (e.g., "2024-03-15")
 * @returns The year as a number (e.g., 2024)
 *
 * @example
 * extractYear("2024-03-15") // → 2024
 * extractYear("2023-01-01") // → 2023
 */
export function extractYear(dateStr: string): number {
  const parts = dateStr.split('-');
  return parseInt(parts[0], 10);
}
