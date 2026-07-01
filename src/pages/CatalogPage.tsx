import CatalogManager from '@/components/catalogs/CatalogManager';

export default function CatalogPage() {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-1">Administración de Catálogos</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Administre las listas maestras de tipos, categorías, conceptos, meses, años y monedas.
      </p>
      <CatalogManager />
    </div>
  );
}
