# 💰 Finanzas Personales

[![AWS Amplify](https://img.shields.io/badge/AWS%20Amplify-Gen%202-FF9900?logo=aws-amplify&logoColor=white)](https://docs.amplify.aws/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-337%20passed-brightgreen?logo=vitest&logoColor=white)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Aplicación web fullstack de gestión financiera personal construida con **React + TypeScript + Vite** y **AWS Amplify Gen 2**. Reemplaza flujos basados en hojas de cálculo con módulos interactivos para registro de transacciones, dashboards, flujo de caja, conciliación bancaria, análisis de datos y pagos recurrentes.

> 🎯 **Objetivo**: Tener control total de finanzas personales con una app privada, serverless, y con costo cercano a $0/mes.

---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura e Infraestructura](#-arquitectura-e-infraestructura)
- [Módulos de la Aplicación](#-módulos-de-la-aplicación)
- [Modelo de Datos](#-modelo-de-datos)
- [Requisitos Previos](#-requisitos-previos)
- [Configuración Local](#-configuración-local)
- [Comandos Disponibles](#-comandos-disponibles)
- [Testing](#-testing)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Despliegue](#-despliegue)
- [Seguridad](#-seguridad)
- [Costo Estimado](#-costo-estimado)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🛠 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + TypeScript | 19 / 5.7 |
| Bundler | Vite | 8.1 |
| Estilos | Tailwind CSS + shadcn/ui | 4.3 |
| Gráficas | Recharts | 3.9 |
| Routing | React Router DOM | 7.18 |
| Backend | AWS Amplify Gen 2 (AppSync + DynamoDB) | 1.23 |
| API | AWS AppSync (GraphQL) | — |
| Base de datos | Amazon DynamoDB (On-Demand) | — |
| Autenticación | Amazon Cognito (User Pool + Identity Pool) | — |
| Hosting | AWS Amplify Hosting (CloudFront CDN + S3) | — |
| IaC | AWS CloudFormation (Nested Stacks via Amplify) | — |
| Package Manager | pnpm | 11 |
| Tests | Vitest + fast-check (property-based) | 4.1 / 4.8 |
| CI/CD | AWS Amplify CI/CD (auto-deploy on push) | — |
| Linting | ESLint + typescript-eslint | 10 / 8.62 |

---

## 🏗 Arquitectura e Infraestructura

> 📐 **Diagrama interactivo**: Abre [`docs/architecture/infrastructure.drawio`](./docs/architecture/infrastructure.drawio) con la extensión Draw.io en VS Code o en [app.diagrams.net](https://app.diagrams.net).

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USUARIO (Browser)                              │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ HTTPS
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AWS AMPLIFY HOSTING                                │
│                                                                          │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │  CloudFront    │  │  Amplify CI/CD   │  │  S3 Bucket             │  │
│  │  (CDN Global)  │──│  (amplify.yml)   │──│  (React SPA Bundle)    │  │
│  └────────────────┘  └──────────────────┘  └────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ GraphQL (WSS + HTTPS)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AWS BACKEND (Serverless)                           │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  AWS AppSync (GraphQL API)                        │   │
│  │  Endpoint: zwa4u3zsvzcyzn6obtlmmqk27u.appsync-api.us-east-1     │   │
│  │  Auth: AMAZON_COGNITO_USER_POOLS | AWS_IAM                       │   │
│  │  Resolvers: VTL auto-generated (56 templates)                    │   │
│  │  Features: Queries, Mutations, Subscriptions (real-time)         │   │
│  └──────────────────────────────────┬──────────────────────────────┘   │
│                                      │                                   │
│  ┌────────────────────┐   ┌─────────┴───────────────────────────────┐  │
│  │  Amazon Cognito    │   │           Amazon DynamoDB                 │  │
│  │                    │   │                                           │  │
│  │  User Pool:        │   │  9 tablas (On-Demand Capacity):          │  │
│  │  us-east-1_xZVI... │   │  ├── Transaction                        │  │
│  │                    │   │  ├── Category ──┐                        │  │
│  │  Identity Pool:    │   │  ├── Concept ───┘ (hasMany/belongsTo)    │  │
│  │  91ba2fa8-d71e...  │   │  ├── CashAccount                        │  │
│  │                    │   │  ├── CashReconciliation ──┐              │  │
│  │  Login: Email      │   │  ├── CashBalance ────────┘ (1:N)        │  │
│  │  MFA: None         │   │  ├── RecurringPayment                    │  │
│  │  JWT tokens        │   │  ├── AppSetting                          │  │
│  └────────────────────┘   │  └── ImportBatch                         │  │
│                            └─────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  AWS IAM + CloudFormation                                         │   │
│  │  • AuthRole / UnauthRole (Cognito Identity Pool)                  │   │
│  │  • AppSync Service Role                                           │   │
│  │  • 12+ Nested CloudFormation Stacks (auto-managed by Amplify)     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
1. Usuario abre app → CloudFront sirve React SPA desde S3
2. SPA carga → Amplify.configure() con amplify_outputs.json
3. Login → Cognito autentica → JWT (Access + ID + Refresh tokens)
4. CRUD → AppSync recibe GraphQL con JWT en header Authorization
5. AppSync → Valida token con Cognito User Pool
6. AppSync → VTL Resolver filtra por owner (cognito:username)
7. DynamoDB → Retorna solo datos del usuario autenticado
8. Subscriptions → WebSocket (wss://) para actualizaciones real-time
```

### Componentes AWS Desplegados

| Servicio | Recurso | ID/ARN |
|----------|---------|--------|
| Cognito | User Pool | `us-east-1_xZVIjP3Fz` |
| Cognito | Identity Pool | `us-east-1:91ba2fa8-d71e-49f9-b21a-61373d3a175a` |
| Cognito | App Client | `3r2aqj4u729k4lrj0j2986st7f` |
| AppSync | GraphQL API | `zwa4u3zsvzcyzn6obtlmmqk27u` |
| CloudFormation | Root Stack | `amplify-finanzaspersonales-DavidBarrera-sandbox-324d7a4417` |
| DynamoDB | 9 tablas | Auto-named por Amplify |
| S3 | Static Assets | Managed by Amplify Hosting |
| CloudFront | Distribution | Managed by Amplify Hosting |

---

## 📱 Módulos de la Aplicación

| Módulo | Descripción | Funcionalidades clave |
|--------|-------------|----------------------|
| **Ingreso de Datos** | Formulario de registro de transacciones | Campos dependientes, validación, categoría→concepto |
| **Tabla de Datos** | Vista tabular con operaciones masivas | Búsqueda, filtros, ordenamiento, paginación, export/import CSV |
| **Dashboard** | Panel de indicadores financieros | 8 KPIs, dona, barras comparativas, tendencia mensual |
| **Flujo de Caja** | Proyección anual de 12 meses | Ingresos, egresos, flujo mensual, acumulado |
| **Caja y Bancos** | Conciliación de saldos | Saldos reales vs flujo acumulado, % ubicación |
| **Catálogos** | Admin de datos maestros | Categorías, conceptos, cuentas, activar/desactivar |
| **Análisis** | Tabla pivot multidimensional | Agrupación dinámica, exportación, gráficas |
| **Pagos Recurrentes** | Gestión de pagos periódicos | CRUD, frecuencias, generación automática de transacciones |
| **Instrucciones** | Onboarding para nuevos usuarios | Guía de 7 pasos interactiva |

---

## 📊 Modelo de Datos

| Entidad | Descripción | Relaciones | Campos clave |
|---------|-------------|------------|--------------|
| **Transaction** | Ingreso o egreso | — | date, type, amount, currency, categoryName, conceptName |
| **Category** | Categoría (Ingreso/Egreso) | `hasMany → Concept` | name, type, isActive, isBase |
| **Concept** | Concepto de segundo nivel | `belongsTo → Category` | name, categoryId, isActive, isBase |
| **CashAccount** | Cuenta bancaria/billetera | — | name, isActive, order |
| **CashReconciliation** | Corte mensual de conciliación | `hasMany → CashBalance` | cutoffDate, totalBase, totalLocated, status |
| **CashBalance** | Saldo por cuenta en un corte | `belongsTo → CashReconciliation` | accountName, balance |
| **RecurringPayment** | Pago periódico configurado | — | name, estimatedAmount, payDay, frequency |
| **AppSetting** | Config del usuario | — | defaultCurrency, defaultYear, defaultMonth |
| **ImportBatch** | Registro de importación masiva | — | filename, totalRows, status |

> Todas las entidades usan `allow.owner()` — **multi-tenant by design**, cada usuario solo accede a sus propios datos.

---

## 📋 Requisitos Previos

| Herramienta | Versión mínima | Comando de verificación |
|-------------|---------------|------------------------|
| Node.js | 18+ (recomendado 20+) | `node --version` |
| pnpm | 9+ | `pnpm --version` |
| Git | 2.x | `git --version` |
| AWS CLI | v2 (para backend) | `aws --version` |

### Instalar pnpm (si no lo tienes)

```bash
# Opción 1: via npm
npm install -g pnpm

# Opción 2: via corepack (incluido en Node.js 16+)
corepack enable
corepack prepare pnpm@latest --activate
```

---

## 🚀 Configuración Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/sebasgao05/FinanzasPersonales.git
cd FinanzasPersonales

# 2. Instalar dependencias
pnpm install

# 3. Ejecutar en modo desarrollo
pnpm dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

> **⚠️ Nota:** La app requiere el backend Amplify desplegado para funcionar completamente. Ver [DEPLOY_AMPLIFY.md](./DEPLOY_AMPLIFY.md).

---

## 💻 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo (Vite, HMR) |
| `pnpm build` | TypeScript check + build producción |
| `pnpm build:ci` | Solo Vite build (sin type-check, CI) |
| `pnpm preview` | Preview del build de producción |
| `pnpm test` | Ejecutar todos los tests (337 tests) |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm test:coverage` | Tests con reporte de cobertura |
| `pnpm lint` | ESLint |

---

## 🧪 Testing

El proyecto incluye **337 tests** que cubren:
- ✅ Tests unitarios para todos los módulos de cálculo
- ✅ 27 property-based tests con [fast-check](https://github.com/dubzzz/fast-check) validando propiedades matemáticas
- ✅ Cobertura de lógica de negocio (flujo de caja, reconciliación, dashboard)

```bash
# Ejecutar todos los tests
pnpm test

# Solo un archivo específico
pnpm exec vitest run src/lib/calculations/engine.test.ts

# Con output detallado
pnpm exec vitest run --reporter=verbose

# Con cobertura
pnpm test:coverage
```

---

## 📁 Estructura del Proyecto

```
FinanzasPersonales/
├── amplify/                        # Backend Amplify Gen 2
│   ├── auth/resource.ts            # Config Amazon Cognito (email login)
│   ├── data/resource.ts            # Schema DynamoDB/AppSync (9 modelos)
│   ├── backend.ts                  # Entry point del backend
│   └── tsconfig.json
├── docs/
│   └── architecture/
│       └── infrastructure.drawio   # Diagrama AWS (Draw.io)
├── src/
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components (Button, Card, etc.)
│   │   ├── layout/                 # AppLayout, Sidebar, MobileNav
│   │   ├── transactions/           # Form, Table, Filters, EditDialog
│   │   ├── dashboard/              # KPICards, DonutChart, BarChart, Trends
│   │   ├── cashflow/               # CashFlowTable, CashFlowCharts
│   │   ├── reconciliation/         # Form, AccountBalances, StatusBadge
│   │   ├── catalogs/               # CatalogManager, CategoryForm
│   │   ├── analysis/               # PivotTable, Filters, Charts
│   │   ├── recurring/              # Form, List, GenerateDialog
│   │   └── import-export/          # CSVExporter, FileImporter
│   ├── hooks/                      # Custom hooks (Amplify Data client)
│   │   ├── useTransactions.ts      # CRUD + real-time subscriptions
│   │   ├── useCatalogs.ts          # Category/Concept CRUD
│   │   ├── useDashboard.ts         # KPIs + distribución
│   │   ├── useCashFlow.ts          # Flujo mensual/acumulado
│   │   ├── useReconciliation.ts    # Caja y bancos
│   │   └── useRecurringPayments.ts # Pagos recurrentes
│   ├── lib/
│   │   ├── amplify-client.ts       # Cliente tipado Amplify Data
│   │   ├── calculations/           # Motor de cálculos puro (testeable)
│   │   ├── validators/             # Validadores de formulario
│   │   ├── export/                 # Generación CSV
│   │   └── utils/                  # Fechas, formateo, filtrado, constantes
│   ├── contexts/                   # AuthContext, SettingsContext
│   ├── pages/                      # 9 páginas/rutas
│   ├── App.tsx                     # Router + providers
│   └── main.tsx                    # Entry point + Amplify.configure()
├── amplify.yml                     # Build settings Amplify Hosting
├── amplify_outputs.json            # Output del backend (auto-generated)
├── components.json                 # Config shadcn/ui
├── .npmrc                          # pnpm config (node-linker=hoisted)
├── pnpm-lock.yaml                  # Lockfile (committed)
├── pnpm-workspace.yaml             # Config workspace
├── package.json                    # Dependencies + scripts
├── vite.config.ts                  # Vite configuration
├── vitest.config.ts                # Test configuration
└── eslint.config.js                # ESLint flat config
```

---

## 🚢 Despliegue

Ver [DEPLOY_AMPLIFY.md](./DEPLOY_AMPLIFY.md) para la guía completa de despliegue en tu propia cuenta AWS.

**Resumen rápido:**
1. Configura AWS CLI con credenciales
2. `npx ampx sandbox` para ambiente de desarrollo
3. Conecta repo a Amplify Hosting para CI/CD automático

---

## 🔒 Seguridad

| Aspecto | Implementación |
|---------|---------------|
| **Autenticación** | Amazon Cognito (email + contraseña, verificación por código) |
| **Autorización** | Owner-based (`allow.owner()`) — multi-tenant aislado |
| **Tokens** | JWT con refresh automático (Access + ID + Refresh) |
| **Transporte** | HTTPS forzado en todos los endpoints (CloudFront) |
| **CORS** | Configurado automáticamente por AppSync |
| **Password Policy** | Min 8 chars, uppercase, lowercase, numbers, symbols |
| **Data Isolation** | Cada usuario solo accede a sus propios registros |

---

## 💰 Costo Estimado (Uso Personal)

| Servicio | Capa gratuita | Costo estimado/mes |
|----------|--------------|-------------------|
| Cognito | 50,000 MAUs gratis | $0 |
| DynamoDB | 25GB + 25 WCU/RCU | $0 |
| AppSync | 250K queries + 250K data modifications | ~$0.01 |
| Amplify Hosting | 1000 min build + 15GB serving | ~$0 |
| CloudFront | 1TB transfer (primer año) | $0 |
| S3 | 5GB storage | $0 |
| CloudFormation | Sin costo | $0 |
| **Total** | | **$0 – $1/mes** |

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Lee la [Guía de Contribución](./CONTRIBUTING.md) para detalles sobre:

- Configuración del entorno de desarrollo
- Flujo de trabajo con Git (ramas, commits, PRs)
- Convenciones de código y naming
- Cómo reportar bugs y sugerir mejoras

**Resumen rápido:**

```bash
git checkout dev && git pull origin dev
git checkout -b feature/mi-feature
# ... desarrolla ...
pnpm lint && pnpm test && pnpm build
# Abre PR hacia dev
```

Este proyecto sigue el [Código de Conducta](./CODE_OF_CONDUCT.md).

---

## 📝 Testing Local

Ver [TESTING_LOCAL.md](./TESTING_LOCAL.md) para la guía de validación funcional completa.

---

## 🔐 Seguridad

Si descubres una vulnerabilidad, **no la reportes como Issue público**. Lee la [Política de Seguridad](./SECURITY.md) para el proceso adecuado.

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](./LICENSE). Puedes usarlo, modificarlo y distribuirlo libremente.

---

<p align="center">
  Hecho con ❤️ usando React + AWS Amplify Gen 2
</p>
