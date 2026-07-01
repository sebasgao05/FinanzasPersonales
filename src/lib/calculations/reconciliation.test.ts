import { describe, it, expect } from 'vitest';
import {
  totalLocated,
  pendingToLocate,
  locatedPercentage,
  reconciliationStatus,
  type AccountBalance,
} from './reconciliation';

describe('reconciliation', () => {
  describe('totalLocated', () => {
    it('sums balances of active accounts only', () => {
      const accounts: AccountBalance[] = [
        { balance: 1000, isActive: true },
        { balance: 500, isActive: false },
        { balance: 2000, isActive: true },
      ];
      expect(totalLocated(accounts)).toBe(3000);
    });

    it('returns 0 for empty array', () => {
      expect(totalLocated([])).toBe(0);
    });

    it('returns 0 when all accounts are inactive', () => {
      const accounts: AccountBalance[] = [
        { balance: 1000, isActive: false },
        { balance: 2000, isActive: false },
      ];
      expect(totalLocated(accounts)).toBe(0);
    });

    it('handles negative balances (sobregiros)', () => {
      const accounts: AccountBalance[] = [
        { balance: 1000, isActive: true },
        { balance: -200, isActive: true },
      ];
      expect(totalLocated(accounts)).toBe(800);
    });

    it('rounds to 2 decimal places', () => {
      const accounts: AccountBalance[] = [
        { balance: 10.125, isActive: true },
        { balance: 20.126, isActive: true },
      ];
      expect(totalLocated(accounts)).toBe(30.25);
    });

    it('sanitizes non-numeric balances as 0', () => {
      const accounts: AccountBalance[] = [
        { balance: 1000, isActive: true },
        { balance: NaN, isActive: true },
      ];
      expect(totalLocated(accounts)).toBe(1000);
    });
  });

  describe('pendingToLocate', () => {
    it('calculates difference between totalBase and totalLocated', () => {
      expect(pendingToLocate(5000, 3000)).toBe(2000);
    });

    it('returns 0 when perfectly balanced', () => {
      expect(pendingToLocate(5000, 5000)).toBe(0);
    });

    it('returns negative when totalLocated exceeds totalBase', () => {
      expect(pendingToLocate(3000, 5000)).toBe(-2000);
    });

    it('rounds to 2 decimal places', () => {
      expect(pendingToLocate(100.555, 50.333)).toBe(50.22);
    });
  });

  describe('locatedPercentage', () => {
    it('calculates percentage correctly', () => {
      expect(locatedPercentage(5000, 10000)).toBe(50);
    });

    it('returns 0 when totalBase is 0', () => {
      expect(locatedPercentage(5000, 0)).toBe(0);
    });

    it('returns 100 when fully located', () => {
      expect(locatedPercentage(10000, 10000)).toBe(100);
    });

    it('rounds to 1 decimal place', () => {
      expect(locatedPercentage(1, 3)).toBe(33.3);
    });

    it('handles values greater than 100%', () => {
      expect(locatedPercentage(15000, 10000)).toBe(150);
    });
  });

  describe('reconciliationStatus', () => {
    it('returns Cuadrado when pending is 0', () => {
      expect(reconciliationStatus(0)).toBe('Cuadrado');
    });

    it('returns Falta ubicar when pending is positive', () => {
      expect(reconciliationStatus(100)).toBe('Falta ubicar');
    });

    it('returns Sobra when pending is negative', () => {
      expect(reconciliationStatus(-100)).toBe('Sobra');
    });

    it('handles very small positive values', () => {
      expect(reconciliationStatus(0.01)).toBe('Falta ubicar');
    });

    it('handles very small negative values', () => {
      expect(reconciliationStatus(-0.01)).toBe('Sobra');
    });
  });
});
