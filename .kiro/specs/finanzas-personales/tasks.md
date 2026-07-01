# Implementation Plan: Finanzas Personales

## Overview

Implementación incremental de la aplicación de finanzas personales usando React + TypeScript + Vite, AWS Amplify Gen 2, shadcn/ui y Recharts. El plan sigue un enfoque bottom-up: primero la infraestructura y modelos de datos, luego el motor de cálculos, después los módulos de UI progresivamente más complejos.

## Tasks

- [x] 1. Configurar proyecto base y backend Amplify
  - [x] 1.1 Inicializar proyecto React + TypeScript + Vite con dependencias
    - Crear proyecto con Vite, instalar dependencias: tailwindcss, shadcn/ui, recharts, aws-amplify, fast-check, vitest
    - Configurar Tailwind CSS y shadcn/ui
    - Configurar Vitest como test runner
    - _Requirements: Stack tecnológico (Introducción)_

  - [x] 1.2 Configurar backend Amplify Gen 2 con schema de datos
    - Crear `amplify/auth/resource.ts` con configuración de Cognito
    - Crear `amplify/data/resource.ts` con el schema completo (Transaction, Category, Concept, CashAccount, CashReconciliation, CashBalance, RecurringPayment, AppSetting, ImportBatch)
    - Crear `amplify/backend.ts` como entry point
    - Configurar autorización basada en propietario para todas las entidades
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 1.3_

  - [x] 1.3 Crear estructura de carpetas y archivos base
    - Crear estructura de directorios según el diseño: components/, hooks/, lib/, pages/, contexts/
    - Crear archivos de tipos compartidos (`lib/calculations/types.ts`)
    - Crear archivo de constantes (`lib/utils/constants.ts`) con catálogos base
    - _Requirements: 11.2_


- [x] 2. Implementar Motor de Cálculos Financieros
  - [x] 2.1 Implementar funciones utilitarias base (safeDiv, sanitizeAmount)
    - Crear `src/lib/calculations/engine.ts` con `safeDiv` y `sanitizeAmount`
    - `safeDiv`: retorna 0 si denominador es 0, sin lanzar excepciones
    - `sanitizeAmount`: retorna 0 para null/undefined/NaN/no-numérico, valor original para numéricos
    - _Requirements: 14.3, 14.4_

  - [x] 2.2 Write property tests for safeDiv and sanitizeAmount
    - **Property 1: Safe Division**
    - **Property 2: Amount Sanitization**
    - **Validates: Requirements 14.3, 14.4**

  - [x] 2.3 Implementar funciones de totales y balance
    - Crear `src/lib/calculations/totals.ts` con `totalIncome`, `totalExpense`, `balance`
    - Todas las funciones deben ser puras, redondear montos a 2 decimales
    - Usar `sanitizeAmount` internamente para cada valor de monto
    - Retornar 0 para arreglos vacíos
    - _Requirements: 14.1, 14.2, 14.5, 14.6, 14.7_

  - [x] 2.4 Write property tests for totals and balance
    - **Property 3: Balance Consistency (Algebraic Invariant)**
    - **Property 4: Pure Function Determinism**
    - **Property 5: Empty Input Handling**
    - **Property 6: Monetary Rounding**
    - **Validates: Requirements 14.2, 14.5, 14.6, 14.7**

  - [x] 2.5 Implementar funciones de flujo de caja
    - Crear `src/lib/calculations/cashflow.ts` con `monthlyFlow`, `cumulativeFlow`
    - `monthlyFlow`: ingreso menos egreso de un mes específico
    - `cumulativeFlow`: suma acumulada de flujos mensuales desde enero hasta mes dado
    - _Requirements: 9.3, 14.1_

  - [x] 2.6 Write property test for cumulative cash flow
    - **Property 18: Cash Flow Cumulative Calculation**
    - **Validates: Requirements 9.3**

  - [x] 2.7 Implementar funciones de distribución por categoría
    - Crear `src/lib/calculations/distribution.ts` con `categoryDistribution`
    - Agrupar egresos por categoría, calcular porcentaje, agrupar <5% en "Otros"
    - Retornar arreglo vacío para input vacío
    - _Requirements: 8.4, 14.1, 14.6_

  - [x] 2.8 Write property test for category distribution
    - **Property 17: Category Distribution Grouping**
    - **Validates: Requirements 8.4**

  - [x] 2.9 Implementar funciones de conciliación
    - Crear `src/lib/calculations/reconciliation.ts` con funciones de cálculo de conciliación
    - `totalLocated`: suma de saldos de cuentas activas
    - `pendingToLocate`: totalBase - totalLocated
    - `locatedPercentage`: (totalLocated / totalBase) * 100, retorna 0 si totalBase es 0
    - Clasificación de estado: Cuadrado/Falta ubicar/Sobra
    - _Requirements: 10.5, 10.6, 10.7_

  - [x] 2.10 Write property tests for reconciliation
    - **Property 19: Reconciliation Arithmetic**
    - **Property 20: Reconciliation Status Classification**
    - **Validates: Requirements 10.5, 10.6, 10.7**

  - [x] 2.11 Implementar función de porcentaje de ejecución
    - Agregar `executionPercentage(budget, actual)` al motor
    - Retorna (actual / budget) * 100, redondeado a 1 decimal, 0 si budget es 0
    - _Requirements: 12.2, 12.3_

  - [x] 2.12 Write property test for pivot aggregation
    - **Property 24: Pivot Aggregation Correctness**
    - **Validates: Requirements 12.2**

- [x] 3. Checkpoint - Motor de cálculos completo
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementar validadores y utilidades
  - [x] 4.1 Implementar validador de transacciones
    - Crear `src/lib/validators/transaction.ts`
    - Validar campos obligatorios: date, type, categoryId, conceptId, amount, currency
    - Validar rango de monto: 0.01 a 999,999,999.99
    - Validar longitud de detalle (max 100) y notas (max 500)
    - _Requirements: 4.1, 4.5, 4.6_

  - [x] 4.2 Write property tests for transaction validation
    - **Property 9: Amount Range Validation**
    - **Property 10: Required Fields Validation**
    - **Validates: Requirements 4.5, 4.6**

  - [x] 4.3 Implementar validador de catálogos
    - Crear `src/lib/validators/catalog.ts`
    - Validar nombre no vacío, no solo espacios, máximo 50 caracteres
    - Validar unicidad de nombre dentro del mismo tipo/categoría
    - Validar protección de items base (no se pueden eliminar/desactivar)
    - _Requirements: 11.3, 11.4, 11.9, 11.2_

  - [x] 4.4 Write property tests for catalog validation
    - **Property 21: Catalog Item Name Validation**
    - **Property 22: Catalog Base Items Protection**
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.9**

  - [x] 4.5 Implementar validador de importación
    - Crear `src/lib/validators/import.ts`
    - Validar columnas requeridas en archivo
    - Validar formato de archivo (CSV/Excel), no vacío, máximo 10,000 filas
    - Validar cada fila contra reglas de transacción
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 4.6 Write property tests for import validation
    - **Property 15: Import Column Validation**
    - **Property 16: Import Row Processing Integrity**
    - **Validates: Requirements 7.1, 7.5**

  - [x] 4.7 Implementar validador de pagos recurrentes
    - Crear `src/lib/validators/recurring.ts`
    - Validar nombre (max 100), monto (0.01-999,999,999.99), día pago (1-31)
    - Validar frecuencia e intervalo personalizado (1-365 días)
    - _Requirements: 13.1, 13.7_

  - [x] 4.8 Implementar utilidades de fechas y formateo
    - Crear `src/lib/utils/dates.ts` con extracción de mes/año desde fecha
    - Crear `src/lib/utils/formatting.ts` con formateo de montos y porcentajes
    - _Requirements: 4.2_

  - [x] 4.9 Write property test for date extraction
    - **Property 7: Date Extraction**
    - **Validates: Requirements 4.2**

  - [x] 4.10 Implementar funciones de filtrado y búsqueda
    - Crear funciones de filtrado por múltiples dimensiones (mes, año, tipo, categoría, concepto)
    - Crear función de búsqueda de texto parcial case-insensitive sobre campos searchable
    - Crear función de filtrado jerárquico de catálogos (tipo→categoría→concepto)
    - _Requirements: 5.2, 5.3, 4.3, 4.4_

  - [x] 4.11 Write property tests for filtering and search
    - **Property 8: Hierarchical Catalog Filtering**
    - **Property 11: Text Search Filtering**
    - **Property 12: Multi-Filter Conjunction**
    - **Property 13: Column Sorting Invariant**
    - **Validates: Requirements 4.3, 4.4, 5.2, 5.3, 5.4**

  - [x] 4.12 Implementar exportación CSV
    - Crear `src/lib/export/csv.ts` con generación de CSV UTF-8
    - Incluir encabezados como primera fila
    - Generar archivo solo con headers si no hay registros
    - Generar plantilla CSV de importación
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 4.13 Write property test for CSV export
    - **Property 14: CSV Export Data Preservation**
    - **Validates: Requirements 6.1**

- [x] 5. Checkpoint - Validadores y utilidades completos
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementar autenticación y layout principal
  - [x] 6.1 Implementar AuthContext y LoginPage
    - Crear `src/contexts/AuthContext.tsx` con estado de autenticación
    - Crear `src/pages/LoginPage.tsx` usando Amplify Authenticator
    - Configurar mensajes de error genéricos (sin revelar si es email o password)
    - Implementar manejo de expiración de sesión
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.7, 1.8_

  - [x] 6.2 Implementar ProtectedRoute y redirección
    - Crear componente ProtectedRoute que valide sesión activa
    - Redirigir a login si no autenticado
    - Redirigir a instrucciones después de login exitoso
    - _Requirements: 1.2, 1.5, 1.7_

  - [x] 6.3 Implementar AppLayout con Sidebar y MobileNav
    - Crear `src/components/layout/AppLayout.tsx` con sidebar y área de contenido
    - Crear `src/components/layout/Sidebar.tsx` con navegación a todas las páginas
    - Crear `src/components/layout/MobileNav.tsx` con menú hamburguesa para ≤768px
    - Highlight visual del elemento activo en navegación
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 6.4 Configurar React Router con todas las rutas
    - Crear `src/App.tsx` con configuración de rutas
    - Rutas: /, /instrucciones, /ingreso, /datos, /dashboard, /flujo-caja, /caja-bancos, /catalogos, /analisis, /pagos-recurrentes
    - Aplicar ProtectedRoute a todas las rutas excepto login
    - _Requirements: 2.1_

- [x] 7. Implementar SettingsContext y página de instrucciones
  - [x] 7.1 Implementar SettingsContext
    - Crear `src/contexts/SettingsContext.tsx`
    - Cargar configuración del usuario (moneda, año, mes predeterminados)
    - Crear configuración inicial al primer login (COP, año actual, mes actual)
    - Implementar fallback si valor predeterminado no existe en catálogos activos
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [x] 7.2 Write property test for settings fallback
    - **Property 27: Settings Fallback Resolution**
    - **Validates: Requirements 16.4**

  - [x] 7.3 Implementar InstructionsPage
    - Crear `src/pages/InstructionsPage.tsx` con 7 tarjetas numeradas
    - Cada tarjeta con título, descripción y navegación a la página correspondiente
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 8. Implementar módulo de catálogos
  - [x] 8.1 Implementar hook useCatalogs
    - Crear `src/hooks/useCatalogs.ts` con CRUD de categorías y conceptos
    - Cargar catálogos del usuario con filtro por owner
    - Implementar lógica de desactivación vs eliminación
    - Implementar desactivación en cascada (categoría → conceptos)
    - _Requirements: 11.1, 11.5, 11.6, 11.7, 11.8_

  - [x] 8.2 Write property test for cascade deactivation
    - **Property 23: Cascade Deactivation**
    - **Validates: Requirements 11.8**

  - [x] 8.3 Implementar CatalogPage con CatalogManager
    - Crear `src/pages/CatalogPage.tsx` y `src/components/catalogs/CatalogManager.tsx`
    - Secciones para: Tipos, Categorías ingreso/egreso, Conceptos ingreso/egreso, Meses, Años, Monedas
    - Formularios inline para agregar/editar items
    - Indicador visual de items desactivados
    - Protección de items base (no permite eliminar)
    - Diálogo de confirmación antes de eliminar
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

- [x] 9. Checkpoint - Autenticación, layout y catálogos completos
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implementar módulo de transacciones
  - [x] 10.1 Implementar hook useTransactions
    - Crear `src/hooks/useTransactions.ts` con CRUD de transacciones
    - Queries filtradas por owner con soporte para filtros (mes, año, tipo, categoría)
    - Paginación de resultados (50 por página)
    - _Requirements: 1.4, 5.11, 15.2_

  - [x] 10.2 Implementar TransactionForm (página de ingreso)
    - Crear `src/components/transactions/TransactionForm.tsx`
    - Campos con dependencia: tipo→categoría→concepto (filtrando opciones activas)
    - Cálculo automático de mes/año desde fecha
    - Validación inline de todos los campos
    - Botones: Guardar, Guardar y crear otro, Limpiar
    - Crear `src/pages/TransactionEntryPage.tsx`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [~] 10.3 Implementar TransactionTable con filtros y búsqueda
    - Crear `src/components/transactions/TransactionTable.tsx`
    - Crear `src/components/transactions/TransactionFilters.tsx`
    - Columnas: Fecha, Mes, Año, Tipo, Categoría, Concepto, Detalle, Presupuesto, Monto, Moneda, Notas, Fecha creación, Fecha actualización
    - Búsqueda de texto parcial case-insensitive en Detalle, Categoría, Concepto, Notas
    - Filtros por Mes, Año, Tipo, Categoría, Concepto
    - Ordenamiento por cualquier columna (descendente por Fecha por defecto)
    - Paginación (50 registros/página)
    - Totales inferiores: ingresos, egresos, balance (sobre registros filtrados)
    - Estado vacío cuando no hay resultados
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.9, 5.10, 5.11, 5.12_

  - [~] 10.4 Implementar edición y eliminación de transacciones
    - Crear `src/components/transactions/EditTransactionDialog.tsx`
    - Botón Editar abre diálogo con datos actuales
    - Guardar cambios actualiza registro y refresca tabla
    - Botón Eliminar con diálogo de confirmación
    - Eliminación permanente y refresco de tabla
    - _Requirements: 5.5, 5.6, 5.7, 5.8_

  - [~] 10.5 Implementar DataTablePage con exportación e importación
    - Crear `src/pages/DataTablePage.tsx` integrando tabla, export e import
    - Botón Exportar CSV genera archivo con registros filtrados
    - Botón descargar plantilla CSV
    - Crear `src/components/import-export/CSVExporter.tsx`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [~] 10.6 Implementar importación de archivos
    - Crear `src/components/import-export/FileImporter.tsx`
    - Crear `src/components/import-export/ImportPreview.tsx`
    - Soporte para CSV y Excel (xlsx)
    - Validación de formato, columnas, tamaño (max 10,000 filas)
    - Vista previa de primeros 10 registros
    - Procesamiento fila por fila con registro de errores
    - Resumen final: total procesadas, exitosas, con error
    - Crear registro ImportBatch al finalizar
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [~] 11. Checkpoint - Módulo de transacciones completo
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implementar Dashboard
  - [~] 12.1 Implementar hook useDashboard
    - Crear `src/hooks/useDashboard.ts`
    - Cargar transacciones filtradas por mes, año y moneda
    - Calcular KPIs usando funciones del motor de cálculos
    - Calcular distribución por categoría para gráfica de dona
    - _Requirements: 8.1, 8.2, 8.3_

  - [~] 12.2 Implementar DashboardPage con KPIs y gráficas
    - Crear `src/pages/DashboardPage.tsx`
    - Crear `src/components/dashboard/KPICards.tsx` con 8 métricas
    - Crear `src/components/dashboard/DonutChart.tsx` para distribución de egresos
    - Crear `src/components/dashboard/BarChart.tsx` para ingresos vs egresos
    - Crear `src/components/dashboard/MonthlyTrendChart.tsx` para evolución mensual
    - Filtros de Mes, Año, Moneda precargados con valores predeterminados
    - Estado vacío cuando no hay transacciones para filtros seleccionados
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ] 13. Implementar Flujo de Caja
  - [~] 13.1 Implementar hook useCashFlow
    - Crear `src/hooks/useCashFlow.ts`
    - Cargar transacciones del año seleccionado en moneda predeterminada
    - Calcular flujo mensual y acumulado usando motor de cálculos
    - _Requirements: 9.2, 9.3_

  - [~] 13.2 Implementar CashFlowPage con tabla y gráficas
    - Crear `src/pages/CashFlowPage.tsx`
    - Crear `src/components/cashflow/CashFlowTable.tsx` con 12 columnas (meses)
    - Filas: Ingreso, Egreso, % Egresos/Ingresos, Flujo mensual, Flujo acumulado
    - Crear `src/components/cashflow/CashFlowCharts.tsx` con gráfica de línea (acumulado) y barras (mensual)
    - Selector de año, scroll horizontal en móvil
    - Estado vacío cuando no hay datos para el año
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [ ] 14. Implementar Conciliación de Caja y Bancos
  - [~] 14.1 Implementar hook useReconciliation
    - Crear `src/hooks/useReconciliation.ts`
    - CRUD de cuentas bancarias (máx 20, nombre único, max 30 chars)
    - Obtener flujo acumulado del módulo de flujo de caja
    - Calcular totales de conciliación
    - Persistir conciliación (CashReconciliation + CashBalance)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.9_

  - [~] 14.2 Implementar ReconciliationPage con formulario y cuentas
    - Crear `src/pages/ReconciliationPage.tsx`
    - Crear `src/components/reconciliation/ReconciliationForm.tsx`
    - Campos: Fecha de corte, Mes, Año, Acumulado automático, Ajuste manual, Total base
    - Crear `src/components/reconciliation/AccountBalances.tsx` con lista de cuentas editables
    - Cuentas predeterminadas: Efectivo, Nequi, Daviplata, Bancolombia, Lulo, Nu
    - Agregar/editar/desactivar cuentas
    - Indicador de estado: Cuadrado/Falta ubicar/Sobra
    - Gráfica de distribución de saldos por cuenta
    - Botón guardar conciliación
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

- [ ] 15. Implementar Análisis y Agrupación de Datos
  - [~] 15.1 Implementar página de Análisis con tabla pivot
    - Crear `src/pages/AnalysisPage.tsx`
    - Crear `src/components/analysis/AnalysisFilters.tsx` con selección de dimensiones y rango de fechas
    - Crear `src/components/analysis/PivotTable.tsx` con agrupación multidimensional
    - Métricas por grupo: suma presupuesto, suma monto real, % ejecución (2 decimales)
    - Filtro por defecto: todas las transacciones del año predeterminado
    - Estado vacío cuando no hay datos
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.8_

  - [~] 15.2 Write property test for date range filtering
    - **Property 25: Date Range Filtering**
    - **Validates: Requirements 12.4**

  - [~] 15.3 Implementar gráfica y exportación en análisis
    - Crear `src/components/analysis/AnalysisCharts.tsx` con gráfica de barras presupuesto vs real
    - Botón Exportar CSV con datos visibles de la tabla de resultados
    - _Requirements: 12.6, 12.7_

- [ ] 16. Implementar Pagos Recurrentes
  - [~] 16.1 Implementar hook useRecurringPayments
    - Crear `src/hooks/useRecurringPayments.ts`
    - CRUD de pagos recurrentes con validación
    - Función de generación de transacción desde pago recurrente
    - _Requirements: 13.1, 13.2, 13.4, 13.6_

  - [~] 16.2 Implementar RecurringPage con formulario y lista
    - Crear `src/pages/RecurringPage.tsx`
    - Crear `src/components/recurring/RecurringForm.tsx` con campos dependientes tipo→categoría→concepto
    - Crear `src/components/recurring/RecurringList.tsx` con acciones (generar, editar, desactivar, eliminar)
    - Crear `src/components/recurring/GenerateDialog.tsx` con confirmación antes de generar transacción
    - Deshabilitar botón generar para pagos inactivos
    - Diálogo de confirmación antes de eliminar
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [~] 16.3 Write property test for recurring payment to transaction mapping
    - **Property 26: Recurring Payment to Transaction Mapping**
    - **Validates: Requirements 13.4**

- [ ] 17. Implementar estados vacíos y responsive final
  - [~] 17.1 Implementar estados vacíos en todas las páginas
    - Agregar componente de estado vacío con descripción y enlace a creación/importación
    - Aplicar a: DataTablePage, DashboardPage, CashFlowPage, ReconciliationPage, AnalysisPage, RecurringPage
    - _Requirements: 2.4_

  - [~] 17.2 Verificar y ajustar diseño responsive
    - Asegurar que todo el contenido sea accesible sin scroll horizontal en ≥320px
    - Verificar reorganización vertical en ≤768px
    - Verificar que sidebar colapsa correctamente en mobile
    - _Requirements: 2.2, 2.3_

- [~] 18. Checkpoint final - Aplicación completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases with Vitest
- El motor de cálculos se implementa primero porque es la base para todos los módulos de UI
- Los catálogos se implementan antes de transacciones porque los formularios dependen de ellos
- La importación/exportación se implementa junto con la tabla de datos por cohesión funcional

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.5", "2.7", "2.9", "2.11"] },
    { "id": 4, "tasks": ["2.4", "2.6", "2.8", "2.10", "2.12"] },
    { "id": 5, "tasks": ["4.1", "4.3", "4.5", "4.7", "4.8", "4.10", "4.12"] },
    { "id": 6, "tasks": ["4.2", "4.4", "4.6", "4.9", "4.11", "4.13"] },
    { "id": 7, "tasks": ["6.1", "6.2", "6.3"] },
    { "id": 8, "tasks": ["6.4", "7.1"] },
    { "id": 9, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 10, "tasks": ["8.2", "8.3"] },
    { "id": 11, "tasks": ["10.1", "10.2"] },
    { "id": 12, "tasks": ["10.3", "10.4"] },
    { "id": 13, "tasks": ["10.5", "10.6"] },
    { "id": 14, "tasks": ["12.1", "13.1", "16.1"] },
    { "id": 15, "tasks": ["12.2", "13.2", "14.1", "15.1", "16.2"] },
    { "id": 16, "tasks": ["14.2", "15.2", "15.3", "16.3"] },
    { "id": 17, "tasks": ["17.1", "17.2"] }
  ]
}
```
