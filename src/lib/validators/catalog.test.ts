import { describe, it, expect } from 'vitest';
import { validateCatalogName, canDeleteOrDeactivate } from './catalog';

describe('validateCatalogName', () => {
  describe('empty/whitespace validation (Req 11.9)', () => {
    it('rejects empty string', () => {
      const result = validateCatalogName('', []);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El nombre es obligatorio');
    });

    it('rejects string with only spaces', () => {
      const result = validateCatalogName('   ', []);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El nombre es obligatorio');
    });

    it('rejects string with only tabs and newlines', () => {
      const result = validateCatalogName('\t\n  ', []);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El nombre es obligatorio');
    });
  });

  describe('max length validation (Req 11.3, 11.4)', () => {
    it('accepts name with exactly 50 characters', () => {
      const name = 'a'.repeat(50);
      const result = validateCatalogName(name, []);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects name with 51 characters', () => {
      const name = 'a'.repeat(51);
      const result = validateCatalogName(name, []);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El nombre no puede exceder 50 caracteres');
    });
  });

  describe('uniqueness validation (Req 11.3, 11.4)', () => {
    it('rejects duplicate name (exact match)', () => {
      const result = validateCatalogName('Alimentación', ['Alimentación', 'Transporte']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ya existe un elemento con este nombre');
    });

    it('rejects duplicate name (case-insensitive)', () => {
      const result = validateCatalogName('alimentación', ['Alimentación', 'Transporte']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ya existe un elemento con este nombre');
    });

    it('rejects duplicate name with different case and leading/trailing spaces', () => {
      const result = validateCatalogName('  Transporte  ', ['Alimentación', 'Transporte']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ya existe un elemento con este nombre');
    });

    it('accepts unique name', () => {
      const result = validateCatalogName('Servicios', ['Alimentación', 'Transporte']);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts name when existingNames is empty', () => {
      const result = validateCatalogName('Salud', []);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('valid names', () => {
    it('accepts a simple valid name', () => {
      const result = validateCatalogName('Transporte', []);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts name with special characters', () => {
      const result = validateCatalogName('Café & Restaurantes', []);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('canDeleteOrDeactivate', () => {
  describe('base item protection (Req 11.2)', () => {
    it('rejects deletion/deactivation of base items', () => {
      const result = canDeleteOrDeactivate({ isBase: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Los elementos base no pueden ser eliminados o desactivados'
      );
    });

    it('allows deletion/deactivation of non-base items', () => {
      const result = canDeleteOrDeactivate({ isBase: false });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
