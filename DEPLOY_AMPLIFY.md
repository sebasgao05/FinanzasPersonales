# Guía de Despliegue a AWS Amplify Gen 2

Guía paso a paso para desplegar Finanzas Personales en **tu propia cuenta AWS** con autenticación, base de datos y hosting.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Configurar cuenta AWS](#2-configurar-cuenta-aws)
3. [Clonar y preparar el proyecto](#3-clonar-y-preparar-el-proyecto)
4. [Desarrollo con sandbox local](#4-desarrollo-con-sandbox-local)
5. [Desplegar en Amplify Hosting (Producción)](#5-desplegar-en-amplify-hosting-producción)
6. [Ambientes (branches)](#6-ambientes-branches)
7. [Dominio personalizado](#7-dominio-personalizado-opcional)
8. [Costos estimados](#8-costos-estimados)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Requisitos Previos

### Software necesario

```bash
# Node.js 18+ (recomendado 20)
node --version    # Debe ser v18.x o superior

# pnpm 9+ (package manager del proyecto)
pnpm --version

# AWS CLI v2
aws --version     # aws-cli/2.x.x

# Git
git --version
```

### Instalar pnpm (si no lo tienes)

```bash
# Opción 1: via npm
npm install -g pnpm

# Opción 2: via corepack (recomendado, incluido en Node.js 16+)
corepack enable
corepack prepare pnpm@latest --activate
```

### Instalar AWS CLI (si no lo tienes)

- **Windows:** Descarga desde https://aws.amazon.com/cli/
- **Mac:** `brew install awscli`
- **Linux:** `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install`

---

## 2. Configurar Cuenta AWS

### Opción A: Usuario IAM con acceso programático

1. Ve a [IAM Console](https://console.aws.amazon.com/iam)
2. Crea un usuario con la política `AdministratorAccess`
3. Genera Access Keys (Access Key ID + Secret Access Key)
4. Configura localmente:

```bash
aws configure
```

```
AWS Access Key ID: AKIAXXXXXXXXXXXXXXXX
AWS Secret Access Key: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Default region name: us-east-1
Default output format: json
```

### Opción B: AWS IAM Identity Center / SSO

```bash
aws configure sso
# Sigue el flujo del navegador para autenticarte
```

### Verificar

```bash
aws sts get-caller-identity
# Debe mostrar tu Account ID y ARN
```

---

## 3. Clonar y Preparar el Proyecto

```bash
# Clonar
git clone https://github.com/david-barrera-blend/FinanzasPersonales.git
cd FinanzasPersonales

# Instalar dependencias
pnpm install

# Verificar que compila
pnpm build
```

### Archivos clave de infraestructura

| Archivo | Función |
|---------|---------|
| `amplify/backend.ts` | Entry point del backend (auth + data) |
| `amplify/auth/resource.ts` | Configuración de Cognito (email login) |
| `amplify/data/resource.ts` | Schema de 9 modelos DynamoDB |
| `amplify.yml` | Build settings para CI/CD de Amplify Hosting |
| `.npmrc` | Configura pnpm con node-linker=hoisted |
| `pnpm-lock.yaml` | Lockfile para builds reproducibles |

---

## 4. Desarrollo con Sandbox Local

El sandbox despliega un stack personal en tu cuenta AWS para desarrollo.

> **Nota en Windows:** `ampx` no soporta pnpm en Windows directamente. Usa `npx`:

```bash
npx ampx sandbox
```

**Primera vez** tarda 3-5 minutos. Despliega:
- Amazon Cognito User Pool
- AWS AppSync API (GraphQL)
- 9 tablas DynamoDB
- Genera `amplify_outputs.json`

```bash
# Terminal 1: Sandbox corriendo (déjalo activo)
npx ampx sandbox

# Terminal 2: Frontend
pnpm dev
```

### Verificar que funciona

1. Abre http://localhost:5173
2. Registra un usuario (email + contraseña)
3. Verifica email con código
4. Crea categorías en Catálogos
5. Registra una transacción
6. Recarga la página — los datos persisten

### Detener sandbox

```bash
npx ampx sandbox delete    # Elimina recursos AWS del sandbox
```

---

## 5. Desplegar en Amplify Hosting (Producción)

### Desde la Consola AWS

1. Ve a [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"Create new app"**
3. Selecciona **"GitHub"** → autoriza acceso
4. Selecciona el repositorio y branch `main`
5. **Build settings**: Amplify detecta `amplify.yml` automáticamente
6. **Instancia de compilación**: Selecciona **"Grande"** (16GB) — necesario por CDK
7. Click **"Save and deploy"**

### Lo que Amplify hace automáticamente:

```
1. Backend Build Phase:
   ├── corepack enable (activa pnpm)
   ├── pnpm install --frozen-lockfile
   └── pnpm exec ampx pipeline-deploy (despliega Cognito + AppSync + DynamoDB)

2. Frontend Build Phase:
   ├── pnpm install --frozen-lockfile --prefer-offline
   └── pnpm run build:ci (solo vite build, sin type-check redundante)

3. Deploy:
   ├── Sube dist/ a S3
   ├── Invalida CloudFront cache
   └── URL público: https://main.XXXXXXX.amplifyapp.com
```

### Configuración del `amplify.yml`

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - export NODE_OPTIONS="--max-old-space-size=8192"
        - corepack enable
        - corepack prepare pnpm@latest --activate
        - pnpm install --frozen-lockfile
        - pnpm exec ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
frontend:
  phases:
    preBuild:
      commands:
        - corepack enable
        - corepack prepare pnpm@latest --activate
        - pnpm install --frozen-lockfile --prefer-offline
    build:
      commands:
        - pnpm run build:ci
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### CI/CD automático

Cada `git push` a la branch conectada dispara un redeploy automático (~3-5 min).

---

## 6. Ambientes (Branches)

Amplify Gen 2 soporta múltiples ambientes — cada branch tiene su propio stack aislado:

| Branch | Ambiente | Recursos |
|--------|----------|----------|
| `main` | Producción | Cognito + DynamoDB + AppSync propios |
| `dev` | Desarrollo | Stack completamente separado |

### Conectar rama `dev`

1. En Amplify Console → tu app → **"Branches"**
2. Click **"Connect branch"**
3. Selecciona `dev`
4. Cada push a `dev` despliega en su propio ambiente

Los datos entre ambientes son **completamente aislados** (distintas tablas DynamoDB, distintos User Pools).

---

## 7. Dominio Personalizado (Opcional)

1. En Amplify Console → **"Domain management"** → **"Add domain"**
2. Ingresa tu dominio (ej: `finanzas.midominio.com`)
3. Amplify genera certificado SSL automáticamente
4. Configura registros DNS:

```
Tipo: CNAME
Nombre: finanzas.midominio.com
Valor: XXXXXXXXXX.cloudfront.net
```

5. Espera propagación DNS (5 min - 48 hrs)

---

## 8. Costos Estimados

Para uso personal (1 usuario, < 1000 transacciones/mes):

| Servicio | Costo/mes |
|----------|-----------|
| Cognito | $0 (50,000 MAU gratis) |
| DynamoDB | $0 (25GB + 25 WCU/RCU gratis) |
| AppSync | ~$0.01 (4M queries/mes gratis) |
| Amplify Hosting | ~$0 (1000 min build + 15GB serving gratis) |
| CloudFront | $0 (1TB transfer primer año) |
| **Total** | **$0 - $1/mes** |

> AWS Free Tier cubre todo para uso personal durante los primeros 12 meses.

---

## 9. Troubleshooting

### "Build container ran out of memory"

- En Amplify Console → App settings → General → **Build image settings**
- Selecciona instancia **"Grande"** (16GB RAM)
- El `amplify.yml` ya incluye `NODE_OPTIONS="--max-old-space-size=8192"`

### "Command esbuild not found"

- `esbuild` debe estar en `devDependencies` del `package.json`
- Ya está incluido: `"esbuild": "^0.28.1"`

### "ampx: Amplify does not support PNPM on Windows"

- Esto es solo para desarrollo local en Windows
- Usa `npx ampx sandbox` en vez de `pnpm exec ampx sandbox`
- En CI/CD (Linux) funciona sin problemas

### "Unable to resolve credentials"

```bash
aws sts get-caller-identity    # Verificar credenciales
aws configure                  # Reconfigurar
```

### "amplify_outputs.json not found"

```bash
npx ampx sandbox    # Genera el archivo
```

### El login no funciona en local

- ¿Está corriendo `npx ampx sandbox`?
- ¿Existe `amplify_outputs.json`?
- Verifica `src/main.tsx` tiene `Amplify.configure(outputs)`

### Los datos no se persisten

- Abre DevTools → Console → busca errores de AppSync
- Verifica que creaste categorías antes de crear transacciones
- El backend debe estar desplegado (sandbox o producción)

---

## Comandos Rápidos

```bash
# Desarrollo local
npx ampx sandbox                    # Iniciar sandbox (backend personal)
npx ampx sandbox delete             # Eliminar sandbox
pnpm dev                            # Frontend local

# Testing
pnpm test                           # 337 tests
pnpm build                          # Verificar compilación

# Producción
git push origin main                # Trigger auto-deploy
git push origin dev                 # Deploy a ambiente dev

# Debugging
npx ampx sandbox --debug            # Logs detallados
aws cloudformation describe-stacks  # Ver stacks desplegados
```
