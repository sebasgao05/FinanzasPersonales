# Guía de Validación — Finanzas Personales

Guía para verificar que la aplicación funciona correctamente con el backend de Amplify.

---

## 1. Preparar el Ambiente

```bash
cd FinanzasPersonales
pnpm install

# Terminal 1: Backend (sandbox personal en tu cuenta AWS)
npx ampx sandbox

# Terminal 2: Frontend
pnpm dev
```

Abre http://localhost:5173

---

## 2. Estado Actual: Conectado a Amplify

La aplicación está **completamente conectada** al backend real de AWS:

| Componente | Estado | Persistencia |
|-----------|--------|-------------|
| Autenticación | ✅ Cognito real | Sesión JWT con refresh |
| Transacciones | ✅ DynamoDB + real-time | Persisten entre sesiones |
| Categorías/Conceptos | ✅ DynamoDB | Persisten entre sesiones |
| Settings | ✅ DynamoDB | Persisten entre sesiones |
| Conciliación | ✅ DynamoDB | Persisten entre sesiones |
| Pagos Recurrentes | ✅ DynamoDB | Persisten entre sesiones |
| Monedas/Años | ✅ localStorage | Persisten en el navegador |

---

## 3. Primer Uso — Flujo Recomendado

### Paso 1: Registrar usuario

1. Abre la app → pantalla de login
2. Click "Create Account"
3. Email + contraseña (min 8 chars, 1 mayúscula, 1 número, 1 especial)
4. Revisa email → ingresa código de verificación
5. Inicia sesión

### Paso 2: Crear catálogos

Ve a **Catálogos** (`/catalogos`) y crea:

```
Categorías de Egreso:
  - Alimentación → Conceptos: Supermercado, Restaurante
  - Transporte   → Conceptos: Gasolina, Uber
  - Vivienda     → Conceptos: Arriendo, Servicios

Categorías de Ingreso:
  - Salario      → Conceptos: Nómina, Bonos
  - Freelance    → Conceptos: Proyectos, Consultoría
```

### Paso 3: Registrar transacciones

Ve a **Ingreso de Datos** (`/ingreso`) y registra 5-10 transacciones variadas.

### Paso 4: Verificar en las demás páginas

- **Datos** → tabla con todas las transacciones
- **Dashboard** → KPIs y gráficas con nombres de categoría correctos
- **Flujo de Caja** → tabla mensual con totales
- **Análisis** → pivot por categoría con presupuesto vs real
- **Caja y Bancos** → acumulado automático refleja el balance

---

## 4. Checklist de Verificación por Página

### 4.1 Ingreso de Datos (`/ingreso`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Campos dependientes: Tipo → Categoría → Concepto | ✅ Se filtran correctamente |
| 2 | Guardar transacción | ✅ Mensaje de éxito, formulario se limpia |
| 3 | Recargar página y ver en Datos | ✅ La transacción persiste |
| 4 | "Guardar y crear otro" mantiene tipo/categoría/moneda | ✅ |
| 5 | Validación de campos vacíos | ✅ Errores inline |

### 4.2 Tabla de Datos (`/datos`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Transacciones muestran nombre de categoría (no código) | ✅ |
| 2 | Búsqueda filtra en tiempo real | ✅ |
| 3 | Ordenar por columna | ✅ Click en header |
| 4 | Editar transacción | ✅ Diálogo con datos prellenados |
| 5 | Eliminar transacción | ✅ Confirmación + desaparece |
| 6 | Exportar CSV | ✅ Descarga archivo con datos |

### 4.3 Dashboard (`/dashboard`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | KPIs con valores correctos | ✅ Ingresos, Egresos, Balance |
| 2 | Gráfica de dona muestra nombres de categoría | ✅ No IDs |
| 3 | Cambiar filtros recalcula | ✅ Mes/Año/Moneda |
| 4 | Estado vacío si no hay datos para el filtro | ✅ |

### 4.4 Flujo de Caja (`/flujo-caja`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Tabla de 12 meses con valores | ✅ |
| 2 | Acumulado se calcula correctamente | ✅ |
| 3 | Selector de año funciona | ✅ |

### 4.5 Caja y Bancos (`/caja-bancos`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Acumulado automático refleja balance total | ✅ Suma ingresos - egresos |
| 2 | Modificar saldos recalcula en tiempo real | ✅ |
| 3 | Indicador: Cuadrado / Falta ubicar / Sobra | ✅ |
| 4 | Agregar nueva cuenta | ✅ Persiste |
| 5 | "Guardar conciliación" | ✅ Sin error, mensaje de éxito |

### 4.6 Catálogos (`/catalogos`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Agregar categoría persiste al recargar | ✅ |
| 2 | Agregar concepto persiste al recargar | ✅ |
| 3 | Agregar moneda personalizada persiste | ✅ |
| 4 | Agregar año persiste | ✅ |
| 5 | Editar nombre funciona | ✅ |
| 6 | Eliminar/desactivar funciona | ✅ |

### 4.7 Análisis (`/analisis`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Tabla pivot muestra nombres de categoría | ✅ No IDs |
| 2 | Gráfica "Presupuesto vs Real" con nombres | ✅ |
| 3 | Agrupar por múltiples dimensiones | ✅ |
| 4 | Exportar CSV | ✅ |

### 4.8 Pagos Recurrentes (`/pagos-recurrentes`)

| # | Verificar | Esperado |
|---|-----------|----------|
| 1 | Crear pago muestra nombre de categoría (no ID) | ✅ |
| 2 | Lista muestra datos correctos | ✅ |
| 3 | "Generar" crea transacción | ✅ Aparece en Datos |
| 4 | Editar/Eliminar funciona | ✅ |

---

## 5. Tests Automatizados

```bash
pnpm test
```

**Resultado esperado:**
```
 Test Files  31 passed (31)
      Tests  337 passed (337)
   Duration  ~15s
```

---

## 6. Build de Producción

```bash
pnpm build
```

Resultado:
- TypeScript compila sin errores
- Vite genera bundle en `dist/`
- ~380KB gzipped

```bash
pnpm preview    # Previsualizar en localhost:4173
```

---

## 7. Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| Pantalla en blanco | Error JS no capturado | Abrir DevTools → Console |
| Login no funciona | Backend no desplegado | Ejecutar `npx ampx sandbox` |
| Categorías vacías en formularios | No se han creado catálogos | Ir a /catalogos primero |
| Categoría muestra código | Transacción vieja pre-fix | Los nombres se resuelven desde el catálogo |
| Conciliación no guarda | Error de AppSync | Verificar consola del navegador |
| Monedas no persisten | localStorage borrado | Volver a agregarlas |
| "useSettings must be used within SettingsProvider" | Provider faltante | Verificar App.tsx |

---

## 8. Infraestructura para Tu Propia Nube

Para desplegar en **tu propia cuenta AWS**:

1. **Fork** el repositorio a tu GitHub
2. **Configura** AWS CLI con tus credenciales (`aws configure`)
3. **Crea** la app en Amplify Console conectando tu repo
4. **Selecciona** instancia de build "Grande" (16GB)
5. **Despliega** — Amplify crea todo automáticamente:
   - Cognito User Pool (login con email)
   - AppSync API (GraphQL)
   - 9 tablas DynamoDB
   - CloudFront CDN
   - Certificado SSL

**No necesitas configurar nada manualmente.** El `amplify/` directory define toda la infraestructura como código.

Ver [DEPLOY_AMPLIFY.md](./DEPLOY_AMPLIFY.md) para instrucciones detalladas.
