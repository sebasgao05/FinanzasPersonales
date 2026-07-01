import { describe, it, expect } from 'vitest';
import { formatAmount, formatPercentage } from './formatting';

describe('formatAmount', () => {
  it('formats numbers with thousands separator and 2 decimals', () => {
    expect(formatAmount(1234567.89)).toBe('1,234,567.89');
    expect(formatAmount(1000)).toBe('1,000.00');
    expect(formatAmount(999999999.99)).toBe('999,999,999.99');
  });

  it('formats zero correctly', () => {
    expect(formatAmount(0)).toBe('0.00');
  });

  it('formats small numbers correctly', () => {
    expect(formatAmount(0.01)).toBe('0.01');
    expect(formatAmount(0.1)).toBe('0.10');
    expect(formatAmount(5.5)).toBe('5.50');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatAmount(1.999)).toBe('2.00');
    expect(formatAmount(1.005)).toBe('1.01');
    expect(formatAmount(123.456)).toBe('123.46');
  });

  it('formats negative numbers correctly', () => {
    expect(formatAmount(-1234.56)).toBe('-1,234.56');
  });
});

describe('formatPercentage', () => {
  it('formats numbers as percentage with 1 decimal', () => {
    expect(formatPercentage(85.7)).toBe('85.7%');
    expect(formatPercentage(100)).toBe('100.0%');
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('rounds to 1 decimal place', () => {
    expect(formatPercentage(33.33)).toBe('33.3%');
    expect(formatPercentage(66.67)).toBe('66.7%');
    expect(formatPercentage(99.99)).toBe('100.0%');
  });

  it('handles large percentages', () => {
    expect(formatPercentage(150.5)).toBe('150.5%');
  });

  it('handles negative percentages', () => {
    expect(formatPercentage(-10.5)).toBe('-10.5%');
  });
});
