import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { applyCascadeDeactivation, CatalogItem } from './cascade-deactivation';

/**
 * Property-based tests for cascade deactivation logic.
 * Property 23: Cascade Deactivation
 *
 * For any category with N active associated concepts, deactivating the category
 * SHALL result in the category being inactive AND all N associated concepts
 * also becoming inactive.
 *
 * **Validates: Requirements 11.8**
 */

// Arbitrary for generating a catalog item (category)
const categoryArb = fc.record({
  id: fc.uuid(),
  isActive: fc.boolean(),
});

// Arbitrary for generating a concept linked to a specific category
function conceptArb(categoryId: string): fc.Arbitrary<CatalogItem> {
  return fc.record({
    id: fc.uuid(),
    categoryId: fc.constant(categoryId),
    isActive: fc.boolean(),
  });
}

// Arbitrary for generating a concept linked to a random (other) category
const unrelatedConceptArb = fc.record({
  id: fc.uuid(),
  categoryId: fc.uuid(),
  isActive: fc.boolean(),
});

// Generate a test scenario: a target category, some related concepts, and unrelated concepts
const scenarioArb = fc.uuid().chain((targetCategoryId) =>
  fc.tuple(
    fc.constant(targetCategoryId),
    // Other categories (0 to 5)
    fc.array(categoryArb, { minLength: 0, maxLength: 5 }),
    // Concepts associated with the target category (0 to 10)
    fc.array(conceptArb(targetCategoryId), { minLength: 0, maxLength: 10 }),
    // Concepts associated with other categories (0 to 10)
    fc.array(unrelatedConceptArb, { minLength: 0, maxLength: 10 }),
    // Target category isActive state
    fc.boolean()
  )
);

describe('Property 23: Cascade Deactivation', () => {
  it('after cascade deactivation, the target category has isActive=false', () => {
    fc.assert(
      fc.property(
        scenarioArb,
        ([targetCategoryId, otherCategories, relatedConcepts, unrelatedConcepts, targetIsActive]) => {
          const targetCategory: CatalogItem = {
            id: targetCategoryId,
            isActive: targetIsActive,
          };
          const allCategories = [targetCategory, ...otherCategories];
          const allConcepts = [...relatedConcepts, ...unrelatedConcepts];

          const result = applyCascadeDeactivation(
            targetCategoryId,
            allCategories,
            allConcepts
          );

          // The target category must be inactive after cascade deactivation
          const targetInResult = result.categories.find((c) => c.id === targetCategoryId);
          expect(targetInResult).toBeDefined();
          expect(targetInResult!.isActive).toBe(false);
        }
      )
    );
  });

  it('after cascade deactivation, ALL concepts with matching categoryId have isActive=false', () => {
    fc.assert(
      fc.property(
        scenarioArb,
        ([targetCategoryId, otherCategories, relatedConcepts, unrelatedConcepts, targetIsActive]) => {
          const targetCategory: CatalogItem = {
            id: targetCategoryId,
            isActive: targetIsActive,
          };
          const allCategories = [targetCategory, ...otherCategories];
          const allConcepts = [...relatedConcepts, ...unrelatedConcepts];

          const result = applyCascadeDeactivation(
            targetCategoryId,
            allCategories,
            allConcepts
          );

          // All concepts belonging to the target category must be inactive
          const conceptsForTarget = result.concepts.filter(
            (c) => c.categoryId === targetCategoryId
          );
          for (const concept of conceptsForTarget) {
            expect(concept.isActive).toBe(false);
          }
        }
      )
    );
  });

  it('cascadedCount equals the number of previously-active concepts for that category', () => {
    fc.assert(
      fc.property(
        scenarioArb,
        ([targetCategoryId, otherCategories, relatedConcepts, unrelatedConcepts, targetIsActive]) => {
          const targetCategory: CatalogItem = {
            id: targetCategoryId,
            isActive: targetIsActive,
          };
          const allCategories = [targetCategory, ...otherCategories];
          const allConcepts = [...relatedConcepts, ...unrelatedConcepts];

          // Count concepts that were active BEFORE deactivation
          const previouslyActiveCount = allConcepts.filter(
            (c) => c.categoryId === targetCategoryId && c.isActive === true
          ).length;

          const result = applyCascadeDeactivation(
            targetCategoryId,
            allCategories,
            allConcepts
          );

          expect(result.cascadedCount).toBe(previouslyActiveCount);
        }
      )
    );
  });

  it('concepts belonging to other categories are unchanged', () => {
    fc.assert(
      fc.property(
        scenarioArb,
        ([targetCategoryId, otherCategories, relatedConcepts, unrelatedConcepts, targetIsActive]) => {
          const targetCategory: CatalogItem = {
            id: targetCategoryId,
            isActive: targetIsActive,
          };
          const allCategories = [targetCategory, ...otherCategories];
          const allConcepts = [...relatedConcepts, ...unrelatedConcepts];

          // Filter out concepts that DON'T belong to the target category before deactivation
          // Need to ensure unrelated concepts don't accidentally have the target category ID
          const unrelatedBefore = allConcepts.filter(
            (c) => c.categoryId !== targetCategoryId
          );

          const result = applyCascadeDeactivation(
            targetCategoryId,
            allCategories,
            allConcepts
          );

          const unrelatedAfter = result.concepts.filter(
            (c) => c.categoryId !== targetCategoryId
          );

          // Same count
          expect(unrelatedAfter.length).toBe(unrelatedBefore.length);

          // Each unrelated concept should have the exact same isActive state as before
          for (let i = 0; i < unrelatedBefore.length; i++) {
            const before = unrelatedBefore[i];
            const after = unrelatedAfter.find((c) => c.id === before.id);
            expect(after).toBeDefined();
            expect(after!.isActive).toBe(before.isActive);
            expect(after!.categoryId).toBe(before.categoryId);
          }
        }
      )
    );
  });
});
