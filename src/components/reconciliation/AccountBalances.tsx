import { useState } from 'react';
import { Plus, Pencil, EyeOff, Eye, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
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
 * Permite agregar, editar nombre y desactivar cuentas.
 * Permite valores negativos para sobregiros.
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

  const activeAccounts = accounts.filter((a) => a.isActive);
  const inactiveAccounts = accounts.filter((a) => !a.isActive);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <h3 className="text-base font-semibold">Cuentas Bancarias</h3>

      {/* Active accounts */}
      <div className="space-y-2">
        {activeAccounts.map((account, index) => (
          <div
            key={account.id}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 group"
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
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      const globalIndex = accounts.indexOf(account);
                      const prevActiveIndex = accounts.findIndex(
                        (a, i) => i < globalIndex && a.isActive
                      );
                      if (globalIndex > 0) {
                        // Find the previous active account's global index
                        const activeGlobalIndices = accounts
                          .map((a, i) => (a.isActive ? i : -1))
                          .filter((i) => i >= 0);
                        const currentPos = activeGlobalIndices.indexOf(globalIndex);
                        if (currentPos > 0) {
                          onReorderAccounts(globalIndex, activeGlobalIndices[currentPos - 1]);
                        }
                      }
                    }}
                    disabled={index === 0}
                    className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Subir"
                  >
                    <ArrowUp className="size-3" />
                  </button>
                  <button
                    onClick={() => {
                      const globalIndex = accounts.indexOf(account);
                      const activeGlobalIndices = accounts
                        .map((a, i) => (a.isActive ? i : -1))
                        .filter((i) => i >= 0);
                      const currentPos = activeGlobalIndices.indexOf(globalIndex);
                      if (currentPos < activeGlobalIndices.length - 1) {
                        onReorderAccounts(globalIndex, activeGlobalIndices[currentPos + 1]);
                      }
                    }}
                    disabled={index === activeAccounts.length - 1}
                    className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Bajar"
                  >
                    <ArrowDown className="size-3" />
                  </button>
                </div>
                <span className="w-28 sm:w-36 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {account.name}
                </span>
                <input
                  type="number"
                  value={account.balance}
                  onChange={(e) =>
                    onBalanceChange(account.id, parseFloat(e.target.value) || 0)
                  }
                  step="0.01"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
                  placeholder="0.00"
                />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(account)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Editar nombre"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => onDeactivateAccount(account.id)}
                    className="p-1 text-gray-400 hover:text-amber-600"
                    title="Desactivar cuenta"
                  >
                    <EyeOff className="size-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
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
                className="flex items-center gap-2 px-2 py-1 group"
              >
                <span className="text-sm text-gray-400 line-through flex-1">
                  {account.name}
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded">
                  Inactiva
                </span>
                <button
                  onClick={() => onReactivateAccount(account.id)}
                  className="p-1 text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
      <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
        />
        <Button size="sm" onClick={handleAdd}>
          <Plus className="size-4" />
          Agregar cuenta
        </Button>
      </div>
      {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
    </div>
  );
}
