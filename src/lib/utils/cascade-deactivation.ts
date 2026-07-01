/**
 * Pure function that encapsulates cascade deactivation logic.
 *
 * When a category is deactivated, all its associated concepts must
 * also become inactive. This function applies that transformation
 * to in-memory arrays without side effects.
 *
 * Requirement: 11.8
 */

export interface CatalogItem {
  id: string;
  categoryId?: string;
  isActive: boolean;
}

export interface CascadeDeactivationResult {
  categories: CatalogItem[];
  concepts: CatalogItem[];
  cascadedCount: number;
}

/**
 * Applies cascade deactivation: deactivates the target category
 * and all concepts that belong to it.
 * Returns the updated arrays and the count of previously-active concepts
 * that were cascaded (set to inactive).
 *
 * @param categoryId - The ID of the category to deactivate
 * @param categories - Array of all categories
 * @param concepts - Array of all concepts
 * @returns Updated categories, concepts, and the number of cascaded concepts
 */
export function applyCascadeDeactivation(
  categoryId: string,
  categories: CatalogItem[],
  concepts: CatalogItem[]
): CascadeDeactivationResult {
  // Deactivate the target category
  const updatedCategories = categories.map((cat) =>
    cat.id === categoryId ? { ...cat, isActive: false } : cat
  );

  // Count previously-active concepts that belong to this category
  const cascadedCount = concepts.filter(
    (c) => c.categoryId === categoryId && c.isActive === true
  ).length;

  // Deactivate all concepts belonging to this category
  const updatedConcepts = concepts.map((concept) =>
    concept.categoryId === categoryId
      ? { ...concept, isActive: false }
      : concept
  );

  return {
    categories: updatedCategories,
    concepts: updatedConcepts,
    cascadedCount,
  };
}
