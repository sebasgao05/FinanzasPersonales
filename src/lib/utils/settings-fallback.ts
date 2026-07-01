/**
 * Settings fallback resolution utility.
 * When a configured default value no longer exists in the active catalog,
 * the system resolves to the first active value available.
 * Validates: Requirement 16.4
 */

/**
 * Resolves a default value against a list of active catalog items.
 * If the configured value exists in the active list, returns it.
 * Otherwise, returns the first active value (fallback).
 * If the active catalog is empty, returns the configured value unchanged.
 */
export function resolveWithFallback(
  configuredValue: string,
  activeCatalog: readonly string[]
): string {
  if (activeCatalog.includes(configuredValue)) {
    return configuredValue;
  }
  return activeCatalog.length > 0 ? activeCatalog[0] : configuredValue;
}
