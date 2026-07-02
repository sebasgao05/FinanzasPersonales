# Finanzas Personales

Aplicación web fullstack de gestión financiera personal construida con React + TypeScript + Vite y AWS Amplify Gen 2. Reemplaza flujos basados en hojas de cálculo con módulos interactivos para registro de transacciones, dashboards, flujo de caja, conciliación bancaria, análisis de datos y pagos recurrentes.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript, Vite 8 |
| Estilos | Tailwind CSS 4, shadcn/ui |
| Gráficas | Recharts 3 |
| Backend | AWS Amplify Gen 2 (AppSync + DynamoDB) |
| Base de datos | Amazon DynamoDB (via GraphQL/AppSync) |
| Autenticación | Amazon Cognito |
| Hosting | AWS Amplify Hosting (CloudFront CDN) |
| Package Manager | pnpm 11 |
| Tests | Vitest + fast-check (property-based testing) |
| CI/CD | AWS Amplify CI/CD (auto-deploy on push) |

---

## Arquitectura e Infraestructura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React SPA)                     │
│                                                                  │
│  React 19 + TypeScript + Vite 8 + Tailwind CSS 4                │
│  Servido via AWS CloudFront (CDN Global)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS AMPLIFY HOSTING                          │
│                                                                  │
│  ┌───────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  CloudFront   │  │  Amplify CI/CD   │  │  S3 (assets)     │ │
│  │  (CDN global) │  │  (build + deploy)│  │  (dist/ bundle)  │ │
│  └───────────────┘  └──────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS BACKEND (Serverless)                     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              AWS AppSync (GraphQL API)                      │  │
│  │  - Queries, Mutations, Subscriptions (real-time)           │  │
│  │  - Autorización por owner (Cognito User Pool)              │  │
│  │  - Resolvers VTL auto-generados por Amplify               │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                              │                                    │
│  ┌───────────────┐  ┌───────┴──────────────────────────────┐   │
│  │ Amazon Cognito│  │         Amazon DynamoDB               │   │
│  │               │  │                                       │   │
│  │ - User Pool   │  │  9 tablas (una por modelo):           │   │
│  │ - Login/MFA   │  │  ├── Transaction                      │   │
│  │ - JWT tokens  │  │  ├── Category                         │   │
│  │ - Email verif.│  │  ├── Concept                          │   │
│  │               │  │  ├── CashAccount                      │   │
│  └───────────────┘  │  ├── CashReconciliation               │   │
│                      │  ├── CashBalance                      │   │
│                      │  ├── RecurringPayment                 │   │
│                      │  ├── AppSetting                       │   │
│                      │  └── ImportBatch                      │   │
│                      └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
Usuario → CloudFront → React SPA → AppSync (GraphQL) → DynamoDB
                                         ↓
                              Cognito valida JWT token
                              AppSync filtra por owner
                              Solo retorna datos del usuario
```

### Seguridad

- **Autenticación**: Amazon Cognito con email + contraseña, verificación por código
- **Autorización**: Basada en propietario (`allow.owner()`) — cada usuario solo accede a sus datos
- **Tokens**: JWT con refresh automático
- **HTTPS**: Forzado en todos los endpoints via CloudFront
- **CORS**: Configurado automáticamente por AppSync

### Costo Estimado (Uso Personal)

| Servicio | Costo/mes |
|----------|-----------|
| Cognito | $0 (hasta 50,000 usuarios) |
| DynamoDB | $0 (25GB + 25 WCU/RCU gratis) |
| AppSync | ~$0.01 (4M queries/mes gratis) |
| Amplify Hosting | ~$0 (1000 min build + 15GB gratis) |
| CloudFront | $0 (1TB transfer primer año) |
| **Total** | **$0 - $1/mes** |

---

## Módulos de la Aplicación

- **Ingreso de Datos** — Formulario de registro de transacciones con campos dependientes
- **Tabla de Datos** — Tabla con búsqueda, filtros, ordenamiento, paginación, export/import CSV
- **Dashboard** — 8 KPIs, gráfica de dona, barras comparativas, tendencia mensual
- **Flujo de Caja** — Tabla de 12 meses con ingresos, egresos, flujo mensual y acumulado
- **Caja y Bancos** — Conciliación de saldos reales vs flujo acumulado (en tiempo real)
- **Catálogos** — Administración de categorías, conceptos, monedas, años
- **Análisis** — Tabla pivot con agrupación multidimensional y exportación
- **Pagos Recurrentes** — CRUD de pagos periódicos con generación de transacciones
- **Instrucciones** — Guía de onboarding con 7 pasos

---

## Requisitos Previos

```bash
# Node.js 18+ (recomendado 20+)
node --version

# pnpm (package manager del proyecto)
pnpm --version    # 9+ requerido

# AWS CLI v2 (para desarrollo con backend)
aws --version

# Git
git --version
```

### Instalar pnpm (si no lo tienes)

```bash
npm install -g pnpm
# o via corepack (incluido en Node.js 16+):
corepack enable
corepack prepare pnpm@latest --activate
```

---

## Configuración Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/david-barrera-blend/FinanzasPersonales.git
cd FinanzasPersonales

# 2. Instalar dependencias
pnpm install

# 3. Ejecutar en modo desarrollo
pnpm dev
```

Abre http://localhost:5173 en tu navegador.

> **Nota:** La app está conectada a Amplify. Necesitas el backend desplegado para funcionar completamente (ver DEPLOY_AMPLIFY.md).

---

## Comandos Disponibles

```bash
pnpm dev             # Servidor de desarrollo (Vite)
pnpm build           # TypeScript check + build producción
pnpm build:ci        # Solo Vite build (sin type-check, usado en CI)
pnpm preview         # Previsualizar build de producción
pnpm test            # Ejecutar todos los tests (337 tests)
pnpm test:watch      # Tests en modo watch
pnpm test:coverage   # Tests con reporte de cobertura
pnpm lint            # ESLint
```

---

## Ejecutar Tests

```bash
# Todos los tests (unit + property-based)
pnpm test

# Solo un archivo específico
pnpm exec vitest run src/lib/calculations/engine.test.ts

# Tests con output detallado
pnpm exec vitest run --reporter=verbose
```

El proyecto incluye **337 tests** que cubren:
- Tests unitarios para todos los módulos de cálculo
- 27 property-based tests con fast-check validando propiedades matemáticas

---

## Estructura del Proyecto

```
FinanzasPersonales/
├── amplify/                      # Backend Amplify Gen 2
│   ├── auth/resource.ts          # Configuración Amazon Cognito
│   ├── data/resource.ts          # Schema DynamoDB/AppSync (9 modelos)
│   ├── backend.ts                # Entry point del backend
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
│   │   └── import-export/        # CSVExporter, FileImporter
│   ├── hooks/                    # Custom hooks conectados a Amplify Data
│   │   ├── useTransactions.ts    # CRUD + real-time subscriptions
│   │   ├── useCatalogs.ts        # Category/Concept CRUD
│   │   ├── useDashboard.ts       # KPIs + distribución
│   │   ├── useCashFlow.ts        # Flujo mensual/acumulado
│   │   ├── useReconciliation.ts  # Caja y bancos
│   │   └── useRecurringPayments.ts
│   ├── lib/
│   │   ├── amplify-client.ts     # Cliente tipado de Amplify Data
│   │   ├── calculations/         # Motor de cálculos puro
│   │   ├── validators/           # Validadores de formulario
│   │   ├── export/               # Generación CSV
│   │   └── utils/                # Fechas, formateo, filtrado, constantes
│   ├── contexts/                 # AuthContext, SettingsContext
│   ├── pages/                    # 9 páginas/rutas
│   ├── App.tsx                   # Router + providers
│   └── main.tsx                  # Entry point + Amplify.configure()
├── amplify.yml                   # Build settings para Amplify Hosting
├── .npmrc                        # pnpm config (node-linker=hoisted)
├── pnpm-lock.yaml                # Lockfile (committed)
├── pnpm-workspace.yaml           # Configuración workspace
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Modelo de Datos

| Entidad | Descripción | Relaciones |
|---------|-------------|------------|
| Transaction | Registro de ingreso/egreso | — |
| Category | Categoría (Ingreso/Egreso) | hasMany → Concept |
| Concept | Concepto de segundo nivel | belongsTo → Category |
| CashAccount | Cuenta bancaria/billetera | — |
| CashReconciliation | Conciliación mensual | hasMany → CashBalance |
| CashBalance | Saldo por cuenta en conciliación | belongsTo → CashReconciliation |
| RecurringPayment | Pago recurrente configurado | — |
| AppSetting | Configuración del usuario | — |
| ImportBatch | Registro de importación masiva | — |

Todas las entidades usan `allow.owner()` — cada usuario solo accede a sus propios datos.

---

## Despliegue

Ver [DEPLOY_AMPLIFY.md](./DEPLOY_AMPLIFY.md) para la guía completa de despliegue en tu propia cuenta AWS.

## Testing Local

Ver [TESTING_LOCAL.md](./TESTING_LOCAL.md) para la guía de validación funcional.

---

## Licencia

Privado - Uso personal.
