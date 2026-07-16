import { useState, useRef, useCallback } from 'react';
import { Plus, Pencil, EyeOff, Eye, Check, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CashAccount } from '@/hooks/useReconciliation';

interface AccountBalancesProps {
  accounts: CashAccount[];
  onBalanceChange: (id: string, balance: number) => void;
  onAddAccount: (name: string) => Promise<void>;
  onEditAccountName: (id: string, name: string) => Promise<void>;
  onDeactivateAccount: (id: string) => Promise<void>;
  onReactivateAccount: (id: string) => Promise<void>;
  onReorderAccounts: (fromIndex: number, toIndex: number) => Promise<void>;
}

/**
 * Lista de cuentas bancarias editables con saldos.
 * Drag-and-drop (mouse) y touch-slide (móvil) para reordenar.
 * La posición se persiste en DB vía onReorderAccounts.
 * Requirements: 10.3, 10.4, 10.5
 */
export default function AccountBalances({
  accounts,
  onBalanceChange,
  onAddAccount,
  onEditAccountName,
  onDeactivateAccount,
  onReactivateAccount,
  onReorderAccounts,
}: AccountBalancesProps) {
  const [newAccountName, setNewAccountName] = useState('');
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Touch drag state
  const touchStartY = useRef<number>(0);
  const touchCurrentIndex = useRef<number | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [touchOverIndex, setTouchOverIndex] = useState<number | null>(null);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const inactiveAccounts = accounts.filter((a) => !a.isActive);

  // --- Mouse drag handlers ---
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toActiveIndex: number) => {
      e.preventDefault();
      const fromActiveIndex = dragIndex;
      setDragIndex(null);
      setDragOverIndex(null);

      if (fromActiveIndex === null || fromActiveIndex === toActiveIndex) return;

      // Convert active-list indices to global indices
      const fromGlobal = accounts.indexOf(activeAccounts[fromActiveIndex]);
      const toGlobal = accounts.indexOf(activeAccounts[toActiveIndex]);

      if (fromGlobal >= 0 && toGlobal >= 0) {
        onReorderAccounts(fromGlobal, toGlobal);
      }
    },
    [dragIndex, accounts, activeAccounts, onReorderAccounts]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  // --- Touch drag handlers ---
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentIndex.current = index;
    setTouchDragIndex(index);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchCurrentIndex.current === null) return;

      const touchY = e.touches[0].clientY;

      // Find which item the touch is over
      let overIdx: number | null = null;
      itemRefs.current.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        if (touchY >= rect.top && touchY <= rect.bottom) {
          overIdx = idx;
        }
      });

      if (overIdx !== null && overIdx !== touchCurrentIndex.current) {
        setTouchOverIndex(overIdx);
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    const from = touchCurrentIndex.current;
    const to = touchOverIndex;

    setTouchDragIndex(null);
    setTouchOverIndex(null);
    touchCurrentIndex.current = null;

    if (from === null || to === null || from === to) return;

    const fromGlobal = accounts.indexOf(activeAccounts[from]);
    const toGlobal = accounts.indexOf(activeAccounts[to]);

    if (fromGlobal >= 0 && toGlobal >= 0) {
      onReorderAccounts(fromGlobal, toGlobal);
    }
  }, [touchOverIndex, accounts, activeAccounts, onReorderAccounts]);

  // --- Account CRUD ---
  const handleAdd = async () => {
    const trimmed = newAccountName.trim();
    if (!trimmed) {
      setAddError('El nombre de la cuenta es obligatorio');
      return;
    }
    try {
      await onAddAccount(trimmed);
      setNewAccountName('');
      setAddError('');
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Error al agregar');
    }
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const startEdit = (account: CashAccount) => {
    setEditingId(account.id);
    setEditName(account.name);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditError('');
  };

  const confirmEdit = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('El nombre es obligatorio');
      return;
    }
    try {
      await onEditAccountName(id, trimmed);
      setEditingId(null);
      setEditName('');
      setEditError('');
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Error al editar');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') confirmEdit(id);
    else if (e.key === 'Escape') cancelEdit();
  };

  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Cuentas Bancarias</h3>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Arrastra para reordenar
        </span>
        <span className="text-xs text-muted-foreground sm:hidden">
          Mantén y desliza para mover
        </span>
      </div>

      {/* Active accounts with drag support */}
      <div className="space-y-1">
        {activeAccounts.map((account, index) => {
          const isDragging = dragIndex === index || touchDragIndex === index;
          const isDragOver = dragOverIndex === index || touchOverIndex === index;

          return (
            <div
              key={account.id}
              ref={(el) => setItemRef(index, el)}
              draggable={editingId !== account.id}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`flex items-center gap-2 sm:gap-3 p-2 rounded-md transition-all group select-none ${
                isDragging
                  ? 'opacity-50 bg-blue-50 dark:bg-blue-900/20'
                  : isDragOver
                  ? 'border-t-2 border-blue-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {editingId === account.id ? (
                // Edit mode
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, account.id)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
                    autoFocus
                    maxLength={30}
                  />
                  <button
                    onClick={() => confirmEdit(account.id)}
                    className="p-1.5 text-green-600 hover:text-green-700 touch-manipulation"
                    title="Confirmar"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 text-gray-400 hover:text-gray-600 touch-manipulation"
                    title="Cancelar"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                // Display mode
                <>
                  {/* Drag handle */}
                  <div className="cursor-grab active:cursor-grabbing touch-manipulation p-1">
                    <GripVertical className="size-4 text-gray-400" />
                  </div>

                  {/* Account name */}
                  <span className="w-24 sm:w-36 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {account.name}
                  </span>

                  {/* Balance input */}
                  <input
                    type="number"
                    value={account.balance}
                    onChange={(e) =>
                      onBalanceChange(account.id, parseFloat(e.target.value) || 0)
                    }
                    step="0.01"
                    className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
                    placeholder="0.00"
                  />

                  {/* Action buttons - always visible on mobile, hover on desktop */}
                  <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(account)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 touch-manipulation"
                      title="Editar nombre"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => onDeactivateAccount(account.id)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 touch-manipulation"
                      title="Desactivar cuenta"
                    >
                      <EyeOff className="size-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {editError && <p className="text-xs text-red-500">{editError}</p>}

      {/* Inactive accounts (collapsed) */}
      {inactiveAccounts.length > 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 mb-1">
            Cuentas inactivas ({inactiveAccounts.length})
          </p>
          <div className="space-y-1">
            {inactiveAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-2 px-2 py-1.5 group"
              >
                <span className="text-sm text-gray-400 line-through flex-1 truncate">
                  {account.name}
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded">
                  Inactiva
                </span>
                <button
                  onClick={() => onReactivateAccount(account.id)}
                  className="p-1.5 text-gray-400 hover:text-green-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                  title="Reactivar cuenta"
                >
                  <Eye className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add account form */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={newAccountName}
          onChange={(e) => {
            setNewAccountName(e.target.value);
            if (addError) setAddError('');
          }}
          onKeyDown={handleAddKeyDown}
          placeholder="Nueva cuenta"
          maxLength={30}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
        />
        <Button size="sm" onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="size-4" />
          Agregar
        </Button>
      </div>
      {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
    </div>
  );
}
