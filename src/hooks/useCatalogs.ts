import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { validateCatalogName, canDeleteOrDeactivate } from '@/lib/validators/catalog';
import { BASE_MONTHS, BASE_CURRENCIES } from '@/lib/utils/constants';
import { client } from '@/lib/amplify-client';

/**
 * Catalog item shape used across the hook.
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

function buildBaseMonths(): CatalogItem[] {
  return BASE_MONTHS.map((month, index) => ({
    id: `month-base-${index + 1}`,
    name: month,
    isActive: true,
    isBase: true,
  }));
}

function buildBaseCurrencies(): CatalogItem[] {
  return BASE_CURRENCIES.map((code) => ({
    id: `currency-base-${code.toLowerCase()}`,
    name: code,
    isActive: true,
    isBase: true,
  }));
}

/**
 * Hook for managing catalog data (categories, concepts) connected to Amplify Data.
 * Months and currencies are managed locally (base items).
 * Years are derived from the current year range.
 */
export function useCatalogs(): UseCatalogsReturn {
  const { user, isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [concepts, setConcepts] = useState<CatalogItem[]>([]);
  const [years, setYears] = useState<CatalogItem[]>([]);
  const [currencies, setCurrencies] = useState<CatalogItem[]>(() => {
    // Load custom currencies from localStorage
    try {
      const saved = localStorage.getItem('custom_currencies');
      if (saved) {
        const custom: CatalogItem[] = JSON.parse(saved);
        return [...buildBaseCurrencies(), ...custom];
      }
    } catch { /* ignore */ }
    return buildBaseCurrencies();
  });
  const [isLoading, setIsLoading] = useState(true);

  const months: CatalogItem[] = buildBaseMonths();

  // Load catalogs from Amplify
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        const [catResult, conResult] = await Promise.all([
          client.models.Category.list({ limit: 500 }),
          client.models.Concept.list({ limit: 2000 }),
        ]);

        if (cancelled) return;

        const cats: CatalogItem[] = (catResult.data ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type as 'Ingreso' | 'Egreso' | undefined,
          isActive: c.isActive,
          isBase: c.isBase,
        }));

        const cons: CatalogItem[] = (conResult.data ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          categoryId: c.categoryId,
          isActive: c.isActive,
          isBase: c.isBase,
        }));

        setCategories(cats);
        setConcepts(cons);

        // Generate years: current year ± 2
        const currentYear = new Date().getFullYear();
        const yearItems: CatalogItem[] = [];
        for (let y = currentYear - 2; y <= currentYear + 1; y++) {
          yearItems.push({
            id: `year-${y}`,
            name: String(y),
            isActive: true,
            isBase: y === currentYear,
          });
        }

        // Load custom years from localStorage
        try {
          const savedYears = localStorage.getItem('custom_years');
          if (savedYears) {
            const custom: CatalogItem[] = JSON.parse(savedYears);
            for (const cy of custom) {
              if (!yearItems.some((y) => y.name === cy.name)) {
                yearItems.push(cy);
              }
            }
          }
        } catch { /* ignore */ }

        setYears(yearItems);
      } catch (err) {
        console.error('Error loading catalogs:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const addCategory = useCallback(
    async (name: string, type: 'Ingreso' | 'Egreso') => {
      const existingNamesForType = categories
        .filter((c) => c.type === type)
        .map((c) => c.name);

      const validation = validateCatalogName(name, existingNamesForType);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }

      const { data: created } = await client.models.Category.create({
        name: name.trim(),
        type,
        isActive: true,
        isBase: false,
      });

      if (created) {
        const newCat: CatalogItem = {
          id: created.id,
          name: created.name,
          type: created.type as 'Ingreso' | 'Egreso',
          isActive: created.isActive,
          isBase: created.isBase,
        };
        setCategories((prev) => [...prev, newCat]);
      }
    },
    [categories]
  );

  const addConcept = useCallback(
    async (name: string, categoryId: string) => {
      const existingNamesForCategory = concepts
        .filter((c) => c.categoryId === categoryId)
        .map((c) => c.name);

      const validation = validateCatalogName(name, existingNamesForCategory);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }

      const { data: created } = await client.models.Concept.create({
        name: name.trim(),
        categoryId,
        isActive: true,
        isBase: false,
      });

      if (created) {
        const newCon: CatalogItem = {
          id: created.id,
          name: created.name,
          categoryId: created.categoryId,
          isActive: created.isActive,
          isBase: created.isBase,
        };
        setConcepts((prev) => [...prev, newCon]);
      }
    },
    [concepts]
  );

  const editItem = useCallback(
    async (id: string, newName: string, collection: 'categories' | 'concepts') => {
      if (collection === 'categories') {
        const item = categories.find((c) => c.id === id);
        if (!item) return;

        const existingNames = categories
          .filter((c) => c.type === item.type && c.id !== id)
          .map((c) => c.name);

        const validation = validateCatalogName(newName, existingNames);
        if (!validation.isValid) {
          throw new Error(validation.errors.join('. '));
        }

        await client.models.Category.update({ id, name: newName.trim() } as any);
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name: newName.trim() } : c))
        );
      } else {
        const item = concepts.find((c) => c.id === id);
        if (!item) return;

        const existingNames = concepts
          .filter((c) => c.categoryId === item.categoryId && c.id !== id)
          .map((c) => c.name);

        const validation = validateCatalogName(newName, existingNames);
        if (!validation.isValid) {
          throw new Error(validation.errors.join('. '));
        }

        await client.models.Concept.update({ id, name: newName.trim() } as any);
        setConcepts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name: newName.trim() } : c))
        );
      }
    },
    [categories, concepts]
  );

  const deleteOrDeactivate = useCallback(
    async (
      id: string,
      collection: 'categories' | 'concepts',
      isInUse: boolean
    ): Promise<{ deactivated: boolean; cascadedCount?: number }> => {
      if (collection === 'categories') {
        const item = categories.find((c) => c.id === id);
        if (!item) return { deactivated: false };

        const canModify = canDeleteOrDeactivate(item);
        if (!canModify.isValid) {
          throw new Error(canModify.errors.join('. '));
        }

        if (isInUse) {
          // Deactivate category + cascade to concepts
          await client.models.Category.update({ id, isActive: false } as any);

          const associatedConcepts = concepts.filter(
            (c) => c.categoryId === id && c.isActive
          );
          const cascadedCount = associatedConcepts.length;

          // Deactivate associated concepts
          await Promise.all(
            associatedConcepts.map((c) =>
              client.models.Concept.update({ id: c.id, isActive: false } as any)
            )
          );

          setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isActive: false } : c))
          );
          setConcepts((prev) =>
            prev.map((c) => (c.categoryId === id ? { ...c, isActive: false } : c))
          );

          return { deactivated: true, cascadedCount };
        } else {
          // Delete permanently + associated concepts
          const associatedConcepts = concepts.filter((c) => c.categoryId === id);
          const cascadedCount = associatedConcepts.length;

          await Promise.all(
            associatedConcepts.map((c) => client.models.Concept.delete({ id: c.id }))
          );
          await client.models.Category.delete({ id });

          setCategories((prev) => prev.filter((c) => c.id !== id));
          setConcepts((prev) => prev.filter((c) => c.categoryId !== id));

          return { deactivated: false, cascadedCount };
        }
      } else {
        const item = concepts.find((c) => c.id === id);
        if (!item) return { deactivated: false };

        const canModify = canDeleteOrDeactivate(item);
        if (!canModify.isValid) {
          throw new Error(canModify.errors.join('. '));
        }

        if (isInUse) {
          await client.models.Concept.update({ id, isActive: false } as any);
          setConcepts((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isActive: false } : c))
          );
          return { deactivated: true };
        } else {
          await client.models.Concept.delete({ id });
          setConcepts((prev) => prev.filter((c) => c.id !== id));
          return { deactivated: false };
        }
      }
    },
    [categories, concepts]
  );

  const addYear = useCallback(
    async (year: number) => {
      const exists = years.some((y) => y.name === String(year));
      if (exists) {
        throw new Error('Este año ya existe en el catálogo');
      }

      const newYear: CatalogItem = {
        id: `year-${year}`,
        name: String(year),
        isActive: true,
        isBase: false,
      };

      const updated = [...years, newYear];
      setYears(updated);

      // Persist custom years to localStorage
      const customOnly = updated.filter((y) => !y.isBase);
      localStorage.setItem('custom_years', JSON.stringify(customOnly));
    },
    [years]
  );

  const addCurrency = useCallback(
    async (code: string) => {
      const trimmedCode = code.trim().toUpperCase();
      if (!trimmedCode || trimmedCode.length === 0) {
        throw new Error('El código de moneda es obligatorio');
      }
      const exists = currencies.some((c) => c.name.toUpperCase() === trimmedCode);
      if (exists) {
        throw new Error('Esta moneda ya existe en el catálogo');
      }

      const newCurrency: CatalogItem = {
        id: `currency-custom-${trimmedCode.toLowerCase()}`,
        name: trimmedCode,
        isActive: true,
        isBase: false,
      };

      const updated = [...currencies, newCurrency];
      setCurrencies(updated);

      // Persist custom currencies to localStorage
      const customOnly = updated.filter((c) => !c.isBase);
      localStorage.setItem('custom_currencies', JSON.stringify(customOnly));
    },
    [currencies]
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
