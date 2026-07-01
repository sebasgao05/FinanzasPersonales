/**
 * Almacén centralizado en memoria para modo mock (sin backend).
 * Todos los hooks comparten esta misma instancia.
 * Los datos se pierden al recargar la página.
 *
 * Cuando se conecte Amplify real, este archivo se elimina y los hooks
 * usan client.models.XXX directamente.
 */

import type { TransactionRecord } from '@/lib/utils/filtering';

export interface MockTransactionStore {
  transactions: TransactionRecord[];
  listeners: Set<() => void>;
}

// Singleton store compartido
const store: MockTransactionStore = {
  transactions: [],
  listeners: new Set(),
};

export function getTransactions(): TransactionRecord[] {
  return store.transactions;
}

export function setTransactions(records: TransactionRecord[]): void {
  store.transactions = records;
  notifyListeners();
}

export function addTransaction(record: TransactionRecord): void {
  store.transactions = [...store.transactions, record];
  notifyListeners();
}

export function updateTransaction(id: string, updates: Partial<TransactionRecord>): void {
  store.transactions = store.transactions.map((t) =>
    t.id === id ? { ...t, ...updates } : t
  );
  notifyListeners();
}

export function removeTransaction(id: string): void {
  store.transactions = store.transactions.filter((t) => t.id !== id);
  notifyListeners();
}

export function subscribe(listener: () => void): () => void {
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

function notifyListeners(): void {
  for (const listener of store.listeners) {
    listener();
  }
}
