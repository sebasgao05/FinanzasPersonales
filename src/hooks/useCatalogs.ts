import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { validateCatalogName, canDeleteOrDeactivate } from '@/lib/validators/catalog';
import { BASE_MONTHS, BASE_CURRENCIES } from '@/lib/utils/constants';

/**
 * Catalog item shape used across the hook.
 * Matches the CatalogItem interface from the filtering module.
 */
export interface CatalogItem {
  id: string;
  name: string;
  type?: 'Ingreso' | 'Egreso';
  categoryId?: string;
  isActive: boolean;
  isBase: boolean;
}

export interface UseCatalogsReturn {
  categories: CatalogItem[];
  concepts: CatalogItem[];
  months: CatalogItem[];
  years: CatalogItem[];
  currencies: CatalogItem[];
  isLoading: boolean;
  addCategory: (name: string, type: 'Ingreso' | 'Egreso') => Promise<void>;
  addConcept: (name: string, categoryId: string) => Promise<void>;
  editItem: (id: string, newName: string, collection: 'categories' | 'concepts') => Promise<void>;
  deleteOrDeactivate: (
    id: string,
    collection: 'categories' | 'concepts',
    isInUse: boolean
  ) => Promise<{ deactivated: boolean; cascadedCount?: number }>;
  addYear: (year: number) => Promise<void>;
  addCurrency: (code: string) => Promise<void>;
}

// --- Mock data layer ---
// Simulates Amplify Data client for Category/Concept entities.
// Stores data per user in memory (resets on page reload).

interface CatalogStore {
  categories: CatalogItem[];
  concepts: CatalogItem[];
  years: CatalogItem[];
  currencies: CatalogItem[];
}

const catalogStore: Record<string, CatalogStore> = {};

function getStore(userId: string): CatalogStore {
  if (!catalogStore[userId]) {
    catalogStore[userId] = {
      categories: [],
      concepts: [],
      years: [],
      currencies: buildBaseCurrencies(),
    };
  }
  return catalogStore[userId];
}

function buildBaseCurrencies(): CatalogItem[] {
  return BASE_CURRENCIES.map((code) => ({
    id: `currency-base-${code.toLowerCase()}`,
    name: code,
    isActive: true,
    isBase: true,
  }));
}

function buildBaseMonths(): CatalogItem[] {
  return BASE_MONTHS.map((month, index) => ({
    id: `month-base-${index + 1}`,
    name: month,
    isActive: true,
    isBase: true,
  }));
}

async function loadCatalogs(userId: string): Promise<CatalogStore> {
  // Simulate async API call
  await new Promise((resolve) => setTimeout(resolve, 50));
  return getStore(userId);
}

async function persistStore(userId: string, store: CatalogStore): Promise<void> {
  // Simulate async API call
  await new Promise((resolve) => setTimeout(resolve, 50));
  catalogStore[userId] = { ...store };
}

// --- End mock data layer ---

let idCounter = 0;
function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/**
 * Hook for managing catalog data (categories, concepts, months, years, currencies).
 *
 * Behavior:
 * - Initializes with base items (types, months, currencies) marked as isBase: true
 * - Categories and concepts start empty (user creates them)
 * - deleteOrDeactivate: if isInUse, deactivate (set isActive=false); if not in use, delete permanently
 * - When deactivating a category, also deactivate all its concepts (cascade, Req 11.8)
 * - Deactivated items excluded from form dropdowns (isActive filter in filterCategoriesByType/filterConceptsByCategory)
 *
 * Requirements: 11.1, 11.5, 11.6, 11.7, 11.8
 */
export function useCatalogs(): UseCatalogsReturn {
  const { user, isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [concepts, setConcepts] = useState<CatalogItem[]>([]);
  const [years, setYears] = useState<CatalogItem[]>([]);
  const [currencies, setCurrencies] = useState<CatalogItem[]>(buildBaseCurrencies());
  const [isLoading, setIsLoading] = useState(true);

  // Months are always the base 12 months (non-editable)
  const months: CatalogItem[] = buildBaseMonths();

  // Load catalogs when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const userId = user.userId;

    async function init() {
      setIsLoading(true);
      try {
        const store = await loadCatalogs(userId);
        if (cancelled) return;

        setCategories(store.categories);
        setConcepts(store.concepts);
        setYears(store.years);
        setCurrencies(store.currencies);
      } catch {
        // Keep current state on error
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  /**
   * Adds a new category associated with a type (Ingreso/Egreso).
   * Validates name uniqueness within the same type.
   * Requirement: 11.1, 11.3
   */
  const addCategory = useCallback(
    async (name: string, type: 'Ingreso' | 'Egreso') => {
      if (!user) return;

      // Validate name against existing categories of the same type
      const existingNamesForType = categories
        .filter((c) => c.type === type)
        .map((c) => c.name);

      const validation = validateCatalogName(name, existingNamesForType);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }

      const newCategory: CatalogItem = {
        id: generateId('cat'),
        name: name.trim(),
        type,
        isActive: true,
        isBase: false,
      };

      const updated = [...categories, newCategory];
      setCategories(updated);

      // Persist
      const userId = user.userId;
      const store = getStore(userId);
      store.categories = updated;
      await persistStore(userId, store);
    },
    [user, categories]
  );

  /**
   * Adds a new concept associated with a category.
   * Validates name uniqueness within the same category.
   * Requirement: 11.1, 11.4
   */
  const addConcept = useCallback(
    async (name: string, categoryId: string) => {
      if (!user) return;

      // Validate name against existing concepts of the same category
      const existingNamesForCategory = concepts
        .filter((c) => c.categoryId === categoryId)
        .map((c) => c.name);

      const validation = validateCatalogName(name, existingNamesForCategory);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }

      const newConcept: CatalogItem = {
        id: generateId('con'),
        name: name.trim(),
        categoryId,
        isActive: true,
        isBase: false,
      };

      const updated = [...concepts, newConcept];
      setConcepts(updated);

      // Persist
      const userId = user.userId;
      const store = getStore(userId);
      store.concepts = updated;
      await persistStore(userId, store);
    },
    [user, concepts]
  );

  /**
   * Edits the name of an existing catalog item (category or concept).
   * Validates name uniqueness within the same scope.
   * Requirement: 11.1
   */
  const editItem = useCallback(
    async (id: string, newName: string, collection: 'categories' | 'concepts') => {
      if (!user) return;

      if (collection === 'categories') {
        const item = categories.find((c) => c.id === id);
        if (!item) return;

        // Validate name uniqueness within same type, excluding current item
        const existingNames = categories
          .filter((c) => c.type === item.type && c.id !== id)
          .map((c) => c.name);

        const validation = validateCatalogName(newName, existingNames);
        if (!validation.isValid) {
          throw new Error(validation.errors.join('. '));
        }

        const updated = categories.map((c) =>
          c.id === id ? { ...c, name: newName.trim() } : c
        );
        setCategories(updated);

        const userId = user.userId;
        const store = getStore(userId);
        store.categories = updated;
        await persistStore(userId, store);
      } else {
        const item = concepts.find((c) => c.id === id);
        if (!item) return;

        // Validate name uniqueness within same category, excluding current item
        const existingNames = concepts
          .filter((c) => c.categoryId === item.categoryId && c.id !== id)
          .map((c) => c.name);

        const validation = validateCatalogName(newName, existingNames);
        if (!validation.isValid) {
          throw new Error(validation.errors.join('. '));
        }

        const updated = concepts.map((c) =>
          c.id === id ? { ...c, name: newName.trim() } : c
        );
        setConcepts(updated);

        const userId = user.userId;
        const store = getStore(userId);
        store.concepts = updated;
        await persistStore(userId, store);
      }
    },
    [user, categories, concepts]
  );

  /**
   * Deletes or deactivates a catalog item depending on usage.
   *
   * - If isInUse is true: deactivate (set isActive=false) instead of deleting (Req 11.5)
   * - If isInUse is false: delete permanently (Req 11.7)
   * - When deactivating a category, also deactivate all its associated concepts (Req 11.8)
   * - Base items cannot be deleted or deactivated (Req 11.2)
   *
   * @returns Object indicating whether item was deactivated and how many cascaded items were affected
   */
  const deleteOrDeactivate = useCallback(
    async (
      id: string,
      collection: 'categories' | 'concepts',
      isInUse: boolean
    ): Promise<{ deactivated: boolean; cascadedCount?: number }> => {
      if (!user) return { deactivated: false };

      const userId = user.userId;

      if (collection === 'categories') {
        const item = categories.find((c) => c.id === id);
        if (!item) return { deactivated: false };

        // Check if base item (Req 11.2)
        const canModify = canDeleteOrDeactivate(item);
        if (!canModify.isValid) {
          throw new Error(canModify.errors.join('. '));
        }

        if (isInUse) {
          // Deactivate category (Req 11.5)
          const updatedCategories = categories.map((c) =>
            c.id === id ? { ...c, isActive: false } : c
          );

          // Cascade deactivation to associated concepts (Req 11.8)
          const associatedConcepts = concepts.filter(
            (c) => c.categoryId === id && c.isActive === true
          );
          const cascadedCount = associatedConcepts.length;

          const updatedConcepts = concepts.map((c) =>
            c.categoryId === id ? { ...c, isActive: false } : c
          );

          setCategories(updatedCategories);
          setConcepts(updatedConcepts);

          const store = getStore(userId);
          store.categories = updatedCategories;
          store.concepts = updatedConcepts;
          await persistStore(userId, store);

          return { deactivated: true, cascadedCount };
        } else {
          // Delete permanently (Req 11.7)
          // Also delete associated concepts
          const cascadedCount = concepts.filter((c) => c.categoryId === id).length;
          const updatedCategories = categories.filter((c) => c.id !== id);
          const updatedConcepts = concepts.filter((c) => c.categoryId !== id);

          setCategories(updatedCategories);
          setConcepts(updatedConcepts);

          const store = getStore(userId);
          store.categories = updatedCategories;
          store.concepts = updatedConcepts;
          await persistStore(userId, store);

          return { deactivated: false, cascadedCount };
        }
      } else {
        // concepts collection
        const item = concepts.find((c) => c.id === id);
        if (!item) return { deactivated: false };

        // Check if base item (Req 11.2)
        const canModify = canDeleteOrDeactivate(item);
        if (!canModify.isValid) {
          throw new Error(canModify.errors.join('. '));
        }

        if (isInUse) {
          // Deactivate concept (Req 11.5)
          const updatedConcepts = concepts.map((c) =>
            c.id === id ? { ...c, isActive: false } : c
          );
          setConcepts(updatedConcepts);

          const store = getStore(userId);
          store.concepts = updatedConcepts;
          await persistStore(userId, store);

          return { deactivated: true };
        } else {
          // Delete permanently (Req 11.7)
          const updatedConcepts = concepts.filter((c) => c.id !== id);
          setConcepts(updatedConcepts);

          const store = getStore(userId);
          store.concepts = updatedConcepts;
          await persistStore(userId, store);

          return { deactivated: false };
        }
      }
    },
    [user, categories, concepts]
  );

  /**
   * Adds a new year to the catalog.
   * Years are user-created and not base items.
   */
  const addYear = useCallback(
    async (year: number) => {
      if (!user) return;

      // Check if year already exists
      const exists = years.some((y) => y.name === String(year));
      if (exists) {
        throw new Error('Este año ya existe en el catálogo');
      }

      const newYear: CatalogItem = {
        id: generateId('year'),
        name: String(year),
        isActive: true,
        isBase: false,
      };

      const updated = [...years, newYear];
      setYears(updated);

      const userId = user.userId;
      const store = getStore(userId);
      store.years = updated;
      await persistStore(userId, store);
    },
    [user, years]
  );

  /**
   * Adds a new currency to the catalog.
   * Base currencies (COP, USD, EUR) are already included.
   */
  const addCurrency = useCallback(
    async (code: string) => {
      if (!user) return;

      const trimmedCode = code.trim().toUpperCase();

      // Check if currency already exists
      const exists = currencies.some(
        (c) => c.name.toUpperCase() === trimmedCode
      );
      if (exists) {
        throw new Error('Esta moneda ya existe en el catálogo');
      }

      if (!trimmedCode || trimmedCode.length === 0) {
        throw new Error('El código de moneda es obligatorio');
      }

      const newCurrency: CatalogItem = {
        id: generateId('curr'),
        name: trimmedCode,
        isActive: true,
        isBase: false,
      };

      const updated = [...currencies, newCurrency];
      setCurrencies(updated);

      const userId = user.userId;
      const store = getStore(userId);
      store.currencies = updated;
      await persistStore(userId, store);
    },
    [user, currencies]
  );

  return {
    categories,
    concepts,
    months,
    years,
    currencies,
    isLoading,
    addCategory,
    addConcept,
    editItem,
    deleteOrDeactivate,
    addYear,
    addCurrency,
  };
}
