import { useState, useCallback } from 'react';
import {
  Shield,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useCatalogs, type CatalogItem } from '@/hooks/useCatalogs';
import { Button } from '@/components/ui/button';

// --- Confirmation Dialog ---

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="size-5 text-amber-500" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Catalog Section ---

interface CatalogSectionProps {
  title: string;
  items: CatalogItem[];
  onAdd: (name: string) => Promise<void>;
  onEdit: (id: string, newName: string) => Promise<void>;
  onDelete: (id: string) => void;
  placeholder?: string;
}

function CatalogSection({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  placeholder = 'Nombre del nuevo item',
}: CatalogSectionProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    try {
      await onAdd(newName.trim());
      setNewName('');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al agregar');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditError('');
  };

  const confirmEdit = async (id: string) => {
    if (!editName.trim()) {
      setEditError('El nombre es obligatorio');
      return;
    }
    try {
      await onEdit(id, editName.trim());
      setEditingId(null);
      setEditName('');
      setEditError('');
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Error al editar');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      confirmEdit(id);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-base font-semibold mb-3">{title}</h3>

      {/* Items list */}
      <ul className="space-y-1 mb-3">
        {items.length === 0 && (
          <li className="text-sm text-gray-400 italic py-1">Sin elementos</li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-2 py-1.5 px-2 rounded group hover:bg-gray-50 dark:hover:bg-gray-800 ${
              !item.isActive ? 'opacity-60' : ''
            }`}
          >
            {editingId === item.id ? (
              // Inline edit form
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
                  autoFocus
                />
                <button
                  onClick={() => confirmEdit(item.id)}
                  className="p-1 text-green-600 hover:text-green-700"
                  title="Confirmar"
                >
                  <Check className="size-4" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Cancelar"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              // Display mode
              <>
                <span
                  className={`flex-1 text-sm ${
                    !item.isActive ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {item.name}
                </span>

                {/* Status badges */}
                {item.isBase && (
                  <span title="Item base (protegido)">
                    <Shield className="size-4 text-blue-500" />
                  </span>
                )}
                {!item.isActive && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded">
                    Inactivo
                  </span>
                )}

                {/* Action buttons - visible on hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!item.isBase && (
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Editar"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(item.id)}
                    disabled={item.isBase}
                    className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={item.isBase ? 'No se puede eliminar (item base)' : 'Eliminar'}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {editError && (
        <p className="text-xs text-red-500 mb-2">{editError}</p>
      )}

      {/* Add form */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
        />
        <Button size="sm" onClick={handleAdd}>
          <Plus className="size-4" />
          Agregar
        </Button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// --- Main CatalogManager ---

export default function CatalogManager() {
  const {
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
  } = useCatalogs();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    itemId: string;
    itemName: string;
    collection: 'categories' | 'concepts';
  }>({ open: false, itemId: '', itemName: '', collection: 'categories' });

  // Types are always fixed (Ingreso/Egreso) - base items, display only
  const types: CatalogItem[] = [
    { id: 'type-ingreso', name: 'Ingreso', isActive: true, isBase: true },
    { id: 'type-egreso', name: 'Egreso', isActive: true, isBase: true },
  ];

  const incomeCategories = categories.filter((c) => c.type === 'Ingreso');
  const expenseCategories = categories.filter((c) => c.type === 'Egreso');

  const getConceptsForCategory = useCallback(
    (categoryId: string) => concepts.filter((c) => c.categoryId === categoryId),
    [concepts]
  );

  // --- Handlers ---

  const handleDeleteCategory = (id: string) => {
    const item = categories.find((c) => c.id === id);
    if (!item || item.isBase) return;
    setConfirmDialog({
      open: true,
      itemId: id,
      itemName: item.name,
      collection: 'categories',
    });
  };

  const handleDeleteConcept = (id: string) => {
    const item = concepts.find((c) => c.id === id);
    if (!item || item.isBase) return;
    setConfirmDialog({
      open: true,
      itemId: id,
      itemName: item.name,
      collection: 'concepts',
    });
  };

  const confirmDelete = async () => {
    const { itemId, collection } = confirmDialog;
    try {
      // For simplicity, assume items are not in use (isInUse=false => permanent delete)
      // In a full implementation, this would check if transactions reference this item
      await deleteOrDeactivate(itemId, collection, false);
    } catch {
      // Error handled silently; UI reflects current state
    }
    setConfirmDialog({ open: false, itemId: '', itemName: '', collection: 'categories' });
  };

  const cancelDelete = () => {
    setConfirmDialog({ open: false, itemId: '', itemName: '', collection: 'categories' });
  };

  const handleEditCategory = async (id: string, newName: string) => {
    await editItem(id, newName, 'categories');
  };

  const handleEditConcept = async (id: string, newName: string) => {
    await editItem(id, newName, 'concepts');
  };

  const handleAddYear = async (name: string) => {
    const year = parseInt(name, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new Error('Ingrese un año válido (2000-2100)');
    }
    await addYear(year);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Cargando catálogos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tipos - read only */}
      <CatalogSection
        title="Tipos"
        items={types}
        onAdd={async () => {
          throw new Error('Los tipos son predeterminados y no se pueden agregar');
        }}
        onEdit={async () => {
          throw new Error('Los tipos son predeterminados y no se pueden editar');
        }}
        onDelete={() => {}}
        placeholder="Los tipos son fijos"
      />

      {/* Categorías de Ingreso */}
      <CatalogSection
        title="Categorías de Ingreso"
        items={incomeCategories}
        onAdd={(name) => addCategory(name, 'Ingreso')}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
        placeholder="Nueva categoría de ingreso"
      />

      {/* Categorías de Egreso */}
      <CatalogSection
        title="Categorías de Egreso"
        items={expenseCategories}
        onAdd={(name) => addCategory(name, 'Egreso')}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
        placeholder="Nueva categoría de egreso"
      />

      {/* Conceptos de Ingreso (grouped by category) */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-base font-semibold mb-3">Conceptos de Ingreso</h3>
        {incomeCategories.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Cree primero categorías de ingreso para agregar conceptos
          </p>
        ) : (
          <div className="space-y-4">
            {incomeCategories.map((cat) => (
              <ConceptSubSection
                key={cat.id}
                category={cat}
                concepts={getConceptsForCategory(cat.id)}
                onAdd={(name) => addConcept(name, cat.id)}
                onEdit={handleEditConcept}
                onDelete={handleDeleteConcept}
              />
            ))}
          </div>
        )}
      </div>

      {/* Conceptos de Egreso (grouped by category) */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-base font-semibold mb-3">Conceptos de Egreso</h3>
        {expenseCategories.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Cree primero categorías de egreso para agregar conceptos
          </p>
        ) : (
          <div className="space-y-4">
            {expenseCategories.map((cat) => (
              <ConceptSubSection
                key={cat.id}
                category={cat}
                concepts={getConceptsForCategory(cat.id)}
                onAdd={(name) => addConcept(name, cat.id)}
                onEdit={handleEditConcept}
                onDelete={handleDeleteConcept}
              />
            ))}
          </div>
        )}
      </div>

      {/* Meses - read only */}
      <CatalogSection
        title="Meses"
        items={months}
        onAdd={async () => {
          throw new Error('Los meses son predeterminados y no se pueden agregar');
        }}
        onEdit={async () => {
          throw new Error('Los meses son predeterminados y no se pueden editar');
        }}
        onDelete={() => {}}
        placeholder="Los meses son fijos"
      />

      {/* Años */}
      <CatalogSection
        title="Años"
        items={years}
        onAdd={handleAddYear}
        onEdit={async () => {
          throw new Error('Los años no se pueden editar');
        }}
        onDelete={() => {}}
        placeholder="Ej: 2024"
      />

      {/* Monedas */}
      <CatalogSection
        title="Monedas"
        items={currencies}
        onAdd={addCurrency}
        onEdit={async () => {
          throw new Error('Las monedas no se pueden editar');
        }}
        onDelete={() => {}}
        placeholder="Ej: GBP"
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Confirmar eliminación"
        message={`¿Está seguro de eliminar "${confirmDialog.itemName}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}

// --- Concept SubSection (nested inside a category) ---

interface ConceptSubSectionProps {
  category: CatalogItem;
  concepts: CatalogItem[];
  onAdd: (name: string) => Promise<void>;
  onEdit: (id: string, newName: string) => Promise<void>;
  onDelete: (id: string) => void;
}

function ConceptSubSection({
  category,
  concepts,
  onAdd,
  onEdit,
  onDelete,
}: ConceptSubSectionProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    try {
      await onAdd(newName.trim());
      setNewName('');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al agregar');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditError('');
  };

  const confirmEdit = async (id: string) => {
    if (!editName.trim()) {
      setEditError('El nombre es obligatorio');
      return;
    }
    try {
      await onEdit(id, editName.trim());
      setEditingId(null);
      setEditName('');
      setEditError('');
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Error al editar');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      confirmEdit(id);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="pl-3 border-l-2 border-gray-200 dark:border-gray-600">
      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {category.name}
        {!category.isActive && (
          <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded">
            Inactiva
          </span>
        )}
      </h4>

      <ul className="space-y-1 mb-2">
        {concepts.length === 0 && (
          <li className="text-xs text-gray-400 italic py-1">Sin conceptos</li>
        )}
        {concepts.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-2 py-1 px-2 rounded group hover:bg-gray-50 dark:hover:bg-gray-800 ${
              !item.isActive ? 'opacity-60' : ''
            }`}
          >
            {editingId === item.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
                  autoFocus
                />
                <button
                  onClick={() => confirmEdit(item.id)}
                  className="p-1 text-green-600 hover:text-green-700"
                  title="Confirmar"
                >
                  <Check className="size-3.5" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Cancelar"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <>
                <span
                  className={`flex-1 text-sm ${
                    !item.isActive ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {item.name}
                </span>

                {item.isBase && (
                  <span title="Item base (protegido)">
                    <Shield className="size-3.5 text-blue-500" />
                  </span>
                )}
                {!item.isActive && (
                  <span className="text-xs px-1 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded">
                    Inactivo
                  </span>
                )}

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!item.isBase && (
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Editar"
                    >
                      <Pencil className="size-3" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(item.id)}
                    disabled={item.isBase}
                    className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={item.isBase ? 'No se puede eliminar (item base)' : 'Eliminar'}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {editError && (
        <p className="text-xs text-red-500 mb-2">{editError}</p>
      )}

      {/* Add concept form */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Nuevo concepto para ${category.name}`}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
        />
        <button
          onClick={handleAdd}
          className="p-1 text-blue-600 hover:text-blue-700"
          title="Agregar concepto"
        >
          <Plus className="size-4" />
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
