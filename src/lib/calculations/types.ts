// Tipo de entrada estándar para el motor de cálculos
export interface CalculationTransaction {
  type: 'Ingreso' | 'Egreso';
  amount: number;
  budget?: number;
  category?: string;
  concept?: string;
  month?: string;
  year?: number;
}

// Distribución por categoría
export interface CategoryDistribution {
  category: string;
  amount: number;
  percentage: number;
}
