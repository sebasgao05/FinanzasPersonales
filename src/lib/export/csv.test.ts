import { describe, it, expect, vi } from 'vitest';
import {
  generateCSV,
  generateImportTemplate,
  downloadCSV,
  EXPORT_COLUMNS,
  IMPORT_TEMPLATE_COLUMNS,
  TransactionRecord,
} from './csv';

describe('EXPORT_COLUMNS', () => {
  it('contains expected column headers', () => {
    expect(EXPORT_COLUMNS).toEqual([
      'Fecha', 'Mes', 'Año', 'Tipo', 'Categoría', 'Concepto',
      'Detalle', 'Presupuesto', 'Monto', 'Moneda', 'Notas',
    ]);
  });
});

describe('IMPORT_TEMPLATE_COLUMNS', () => {
  it('contains expected import template headers', () => {
    expect(IMPORT_TEMPLATE_COLUMNS).toEqual([
      'Fecha', 'Tipo', 'Categoría', 'Concepto', 'Detalle',
      'Presupuesto', 'Monto real', 'Moneda', 'Notas',
    ]);
  });
});

describe('generateCSV', () => {
  const sampleRecord: TransactionRecord = {
    date: '2024-03-15',
    month: 'Marzo',
    year: 2024,
    type: 'Egreso',
    categoryName: 'Alimentación',
    conceptName: 'Supermercado',
    detail: 'Compra semanal',
    budget: 500000,
    amount: 450000,
    currency: 'COP',
    notes: 'Pago con tarjeta',
  };

  it('returns only headers when records array is empty', () => {
    const csv = generateCSV([]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('Fecha,Mes,Año,Tipo,Categoría,Concepto,Detalle,Presupuesto,Monto,Moneda,Notas');
  });

  it('includes header row as first line', () => {
    const csv = generateCSV([sampleRecord]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Fecha,Mes,Año,Tipo,Categoría,Concepto,Detalle,Presupuesto,Monto,Moneda,Notas');
  });

  it('generates one data row per record', () => {
    const csv = generateCSV([sampleRecord, sampleRecord]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // 1 header + 2 data rows
  });

  it('correctly maps record fields to columns', () => {
    const csv = generateCSV([sampleRecord]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('2024-03-15,Marzo,2024,Egreso,Alimentación,Supermercado,Compra semanal,500000,450000,COP,Pago con tarjeta');
  });

  it('handles empty optional fields', () => {
    const record: TransactionRecord = {
      date: '2024-01-01',
      month: 'Enero',
      year: 2024,
      type: 'Ingreso',
      categoryName: 'Salario',
      conceptName: 'Nómina',
      amount: 5000000,
      currency: 'COP',
    };
    const csv = generateCSV([record]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('2024-01-01,Enero,2024,Ingreso,Salario,Nómina,,,5000000,COP,');
  });

  it('escapes fields containing commas', () => {
    const record: TransactionRecord = {
      ...sampleRecord,
      detail: 'Item A, Item B',
    };
    const csv = generateCSV([record]);
    expect(csv).toContain('"Item A, Item B"');
  });

  it('escapes fields containing double quotes', () => {
    const record: TransactionRecord = {
      ...sampleRecord,
      notes: 'Concepto "especial"',
    };
    const csv = generateCSV([record]);
    expect(csv).toContain('"Concepto ""especial"""');
  });

  it('escapes fields containing newlines', () => {
    const record: TransactionRecord = {
      ...sampleRecord,
      notes: 'Línea 1\nLínea 2',
    };
    const csv = generateCSV([record]);
    expect(csv).toContain('"Línea 1\nLínea 2"');
  });

  it('uses comma as separator', () => {
    const csv = generateCSV([sampleRecord]);
    const headerLine = csv.split('\n')[0];
    const fields = headerLine.split(',');
    expect(fields).toHaveLength(11);
  });
});

describe('generateImportTemplate', () => {
  it('returns a single line with import template columns', () => {
    const template = generateImportTemplate();
    const lines = template.split('\n');
    expect(lines).toHaveLength(1);
  });

  it('contains all import template column headers', () => {
    const template = generateImportTemplate();
    expect(template).toBe('Fecha,Tipo,Categoría,Concepto,Detalle,Presupuesto,Monto real,Moneda,Notas');
  });
});

describe('downloadCSV', () => {
  it('creates a download link and triggers click', () => {
    const createObjectURL = vi.fn(() => 'blob:http://test/1234');
    const revokeObjectURL = vi.fn();
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const clickFn = vi.fn();

    Object.defineProperty(global, 'URL', {
      value: { createObjectURL, revokeObjectURL },
      writable: true,
    });

    Object.defineProperty(global, 'Blob', {
      value: class {
        constructor(public content: string[], public options: object) {}
      },
      writable: true,
    });

    const mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: clickFn,
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChild);
    vi.spyOn(document.body, 'removeChild').mockImplementation(removeChild);

    downloadCSV('test content', 'export.csv');

    expect(createObjectURL).toHaveBeenCalled();
    expect(mockLink.download).toBe('export.csv');
    expect(clickFn).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://test/1234');

    vi.restoreAllMocks();
  });
});
