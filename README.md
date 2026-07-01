# Finanzas Personales

Aplicación web fullstack de gestión financiera personal construida con React + TypeScript + Vite y AWS Amplify Gen 2. Reemplaza flujos basados en hojas de cálculo con módulos interactivos para registro de transacciones, dashboards, flujo de caja, conciliación bancaria, análisis de datos y pagos recurrentes.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript, Vite 8 |
| Estilos | Tailwind CSS 4, shadcn/ui |
| Gráficas | Recharts 3 |
| Backend | AWS Amplify Gen 2 |
| Base de datos | DynamoDB (via AppSync/GraphQL) |
| Autenticación | Amazon Cognito |
| Tests | Vitest + fast-check (property-based testing) |

## Módulos de la Aplicación

- **Ingreso de Datos** — Formulario de registro de transacciones con campos dependientes
- **Tabla de Datos** — Tabla con búsqueda, filtros, ordenamiento, paginación, export/import CSV
- **Dashboard** — 8 KPIs, gráfica de dona, barras comparativas, tendencia mensual
- **Flujo de Caja** — Tabla de 12 meses con ingresos, egresos, flujo mensual y acumulado
- **Caja y Bancos** — Conciliación de saldos reales vs flujo acumulado
- **Catálogos** — Administración de categorías, conceptos, monedas, años
- **Análisis** — Tabla pivot con agrupación multidimensional y exportación
- **Pagos Recurrentes** — CRUD de pagos periódicos con generación de transacciones
- **Instrucciones** — Guía de onboarding con 7 pasos

## Requisitos Previos

Antes de empezar necesitas tener instalado:

1. **Node.js** >= 18 (recomendado 20+)
2. **npm** >= 9
3. **Git**
4. **AWS CLI** configurado con credenciales (para Amplify)
5. **Amplify CLI** (se instala como parte del flujo)

```bash
# Verificar versiones
node --version    # v20.x+
npm --version     # 9.x+
aws --version     # aws-cli/2.x
```

## Configuración Local (Sin Amplify)

La aplicación usa datos mock en memoria — puedes probarla localmente sin necesidad de una cuenta AWS:

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd FinanzasPersonales

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm run dev
```

Abre http://localhost:5173 en tu navegador.

> **Nota:** En modo local sin backend, la autenticación está mockeada. Los datos se almacenan en memoria y se pierden al recargar la página.

## Comandos Disponibles

```bash
npm run dev          # Servidor de desarrollo (Vite)
npm run build        # Compilar TypeScript + build producción
npm run preview      # Previsualizar build de producción
npm run test         # Ejecutar todos los tests (337 tests)
npm run test:watch   # Tests en modo watch
npm run test:coverage # Tests con reporte de cobertura
npm run lint         # ESLint
```

## Ejecutar Tests

```bash
# Todos los tests (unit + property-based)
npm run test

# Solo un archivo específico
npx vitest run src/lib/calculations/engine.test.ts

# Tests con output detallado
npx vitest run --reporter=verbose
```

El proyecto incluye 337 tests que cubren:
- Tests unitarios para todos los módulos
- 27 property-based tests con fast-check validando propiedades de correctitud formales

---

## Conectar a AWS Amplify (Backend Real)

### Paso 1: Instalar Amplify CLI

```bash
npm install -g @aws-amplify/cli
```

### Paso 2: Configurar credenciales AWS

Necesitas un perfil AWS con permisos de administrador:

```bash
aws configure
# Ingresa: Access Key ID, Secret Access Key, Region (us-east-1 recomendado)
```

O si ya tienes AWS SSO:
```bash
aws sso login --profile tu-perfil
```

### Paso 3: Iniciar sandbox de desarrollo (Amplify Gen 2)

Amplify Gen 2 usa un "sandbox" por desarrollador que despliega recursos reales en tu cuenta AWS para desarrollo:

```bash
npx ampx sandbox
```

Esto hace:
1. Lee `amplify/backend.ts`, `amplify/auth/resource.ts`, `amplify/data/resource.ts`
2. Despliega un stack de CloudFormation con:
   - **Cognito User Pool** para autenticación
   - **AppSync API** (GraphQL) para datos
   - **DynamoDB Tables** para cada modelo (Transaction, Category, Concept, etc.)
3. Genera `amplify_outputs.json` en la raíz del proyecto con la configuración del backend

> El sandbox se mantiene corriendo y detecta cambios en el schema automáticamente (hot-deploy).

### Paso 4: Configurar Amplify en el Frontend

Una vez generado `amplify_outputs.json`, actualiza `src/main.tsx`:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import './index.css';
import App from './App.tsx';

Amplify.configure(outputs);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### Paso 5: Reemplazar Mock Data Layer con Amplify Data Client

Los hooks actualmente usan datos en memoria (mock). Para conectar al backend real, reemplaza las llamadas mock con el cliente de Amplify:

```typescript
// En cada hook (useTransactions, useCatalogs, etc.), reemplazar:

// ANTES (mock):
const transactionStore: Record<string, TransactionRecord[]> = {};
async function loadTransactions(userId: string) { ... }

// DESPUÉS (Amplify real):
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

async function loadTransactions() {
  const { data, errors } = await client.models.Transaction.list();
  if (errors) throw new Error(errors[0].message);
  return data;
}

async function createTransaction(input: CreateTransactionInput) {
  const { data, errors } = await client.models.Transaction.create(input);
  if (errors) throw new Error(errors[0].message);
  return data;
}
```

> La autorización basada en propietario ya está configurada en el schema — Amplify filtra automáticamente por el usuario autenticado.

### Paso 6: Probar con backend real en local

```bash
# Terminal 1: Mantener sandbox corriendo
npx ampx sandbox

# Terminal 2: Servidor de desarrollo
npm run dev
```

Ahora al abrir http://localhost:5173:
- Verás la pantalla de login de Cognito
- Puedes registrar un usuario nuevo
- Los datos se persisten en DynamoDB

### Paso 7: Detener el sandbox

```bash
# Ctrl+C en la terminal donde corre ampx sandbox
# O manualmente:
npx ampx sandbox delete
```

---

## Desplegar a Producción en AWS Amplify

### Opción A: Despliegue desde Consola AWS (recomendado)

1. Ve a [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click "Create new app" → "Host web app"
3. Conecta tu repositorio (GitHub, GitLab, Bitbucket, CodeCommit)
4. Amplify detecta automáticamente la configuración Gen 2 (`amplify/backend.ts`)
5. Configura:
   - Build settings: se auto-detectan del `package.json`
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
6. Click "Save and deploy"

Amplify automáticamente:
- Despliega el backend (Cognito + AppSync + DynamoDB)
- Construye el frontend
- Lo sirve via CloudFront CDN
- Configura CI/CD para futuros pushes

### Opción B: Despliegue manual desde CLI

```bash
# 1. Construir el frontend
npm run build

# 2. Desplegar backend de producción
npx ampx pipeline-deploy --branch main --app-id <tu-app-id>
```

### Configurar Dominio Personalizado (Opcional)

En la consola de Amplify:
1. Ve a "Domain management"
2. Agrega tu dominio
3. Amplify genera el certificado SSL automáticamente
4. Configura los registros DNS según las instrucciones

---

## Estructura del Proyecto

```
FinanzasPersonales/
├── amplify/                      # Backend Amplify Gen 2
│   ├── auth/resource.ts          # Configuración Cognito
│   ├── data/resource.ts          # Schema DynamoDB/AppSync
│   ├── backend.ts                # Entry point
│   └── tsconfig.json
├── src/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/               # AppLayout, Sidebar, MobileNav
│   │   ├── transactions/         # Form, Table, Filters, EditDialog
│   │   ├── dashboard/            # KPICards, DonutChart, BarChart
│   │   ├── cashflow/             # CashFlowTable, CashFlowCharts
│   │   ├── reconciliation/       # Form, AccountBalances
│   │   ├── catalogs/             # CatalogManager
│   │   ├── analysis/             # PivotTable, Filters, Charts
│   │   ├── recurring/            # Form, List, GenerateDialog
│   │   └── import-export/        # CSVExporter, FileImporter, Preview
│   ├── hooks/                    # Custom hooks (useTransactions, etc.)
│   ├── lib/
│   │   ├── calculations/         # Motor de cálculos puro
│   │   ├── validators/           # Validadores de formulario
│   │   ├── export/               # CSV generation
│   │   └── utils/                # Fechas, formateo, filtrado, constantes
│   ├── pages/                    # Páginas/rutas
│   ├── contexts/                 # AuthContext, SettingsContext
│   ├── App.tsx                   # Router configuration
│   └── main.tsx                  # Entry point
├── .kiro/specs/                  # Spec de diseño (requirements, design, tasks)
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── tailwind.config.ts
```

## Modelo de Datos

| Entidad | Descripción |
|---------|-------------|
| Transaction | Registro individual de ingreso/egreso |
| Category | Categoría de primer nivel (Ingreso/Egreso) |
| Concept | Concepto de segundo nivel (pertenece a Category) |
| CashAccount | Cuenta bancaria/billetera |
| CashReconciliation | Registro de conciliación mensual |
| CashBalance | Saldo por cuenta en una conciliación |
| RecurringPayment | Pago recurrente configurado |
| AppSetting | Configuración del usuario (defaults) |
| ImportBatch | Registro de importación masiva |

Todas las entidades usan autorización basada en propietario — cada usuario solo ve sus propios datos.

## Cosas Pendientes para Producción

- [ ] Reemplazar mock data layers con Amplify Data Client real (ver Paso 5 arriba)
- [ ] Agregar `Amplify.configure(outputs)` en main.tsx
- [ ] Agregar soporte de importación Excel (requiere librería `xlsx`/SheetJS)
- [ ] Agregar toast notifications para feedback de operaciones
- [ ] Agregar manejo de errores de red con retry automático
- [ ] Agregar service worker para modo offline parcial
- [ ] Configurar monitoring con CloudWatch
- [ ] Agregar rate limiting en el frontend para prevenir spam de requests

## Licencia

Privado - Uso personal.
