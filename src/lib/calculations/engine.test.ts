import { describe, it, expect } from 'vitest';
import { safeDiv, sanitizeAmount } from './engine';

describe('safeDiv', () => {
  it('returns 0 when denominator is 0', () => {
    expect(safeDiv(10, 0)).toBe(0);
    expect(safeDiv(0, 0)).toBe(0);
    expect(safeDiv(-5, 0)).toBe(0);
  });

  it('returns correct division for non-zero denominator', () => {
    expect(safeDiv(10, 2)).toBe(5);
    expect(safeDiv(7, 2)).toBe(3.5);
    expect(safeDiv(0, 5)).toBe(0);
  });

  it('handles negative numbers correctly', () => {
    expect(safeDiv(-10, 2)).toBe(-5);
    expect(safeDiv(10, -2)).toBe(-5);
    expect(safeDiv(-10, -2)).toBe(5);
  });

  it('never returns Infinity or NaN', () => {
    const result = safeDiv(1, 0);
    expect(Number.isFinite(result)).toBe(true);
    expect(Number.isNaN(result)).toBe(false);
  });
});

describe('sanitizeAmount', () => {
  it('returns 0 for null', () => {
    expect(sanitizeAmount(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(sanitizeAmount(undefined)).toBe(0);
  });

  it('returns 0 for NaN', () => {
    expect(sanitizeAmount(NaN)).toBe(0);
  });

  it('returns 0 for non-numeric types', () => {
    expect(sanitizeAmount('hello')).toBe(0);
    expect(sanitizeAmount('')).toBe(0);
    expect(sanitizeAmount(true)).toBe(0);
    expect(sanitizeAmount(false)).toBe(0);
    expect(sanitizeAmount({})).toBe(0);
    expect(sanitizeAmount([])).toBe(0);
  });

  it('returns the original value for valid numbers', () => {
    expect(sanitizeAmount(42)).toBe(42);
    expect(sanitizeAmount(0)).toBe(0);
    expect(sanitizeAmount(-10)).toBe(-10);
    expect(sanitizeAmount(3.14)).toBe(3.14);
    expect(sanitizeAmount(999999999.99)).toBe(999999999.99);
  });
});
