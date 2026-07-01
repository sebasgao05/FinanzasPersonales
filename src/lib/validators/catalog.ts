/**
 * Catalog validator module.
 * Validates catalog item names and protects base items from deletion/deactivation.
 *
 * Requirements:
 * - 11.3: Category name max 50 chars, unique within same type
 * - 11.4: Concept name max 50 chars, unique within same category
 * - 11.9: Name cannot be empty or only whitespace
 * - 11.2: Base items cannot be deleted/deactivated
 */

export interface CatalogValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Maximum allowed length for catalog item names.
 */
const MAX_NAME_LENGTH = 50;

/**
 * Validates a catalog item name against all naming rules:
 * - Cannot be empty or only whitespace
 * - Maximum 50 characters
 * - Must be unique within existingNames (case-insensitive comparison)
 *
 * @param name - The name to validate
 * @param existingNames - Array of existing names for uniqueness check
 * @returns Validation result with isValid flag and error messages
 */
export function validateCatalogName(
  name: string,
  existingNames: string[]
): CatalogValidationResult {
  const errors: string[] = [];

  // Rule 1: Name cannot be empty or only whitespace (Req 11.9)
  if (!name || name.trim().length === 0) {
    errors.push('El nombre es obligatorio');
  }

  // Rule 2: Name cannot exceed 50 characters (Req 11.3, 11.4)
  if (name && name.length > MAX_NAME_LENGTH) {
    errors.push(`El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`);
  }

  // Rule 3: Name must be unique (case-insensitive) within same type/category (Req 11.3, 11.4)
  if (name && name.trim().length > 0) {
    const normalizedName = name.trim().toLowerCase();
    const isDuplicate = existingNames.some(
      (existing) => existing.trim().toLowerCase() === normalizedName
    );
    if (isDuplicate) {
      errors.push('Ya existe un elemento con este nombre');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates whether a catalog item can be deleted or deactivated.
 * Base items (isBase === true) cannot be deleted or deactivated.
 *
 * @param item - The catalog item to check, must have isBase property
 * @returns Validation result indicating if the operation is allowed
 */
export function canDeleteOrDeactivate(item: { isBase: boolean }): CatalogValidationResult {
  if (item.isBase) {
    return {
      isValid: false,
      errors: ['Los elementos base no pueden ser eliminados o desactivados'],
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}
