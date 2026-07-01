# Guía de Despliegue a AWS Amplify Gen 2

Guía paso a paso para desplegar Finanzas Personales en AWS con autenticación real, base de datos y hosting.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Configurar cuenta AWS](#2-configurar-cuenta-aws)
3. [Preparar el proyecto](#3-preparar-el-proyecto)
4. [Desarrollo con sandbox local](#4-desarrollo-con-sandbox-local)
5. [Conectar frontend al backend](#5-conectar-frontend-al-backend)
6. [Reemplazar mocks con Amplify Data Client](#6-reemplazar-mocks-con-amplify-data-client)
7. [Probar en local con backend real](#7-probar-en-local-con-backend-real)
8. [Subir a GitHub](#8-subir-a-github)
9. [Desplegar en Amplify Hosting (Producción)](#9-desplegar-en-amplify-hosting-producción)
10. [Dominio personalizado](#10-dominio-personalizado-opcional)
11. [Costos estimados](#11-costos-estimados)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Requisitos Previos

### Software necesario

```bash
# Node.js 18+ (recomendado 20)
node --version    # Debe ser v18.x o superior

# npm 9+
npm --version

# AWS CLI v2
aws --version     # aws-cli/2.x.x

# Git
git --version
```

### Instalar AWS CLI (si no lo tienes)

- **Windows:** Descarga desde https://aws.amazon.com/cli/
- **Mac:** `brew install awscli`
- **Linux:** `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install`

---

## 2. Configurar Cuenta AWS

### Opción A: Usuario IAM con acceso programático (simple)

1. Ve a [IAM Console](https://console.aws.amazon.com/iam)
2. Crea un usuario nuevo o usa uno existente
3. Adjunta la política `AdministratorAccess` (para desarrollo — puedes restringir luego)
4. Crea Access Keys (Access Key ID + Secret Access Key)
5. Configura localmente:

```bash
aws configure
```

```
AWS Access Key ID: AKIAXXXXXXXXXXXXXXXX
AWS Secret Access Key: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Default region name: us-east-1
Default output format: json
```

### Opción B: AWS IAM Identity Center / SSO (corporativo)

```bash
aws configure sso
# Sigue el flujo del navegador para autenticarte
```

### Verificar que funciona

```bash
aws sts get-caller-identity
```

Debe mostrar tu Account ID y ARN.

---

## 3. Preparar el Proyecto

### 3.1 Verificar estructura de Amplify

Tu proyecto ya tiene la estructura correcta:

```
amplify/
├── auth/
│   └── resource.ts       ← Configuración de Cognito
├── data/
│   └── resource.ts       ← Schema de DynamoDB/AppSync
├── backend.ts            ← Entry point del backend
└── tsconfig.json
```

### 3.2 Verificar package.json

Asegúrate de que `@aws-amplify/backend` está en devDependencies:

```json
{
  "devDependencies": {
    "@aws-amplify/backend": "^1.23.0"
  }
}
```

✅ Ya está incluido en tu proyecto.

### 3.3 Agregar archivo .gitignore (verificar)

Asegúrate de que estos archivos NO se suban al repo:

```gitignore
# Amplify
amplify_outputs.json
.amplify/
```

✅ Ya están en tu `.gitignore`.

---

## 4. Desarrollo con Sandbox Local

El sandbox de Amplify Gen 2 despliega un stack **personal** en tu cuenta AWS. Cada desarrollador tiene su propio sandbox.

### 4.1 Iniciar el sandbox

```bash
npx ampx sandbox
```

**Primera vez** tarda 3-5 minutos. Amplify:
1. Crea un stack CloudFormation `amplify-finanzaspersonales-sandbox-XXXXX`
2. Despliega:
   - Amazon Cognito User Pool (autenticación)
   - AWS AppSync API (GraphQL)
   - 9 tablas DynamoDB (Transaction, Category, Concept, etc.)
3. Genera `amplify_outputs.json` con la configuración

**Output esperado:**
```
✔  amplify-finanzaspersonales-<tu-usuario>-sandbox-XXXXX

  amplify_outputs.json was updated.

  Watching for file changes...
```

> **Déjalo corriendo** en una terminal. Detecta cambios en `amplify/` automáticamente.

### 4.2 Verificar recursos creados

Ve a [CloudFormation Console](https://console.aws.amazon.com/cloudformation) y verás un stack con estado `CREATE_COMPLETE`.

Ve a [Cognito Console](https://console.aws.amazon.com/cognito) y verás un User Pool creado.

Ve a [AppSync Console](https://console.aws.amazon.com/appsync) y verás una API GraphQL.

---

## 5. Conectar Frontend al Backend

### 5.1 Actualizar `src/main.tsx`

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import './index.css';
import App from './App.tsx';

// Configurar Amplify con los outputs generados por el sandbox
Amplify.configure(outputs);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### 5.2 Agregar type declaration para amplify_outputs.json

Crea `src/amplify-outputs.d.ts`:

```typescript
declare module '../amplify_outputs.json' {
  const outputs: Record<string, unknown>;
  export default outputs;
}
```

O agrega a `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  },
  "include": ["src", "amplify_outputs.json"]
}
```

### 5.3 Restaurar AuthContext real

Si hiciste el bypass temporal para pruebas locales, **revierte** `src/contexts/AuthContext.tsx` a la versión original que usa `getCurrentUser` y `Hub.listen`.

---

## 6. Reemplazar Mocks con Amplify Data Client

### 6.1 Crear el cliente generado

Crea `src/lib/amplify-client.ts`:

```typescript
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

export const client = generateClient<Schema>();
```

### 6.2 Ejemplo: Actualizar `useTransactions.ts`

**Reemplazar las funciones mock:**

```typescript
// ANTES (mock):
const transactionStore: Record<string, TransactionRecord[]> = {};
async function loadTransactions(userId: string) { ... }
async function persistStore(userId: string, records: TransactionRecord[]) { ... }

// DESPUÉS (Amplify real):
import { client } from '@/lib/amplify-client';

async function loadTransactions(): Promise<TransactionRecord[]> {
  const { data, errors } = await client.models.Transaction.list();
  if (errors && errors.length > 0) {
    console.error('Error loading transactions:', errors);
    return [];
  }
  return data.map(mapAmplifyToRecord);
}

async function createTransactionInDB(input: CreateTransactionInput) {
  const { data, errors } = await client.models.Transaction.create(input);
  if (errors && errors.length > 0) {
    throw new Error(errors[0].message);
  }
  return data;
}

async function updateTransactionInDB(id: string, input: Partial<CreateTransactionInput>) {
  const { data, errors } = await client.models.Transaction.update({ id, ...input });
  if (errors && errors.length > 0) {
    throw new Error(errors[0].message);
  }
  return data;
}

async function deleteTransactionInDB(id: string) {
  const { errors } = await client.models.Transaction.delete({ id });
  if (errors && errors.length > 0) {
    throw new Error(errors[0].message);
  }
}
```

### 6.3 Hooks a actualizar

| Hook | Archivo | Modelos que usa |
|------|---------|----------------|
| useTransactions | `src/hooks/useTransactions.ts` | Transaction |
| useCatalogs | `src/hooks/useCatalogs.ts` | Category, Concept |
| useReconciliation | `src/hooks/useReconciliation.ts` | CashAccount, CashReconciliation, CashBalance |
| useRecurringPayments | `src/hooks/useRecurringPayments.ts` | RecurringPayment |
| SettingsContext | `src/contexts/SettingsContext.tsx` | AppSetting |

### 6.4 Patrón general de migración

Para cada hook:

1. Importar `client` desde `@/lib/amplify-client`
2. Reemplazar `loadXXX()` → `client.models.XXX.list()`
3. Reemplazar `persistStore()` → `client.models.XXX.create()` / `.update()` / `.delete()`
4. Remover las variables `xxxStore` en memoria
5. Remover `userId` como parámetro (Amplify filtra por owner automáticamente)

> **Amplify maneja la autorización por owner automáticamente.** No necesitas filtrar por userId — el backend solo retorna registros del usuario autenticado.

---

## 7. Probar en Local con Backend Real

```bash
# Terminal 1: Sandbox corriendo
npx ampx sandbox

# Terminal 2: Servidor de desarrollo
npm run dev
```

### Lo que debes ver:

1. **Pantalla de login real** — Formulario de Cognito funcional
2. **Registro de usuario** — Puedes crear una cuenta con email + contraseña
3. **Verificación de email** — Recibes código por correo
4. **Datos persistentes** — Los datos sobreviven al recargar la página
5. **Aislamiento por usuario** — Cada usuario solo ve sus propios datos

### Crear tu primer usuario:

1. Abre http://localhost:5173
2. Click "Create Account" / "Registrarse"
3. Ingresa email y contraseña (min 8 chars, 1 mayúscula, 1 número, 1 especial)
4. Revisa tu email para el código de verificación
5. Ingresa el código
6. Ya estás dentro de la app

---

## 8. Subir a GitHub

### 8.1 Inicializar repositorio (si no lo has hecho)

```bash
git init
git add .
git commit -m "feat: aplicación completa de finanzas personales"
```

### 8.2 Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `FinanzasPersonales`
3. Privado (recomendado)
4. No inicializar con README (ya lo tienes)

### 8.3 Conectar y subir

```bash
git remote add origin https://github.com/TU_USUARIO/FinanzasPersonales.git
git branch -M main
git push -u origin main
```

### 8.4 Verificar que NO se sube información sensible

Estos archivos NO deben estar en el repo:
- `amplify_outputs.json` (contiene endpoints y config)
- `.amplify/` (cache local)
- `node_modules/`

---

## 9. Desplegar en Amplify Hosting (Producción)

### 9.1 Desde la Consola AWS (recomendado)

1. Ve a [AWS Amplify Console](https://console.aws.amazon.com/amplify/home)
2. Click **"Create new app"**
3. Selecciona **"GitHub"** como fuente
4. Autoriza el acceso a tu cuenta GitHub
5. Selecciona el repositorio `FinanzasPersonales` y branch `main`

### 9.2 Configuración del build

Amplify detecta automáticamente que es un proyecto Amplify Gen 2. Las build settings por defecto son:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

Si Amplify no las genera automáticamente, crea `amplify.yml` en la raíz:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### 9.3 Variables de entorno

No se requieren variables de entorno. Amplify Gen 2 genera el `amplify_outputs.json` durante el build automáticamente para cada branch.

### 9.4 Click "Save and deploy"

Amplify automáticamente:
1. Despliega el backend (Cognito + AppSync + DynamoDB) para producción
2. Construye el frontend
3. Lo sirve a través de CloudFront (CDN global)
4. Genera un URL público: `https://main.XXXXXXXXXX.amplifyapp.com`

**Tiempo estimado del primer deploy:** 5-10 minutos.

### 9.5 CI/CD automático

Después del primer deploy, cada `git push` a `main` dispara un nuevo deploy automáticamente.

```bash
# Hacer un cambio y pushear
git add .
git commit -m "fix: ajuste menor en dashboard"
git push origin main
# → Amplify redespliega en 2-3 minutos
```

---

## 10. Dominio Personalizado (Opcional)

### Si tienes un dominio propio:

1. En la consola de Amplify → **"Domain management"** → **"Add domain"**
2. Ingresa tu dominio (ej: `finanzas.tudominio.com`)
3. Amplify genera un certificado SSL automáticamente
4. Te da registros DNS para configurar:

```
Tipo: CNAME
Nombre: finanzas.tudominio.com
Valor: XXXXXXXXXX.cloudfront.net
```

5. Agrega el registro en tu proveedor de dominio (GoDaddy, Namecheap, Route53, etc.)
6. Espera propagación DNS (5 min - 48 hrs)

---

## 11. Costos Estimados

Para uso personal (1 usuario, < 1000 transacciones/mes):

| Servicio | Costo mensual estimado |
|----------|----------------------|
| Cognito | $0 (hasta 50,000 MAU gratis) |
| DynamoDB | $0 (25GB + 25 WCU/RCU gratis) |
| AppSync | ~$0.01 (4M queries gratis/mes) |
| Amplify Hosting | ~$0 (hasta 1000 min build + 15GB serving gratis) |
| CloudFront | $0 (1TB transfer gratis primer año) |
| **Total** | **$0 - $1/mes** |

> AWS Free Tier cubre prácticamente todo para uso personal durante los primeros 12 meses.

---

## 12. Troubleshooting

### Error: "ampx: command not found"

```bash
npx ampx sandbox    # Usa npx en vez de ampx directamente
```

### Error: "Unable to resolve credentials"

```bash
aws sts get-caller-identity    # Verificar que AWS CLI tiene credenciales
aws configure                  # Reconfigurar si necesario
```

### Error: "amplify_outputs.json not found"

El sandbox no se ha ejecutado aún:
```bash
npx ampx sandbox    # Genera el archivo
```

### Error en el deploy: "Build failed"

1. Ve a Amplify Console → tu app → "Build" 
2. Click en el build fallido para ver logs
3. Causas comunes:
   - TypeScript errors → `npm run build` localmente para ver errores
   - Dependencias faltantes → verificar `package.json`

### El login no funciona en local

- ¿Está corriendo `npx ampx sandbox`?
- ¿Existe `amplify_outputs.json`?
- ¿Está configurado `Amplify.configure(outputs)` en `main.tsx`?

### Los datos no se guardan

- ¿Reemplazaste los mocks con el Amplify Data Client? (Paso 6)
- ¿Está corriendo el sandbox?
- Abre DevTools → Network → busca requests a AppSync

### Error "No current user" después de recargar

- El token JWT expiró
- Amplify debería refrescar automáticamente
- Si persiste: limpiar localStorage y re-login

---

## Resumen del Flujo Completo

```
┌─────────────────────────────────────────────────────────┐
│  DESARROLLO LOCAL                                        │
│                                                          │
│  1. npm install                                          │
│  2. npx ampx sandbox  (despliega backend personal)      │
│  3. Configurar Amplify.configure() en main.tsx           │
│  4. Reemplazar mocks con Amplify Data Client             │
│  5. npm run dev  (frontend + backend real)               │
│  6. Probar login, CRUD, persistencia                     │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│  PRODUCCIÓN                                              │
│                                                          │
│  7. git push origin main                                 │
│  8. Amplify Console → Connect repo                       │
│  9. Auto-deploy (backend + frontend)                     │
│  10. URL público: https://main.XXX.amplifyapp.com        │
│  11. (Opcional) Dominio personalizado                    │
└─────────────────────────────────────────────────────────┘
```

---

## Comandos Rápidos de Referencia

```bash
# Desarrollo
npx ampx sandbox                    # Iniciar sandbox
npx ampx sandbox delete             # Eliminar sandbox (limpia recursos AWS)
npm run dev                          # Frontend local

# Testing
npm run test                         # Correr tests
npm run build                        # Verificar que compila

# Producción
git push origin main                 # Trigger auto-deploy
npx ampx pipeline-deploy --branch main --app-id <ID>  # Deploy manual

# Debugging
npx ampx sandbox --debug             # Sandbox con logs detallados
aws cloudformation describe-stacks   # Ver stacks desplegados
```
