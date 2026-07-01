# Guía de Validación Local — Finanzas Personales

Esta guía describe qué esperar al ejecutar la aplicación localmente y cómo verificar que cada módulo funciona correctamente.

---

## 1. Arrancar la Aplicación

```bash
cd FinanzasPersonales
npm install        # Solo la primera vez
npm run dev        # Inicia en http://localhost:5173
```

---

## 2. Estado Actual: Modo Mock (Sin Backend)

La aplicación actualmente usa **datos en memoria**. Esto significa:

| Comportamiento | Qué esperar |
|---------------|-------------|
| Login | La pantalla de login aparece pero **no puedes autenticarte** sin Amplify real |
| Datos | Se pierden al recargar la página |
| Navegación | Funciona completamente |
| Formularios | Validación completa funciona |
| Cálculos | Funcionan correctamente |
| Gráficas | Se renderizan pero sin datos reales |

### Para bypass del login en modo desarrollo

Actualmente el `AuthContext` intenta verificar con Cognito. Para probar la UI sin backend, necesitas hacer un cambio temporal:

**Archivo: `src/contexts/AuthContext.tsx`** — Reemplaza temporalmente el provider para simular un usuario autenticado:

```typescript
// TEMPORAL — para pruebas locales sin backend
export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthContextValue = {
    user: { userId: 'local-test-user', username: 'testuser' } as any,
    isAuthenticated: true,
    isLoading: false,
    signOut: async () => { window.location.href = '/'; },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

> ⚠️ **No subas este cambio a producción.** Es solo para verificación local.

---

## 3. Checklist de Verificación por Página

### 3.1 Página de Instrucciones (`/instrucciones`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Se muestran 7 tarjetas | ✅ Tarjetas numeradas del 1 al 7 |
| 2 | Cada tarjeta tiene título y descripción | ✅ Texto descriptivo visible |
| 3 | Click en tarjeta navega a la página correcta | ✅ Redirige según el paso |
| 4 | Diseño responsive | ✅ 1 columna en móvil, 2 en tablet, 3 en desktop |

---

### 3.2 Ingreso de Datos (`/ingreso`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Formulario con todos los campos visibles | ✅ Fecha, Tipo, Categoría, Concepto, Detalle, Presupuesto, Monto, Moneda, Notas |
| 2 | Tipo muestra Ingreso/Egreso | ✅ Dropdown con ambas opciones |
| 3 | Categoría se filtra al seleccionar Tipo | ✅ Solo muestra categorías del tipo seleccionado |
| 4 | Concepto se filtra al seleccionar Categoría | ✅ Solo muestra conceptos de esa categoría |
| 5 | Fecha auto-calcula Mes y Año | ✅ Texto debajo del campo fecha muestra "Marzo 2024" |
| 6 | Validación: campos vacíos | ✅ Mensajes rojos en campos obligatorios al dar Guardar |
| 7 | Validación: monto fuera de rango | ✅ Error si monto <= 0 o > 999,999,999.99 |
| 8 | Botón "Guardar" limpia todo el formulario | ✅ Todos los campos se resetean |
| 9 | Botón "Guardar y crear otro" mantiene Tipo/Categoría/Moneda | ✅ Solo limpia fecha, concepto, monto, detalle, notas |
| 10 | Botón "Limpiar" resetea sin guardar | ✅ Formulario limpio, no se crea transacción |
| 11 | Moneda preseleccionada con COP | ✅ Default del SettingsContext |

> **Nota:** Para que las categorías/conceptos aparezcan, primero debes crearlos en Catálogos.

---

### 3.3 Catálogos (`/catalogos`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Sección "Tipos" muestra Ingreso y Egreso | ✅ Con ícono de candado (base, no eliminable) |
| 2 | Sección "Categorías de Ingreso" permite agregar | ✅ Input + botón "Agregar" |
| 3 | Agregar categoría con nombre vacío | ✅ Muestra error "El nombre es obligatorio" |
| 4 | Agregar categoría con nombre > 50 chars | ✅ Muestra error de longitud |
| 5 | Agregar categoría duplicada | ✅ Muestra error "Ya existe un elemento con este nombre" |
| 6 | Agregar categoría válida | ✅ Aparece en la lista |
| 7 | Editar nombre (ícono lápiz) | ✅ Cambia a input inline, Enter confirma, Esc cancela |
| 8 | Eliminar categoría (ícono basura) | ✅ Diálogo de confirmación antes de eliminar |
| 9 | Items base no tienen botón eliminar habilitado | ✅ Botón deshabilitado con tooltip |
| 10 | Sección "Meses" muestra 12 meses protegidos | ✅ Enero a Diciembre, no editables |
| 11 | Sección "Monedas" muestra COP, USD, EUR como base | ✅ Con ícono candado |
| 12 | Conceptos agrupados por categoría | ✅ Sub-secciones con nombre de categoría |

**Flujo de prueba sugerido:**
1. Ir a Catálogos
2. Agregar categoría de Egreso: "Alimentación"
3. Agregar categoría de Egreso: "Transporte"
4. Agregar concepto en Alimentación: "Supermercado"
5. Agregar concepto en Alimentación: "Restaurante"
6. Agregar categoría de Ingreso: "Salario"
7. Agregar concepto en Salario: "Nómina"
8. Ir a Ingreso de Datos y verificar que los dropdowns se llenan

---

### 3.4 Tabla de Datos (`/datos`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Estado vacío cuando no hay transacciones | ✅ Mensaje "No hay transacciones" con ícono |
| 2 | Botones "Exportar CSV" y "Descargar plantilla" visibles | ✅ Dos botones en la parte superior |
| 3 | Barra de búsqueda funciona | ✅ Filtra en tiempo real por detalle, categoría, concepto, notas |
| 4 | Filtros dropdown (Mes, Año, Tipo, Categoría, Concepto) | ✅ Dropdowns con opciones |
| 5 | Tabla muestra 13 columnas | ✅ Con scroll horizontal si necesario |
| 6 | Headers de columna clickeables para ordenar | ✅ Flecha indica dirección |
| 7 | Totales en pie de tabla | ✅ Ingresos (verde), Egresos (rojo), Balance |
| 8 | Paginación (50 por página) | ✅ Controles prev/next abajo |
| 9 | Botón Editar abre diálogo | ✅ Modal con datos actuales prellenados |
| 10 | Botón Eliminar pide confirmación | ✅ Diálogo con detalles de la transacción |
| 11 | Exportar CSV descarga archivo | ✅ Archivo .csv con los registros filtrados |
| 12 | Descargar plantilla descarga archivo | ✅ CSV con solo encabezados |

---

### 3.5 Importación de Datos (dentro de `/datos`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Sección de importación visible | ✅ Input de archivo con instrucciones |
| 2 | Seleccionar archivo no-CSV/Excel | ✅ Error "Formato no soportado" |
| 3 | Seleccionar CSV válido | ✅ Muestra vista previa de 10 filas |
| 4 | Vista previa muestra indicador OK/Error por fila | ✅ Ícono verde o rojo |
| 5 | Confirmar importación | ✅ Resumen: total, exitosas, errores |
| 6 | Errores muestran fila y causa | ✅ Tabla de detalle de errores |

**Archivo CSV de prueba (crear como `test-import.csv`):**
```csv
Fecha,Tipo,Categoría,Concepto,Detalle,Presupuesto,Monto real,Moneda,Notas
2024-03-15,Egreso,Alimentación,Supermercado,Compra semanal,500000,450000,COP,Pago tarjeta
2024-03-16,Ingreso,Salario,Nómina,Marzo,5000000,5000000,COP,
2024-03-17,Egreso,Transporte,Gasolina,Tanqueo,,200000,COP,Shell
2024-03-18,Invalido,Test,Test,,,-100,COP,Esta fila debe fallar
```

---

### 3.6 Dashboard (`/dashboard`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Filtros de Mes, Año, Moneda visibles | ✅ Preseleccionados con defaults |
| 2 | Estado vacío si no hay datos | ✅ Mensaje descriptivo |
| 3 | Con datos: 8 tarjetas KPI | ✅ Ingresos, Egresos, Balance, Presupuestos, Diferencias, % |
| 4 | Gráfica de dona (distribución egresos) | ✅ Colores por categoría, leyenda |
| 5 | Gráfica de barras (ingresos vs egresos) | ✅ Dos barras comparativas |
| 6 | Gráfica de tendencia mensual | ✅ Barras verdes/rojas por mes |
| 7 | Cambiar filtros recalcula todo | ✅ KPIs y gráficas se actualizan |

---

### 3.7 Flujo de Caja (`/flujo-caja`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Selector de año en la parte superior | ✅ Dropdown con años |
| 2 | Estado vacío si no hay datos para el año | ✅ Mensaje + link a ingreso |
| 3 | Con datos: tabla de 12 columnas (meses) | ✅ Ene a Dic |
| 4 | 5 filas: Ingreso, Egreso, %, Flujo mensual, Acumulado | ✅ Con colores |
| 5 | Scroll horizontal en móvil | ✅ Tabla scrolleable |
| 6 | Gráfica de línea (flujo acumulado) | ✅ Línea azul |
| 7 | Gráfica de barras (ingreso vs egreso por mes) | ✅ Verde y rojo |

---

### 3.8 Caja y Bancos (`/caja-bancos`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | 6 cuentas predeterminadas | ✅ Efectivo, Nequi, Daviplata, Bancolombia, Lulo, Nu |
| 2 | Campos de saldo editables por cuenta | ✅ Inputs numéricos |
| 3 | Agregar nueva cuenta | ✅ Input + botón, valida nombre |
| 4 | Editar nombre de cuenta (ícono lápiz) | ✅ Input inline |
| 5 | Desactivar cuenta (ícono ojo) | ✅ Se mueve a sección "Inactivas" |
| 6 | Indicador de estado: Cuadrado/Falta ubicar/Sobra | ✅ Badge de color |
| 7 | Total ubicado, Pendiente, % ubicado | ✅ Valores calculados |
| 8 | Gráfica de distribución de saldos | ✅ Barras por cuenta |
| 9 | Botón "Guardar conciliación" | ✅ Mensaje de éxito |
| 10 | Máximo 20 cuentas | ✅ Error si intentas agregar más |

---

### 3.9 Análisis (`/analisis`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Checkboxes de dimensiones | ✅ Mes, Año, Tipo, Categoría, Concepto |
| 2 | Rango de fechas con defaults del año | ✅ Inputs date |
| 3 | Sin dimensiones seleccionadas | ✅ Mensaje "Selecciona al menos una dimensión" |
| 4 | Con dimensiones: tabla pivot | ✅ Filas = combinaciones, columnas = métricas |
| 5 | Columnas: Presupuesto, Monto real, % Ejecución | ✅ Formateados |
| 6 | Gráfica de barras (presupuesto vs real) | ✅ Barras azul y verde |
| 7 | Botón Exportar CSV | ✅ Descarga datos de la tabla pivot |
| 8 | Estado vacío sin transacciones | ✅ Mensaje descriptivo |

---

### 3.10 Pagos Recurrentes (`/pagos-recurrentes`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Formulario de creación visible | ✅ Campos: Nombre, Tipo, Categoría, etc. |
| 2 | Campos dependientes (Tipo→Categoría→Concepto) | ✅ Se filtran como en Ingreso |
| 3 | Frecuencia "Personalizada" muestra campo extra | ✅ Input "Intervalo (días)" |
| 4 | Validación completa del formulario | ✅ Errores inline por campo |
| 5 | Crear pago recurrente | ✅ Aparece en la lista abajo |
| 6 | Lista con acciones: Generar, Editar, Desactivar, Eliminar | ✅ Botones por fila |
| 7 | "Generar" deshabilitado si inactivo | ✅ Botón gris con tooltip |
| 8 | "Generar" muestra diálogo de confirmación | ✅ Modal con detalles |
| 9 | Confirmar genera la transacción | ✅ Mensaje de éxito |
| 10 | "Eliminar" pide confirmación | ✅ Diálogo antes de borrar |

---

### 3.11 Navegación y Layout

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Sidebar visible en desktop (> 768px) | ✅ Lista de 9 páginas |
| 2 | Elemento activo resaltado | ✅ Background diferente |
| 3 | Sidebar oculta en móvil (≤ 768px) | ✅ No visible |
| 4 | Menú hamburguesa visible en móvil | ✅ Ícono en barra superior |
| 5 | Click en hamburguesa abre sidebar deslizante | ✅ Animación de apertura |
| 6 | Seleccionar enlace cierra sidebar móvil | ✅ Se cierra automáticamente |
| 7 | Botón "Cerrar sesión" en sidebar | ✅ Al fondo de la sidebar |
| 8 | Sin scroll horizontal en 320px | ✅ Todo accesible verticalmente |

---

## 4. Verificación de Tests

```bash
npm run test
```

**Resultado esperado:**
```
 Test Files  31 passed (31)
      Tests  337 passed (337)
   Duration  ~20s
```

Si algún test falla, el output indica exactamente qué propiedad no se cumple.

---

## 5. Verificación de Build

```bash
npm run build
```

**Resultado esperado:**
- TypeScript compila sin errores
- Vite genera bundle en `dist/`
- Tamaño del bundle: ~300-500KB gzipped (aproximado)

```bash
npm run preview    # Previsualizar el build de producción en localhost:4173
```

---

## 6. Flujo de Prueba End-to-End Sugerido

Sigue este orden para una validación completa:

1. **Catálogos** → Crear categorías y conceptos (requisito para formularios)
2. **Ingreso** → Registrar 5-10 transacciones variadas (ingresos y egresos)
3. **Datos** → Verificar que aparecen en la tabla, filtrar, buscar, ordenar
4. **Dashboard** → Ver KPIs y gráficas reflejando los datos ingresados
5. **Flujo de Caja** → Verificar tabla mensual y gráficas
6. **Caja y Bancos** → Ingresar saldos, verificar indicador de estado
7. **Análisis** → Agrupar por categoría, verificar presupuesto vs real
8. **Pagos Recurrentes** → Crear uno, generar transacción, verificar en Datos
9. **Importación** → Importar CSV de prueba, verificar resumen
10. **Exportación** → Exportar CSV, abrir en Excel, verificar datos

---

## 7. Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| Pantalla en blanco | Error JS en consola | Abrir DevTools → Console |
| Login no funciona | No hay backend Amplify | Usar mock de AuthContext (ver sección 2) |
| Categorías vacías en formularios | No se han creado catálogos | Ir primero a /catalogos |
| Datos desaparecen al recargar | Mock usa memoria volátil | Normal en modo mock, se resuelve con Amplify |
| Gráficas no muestran datos | No hay transacciones | Registrar al menos 3-5 transacciones primero |
| Error "useAuth must be used within AuthProvider" | Componente fuera del provider | Verificar que App.tsx tiene AuthProvider |
| Tests fallan | Dependencia no instalada | Ejecutar `npm install` |
