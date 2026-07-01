import { describe, it, expect } from 'vitest';
import { extractMonth, extractYear } from './dates';

describe('extractMonth', () => {
  it('extracts the correct Spanish month name from a date string', () => {
    expect(extractMonth('2024-01-15')).toBe('Enero');
    expect(extractMonth('2024-02-28')).toBe('Febrero');
    expect(extractMonth('2024-03-15')).toBe('Marzo');
    expect(extractMonth('2024-04-01')).toBe('Abril');
    expect(extractMonth('2024-05-10')).toBe('Mayo');
    expect(extractMonth('2024-06-30')).toBe('Junio');
    expect(extractMonth('2024-07-04')).toBe('Julio');
    expect(extractMonth('2024-08-20')).toBe('Agosto');
    expect(extractMonth('2024-09-15')).toBe('Septiembre');
    expect(extractMonth('2024-10-31')).toBe('Octubre');
    expect(extractMonth('2024-11-11')).toBe('Noviembre');
    expect(extractMonth('2024-12-25')).toBe('Diciembre');
  });

  it('works with different years', () => {
    expect(extractMonth('2020-06-01')).toBe('Junio');
    expect(extractMonth('1999-12-31')).toBe('Diciembre');
  });
});

describe('extractYear', () => {
  it('extracts the year from a date string', () => {
    expect(extractYear('2024-03-15')).toBe(2024);
    expect(extractYear('2023-01-01')).toBe(2023);
    expect(extractYear('1999-12-31')).toBe(1999);
    expect(extractYear('2000-06-15')).toBe(2000);
  });

  it('handles 4-digit years correctly', () => {
    expect(extractYear('2030-01-01')).toBe(2030);
    expect(extractYear('1900-05-20')).toBe(1900);
  });
});
