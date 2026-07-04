# Recursos de Backend — AWS Amplify Gen 2

> Documento de referencia que explica los **426 recursos por rama** que Amplify despliega automáticamente en AWS.

## Información General

| Campo | Valor |
|-------|-------|
| **App ID** | `d1i9b3ymodzvtk` |
| **Nombre** | FinanzasPersonales |
| **Dominio** | `d1i9b3ymodzvtk.amplifyapp.com` |
| **Repositorio** | `https://github.com/sebasgao05/FinanzasPersonales` |
| **Región** | `us-east-1` (N. Virginia) |
| **Cuenta AWS** | `009245113723` |
| **Plataforma** | WEB |

---

## Ramas Desplegadas

| Rama | Stage | Stack Root de CloudFormation |
|------|-------|------------------------------|
| **main** | PRODUCTION | `amplify-d1i9b3ymodzvtk-main-branch-11a71e7e87` |
| **dev** | DEVELOPMENT | `amplify-d1i9b3ymodzvtk-dev-branch-68452ea83e` |

> ⚠️ **Cada rama tiene su propio set COMPLETO e INDEPENDIENTE de recursos AWS.** No comparten Cognito, AppSync, ni DynamoDB entre sí. Son ambientes totalmente aislados.

---

## ¿Por qué hay ~426 recursos por rama?

Amplify Gen 2 usa CloudFormation con **stacks anidados** (nested stacks). La estructura es:

```
Root Stack (1 stack)
├── Auth Stack (1 stack → ~7 recursos)
├── Data Stack (1 stack → ~34 recursos directos)
│   ├── AmplifyTableManager Stack (1 stack → ~9 recursos)
│   ├── Transaction Stack (1 stack → ~40 recursos)
│   ├── Category Stack (1 stack → ~40 recursos)
│   ├── Concept Stack (1 stack → ~40 recursos)
│   ├── CashAccount Stack (1 stack → ~40 recursos)
│   ├── CashReconciliation Stack (1 stack → ~40 recursos)
│   ├── CashBalance Stack (1 stack → ~40 recursos)
│   ├── RecurringPayment Stack (1 stack → ~40 recursos)
│   ├── AppSetting Stack (1 stack → ~40 recursos)
│   ├── ImportBatch Stack (1 stack → ~40 recursos)
│   └── ConnectionStack (1 stack → ~10 recursos relaciones)
└── BranchLinker Resources (~10 recursos)
```

**Total por rama:** ~10 + 7 + 34 + 9 + (9 modelos × 40) + 10 ≈ **430 recursos**

---

## Desglose por Categoría de Recurso

### 1. Root Stack (por rama)

| Recurso | Tipo | Propósito |
|---------|------|-----------|
| `auth179371D7` | CloudFormation::Stack | Stack anidado de autenticación (Cognito) |
| `data7552DF31` | CloudFormation::Stack | Stack anidado de datos (AppSync + DynamoDB) |
| `AmplifyBranchLinkerCustomResource` | Custom Resource | Vincula la rama de git con el backend |
| `AmplifyBranchLinkerCustomResourceLambda` | Lambda::Function | Lambda que ejecuta el branch linking |
| `AmplifyBranchLinkerCustomResourceLambdaServiceRole` | IAM::Role | Rol de ejecución para la Lambda |
| `AmplifyBranchLinkerCustomResourceProvider*` | Lambda + IAM | Framework del Custom Resource (CDK) |
| `CDKMetadata` | CDK::Metadata | Metadata de versión CDK |

**Total: ~10 recursos**

---

### 2. Auth Stack (Cognito)

| Recurso | Tipo | main | dev |
|---------|------|------|-----|
| User Pool | Cognito::UserPool | `us-east-1_TcHewiDNh` | `us-east-1_BdAPZGu2G` |
| App Client | Cognito::UserPoolClient | `1gqteev00f9ha1pn4a3enli0og` | `3r6u927re32es24knepu866fb7` |
| Identity Pool | Cognito::IdentityPool | `us-east-1:1c77bbe8-f3fb-...` | `us-east-1:021130cc-36a1-...` |
| Identity Pool Role Attachment | Cognito::IdentityPoolRoleAttachment | — | — |
| Authenticated User Role | IAM::Role | `*-amplifyAuthauthenticatedU-*` | `*-amplifyAuthauthenticatedU-*` |
| Unauthenticated User Role | IAM::Role | `*-amplifyAuthunauthenticate-*` | `*-amplifyAuthunauthenticate-*` |

**Total: 7 recursos**

**Configuración (ambas ramas):**
- Login con email
- MFA desactivado
- Password: min 8 chars, mayúscula, minúscula, número, símbolo
- Identidades no autenticadas habilitadas
- Verificación por email

---

### 3. Data Stack (AppSync + Management)

| Recurso | Tipo | Propósito | main | dev |
|---------|------|-----------|------|-----|
| GraphQL API | AppSync::GraphQLApi | API principal | `kfceolndabfv5dhp44qdbug4lm` | `dhgkrew6yfhrvhrcri4c6z7pam` |
| GraphQL Schema | AppSync::GraphQLSchema | Schema compilado | — | — |
| NONE DataSource | AppSync::DataSource | Para resolvers sin backend | — | — |
| Codegen Assets Bucket | S3::Bucket | Assets de codegen | `*-amplifydataamplifycodege-sezehqrje9rs` | `*-amplifydataamplifycodege-el3ylbuvud1h` |
| Model Introspection Bucket | S3::Bucket | Schema de introspección | `*-modelintrospectionschema-y5yuejfc0sla` | `*-modelintrospectionschema-17bn1apbt2px` |
| CDKBucketDeployment Lambda | Lambda::Function | Deploy de assets a S3 | — | — |
| S3AutoDeleteObjects Lambda | Lambda::Function | Limpieza de buckets | — | — |
| SSM Parameters (×4) | SSM::Parameter | Referencias entre stacks | — | — |
| AWS CLI Layer | Lambda::LayerVersion | Capa compartida | — | — |
| Nested Stacks (×11) | CloudFormation::Stack | 9 modelos + TableManager + Connections | — | — |

**Total: ~34 recursos**

---

### 4. Table Manager Stack

| Recurso | Tipo | Propósito |
|---------|------|-----------|
| AmplifyManagedTableOnEventRole | IAM::Role | Rol para crear/modificar tablas DynamoDB |
| AmplifyManagedTableIsCompleteRole | IAM::Role | Rol para verificar estado de tablas |
| TableManagerCustomProvider (×2) | Lambda::Function | Lambdas del Custom Resource Provider |
| AmplifyTableWaiterStateMachine | StepFunctions::StateMachine | Espera a que las tablas estén ready |
| AmplifyTableWaiterStateMachineRole | IAM::Role | Rol para la Step Function |
| Policies (×2) | IAM::Policy | Políticas de acceso |

**Total: 9 recursos**

---

### 5. Model Stack (por cada uno de los 9 modelos)

Cada modelo (Transaction, Category, Concept, etc.) genera un stack con **~40 recursos**:

| Recurso | Tipo | Cantidad | Propósito |
|---------|------|----------|-----------|
| DynamoDB Table | Custom::AmplifyDynamoDBTable | 1 | Tabla del modelo (ej: `Transaction-<apiId>-NONE`) |
| IAM Role | IAM::Role | 1 | Acceso de AppSync a la tabla |
| DataSource | AppSync::DataSource | 1 | Conexión AppSync → DynamoDB |
| **Resolvers** | AppSync::Resolver | **7-8** | CRUD + Subscriptions + Owner |
| **Function Configurations** | AppSync::FunctionConfiguration | **~30** | Pipeline functions para auth, init, data, postAuth |

#### Resolvers por modelo:
- `createTransaction` (Mutation)
- `updateTransaction` (Mutation)
- `deleteTransaction` (Mutation)
- `getTransaction` (Query)
- `listTransactions` (Query)
- `onCreateTransaction` (Subscription — real-time)
- `onUpdateTransaction` (Subscription — real-time)
- `onDeleteTransaction` (Subscription — real-time)
- `owner` (Field resolver — resuelve el campo owner)

#### Pipeline Functions por operación:
Cada resolver usa un **pipeline** con múltiples steps:
1. `auth0` — Valida autorización (owner check)
2. `postAuth0` — Post-autorización hooks
3. `init0` — Inicialización (set owner en create/update)
4. `DataResolverFn` — Ejecuta la operación DynamoDB (GetItem/PutItem/Query/Scan/DeleteItem)

**Total por modelo: ~40 recursos**
**Total 9 modelos: ~360 recursos**

---

### 6. Connection Stack

| Recurso | Tipo | Propósito |
|---------|------|-----------|
| Resolvers de relaciones | AppSync::Resolver | Resolver para `Category.concepts`, `CashReconciliation.balances`, etc. |
| Function Configurations | AppSync::FunctionConfiguration | Funciones para resolver relaciones hasMany/belongsTo |

**Total: ~10 recursos** (varía según cantidad de relaciones)

---

## Resumen Total de Recursos por Rama

| Capa | Recursos | Notas |
|------|----------|-------|
| Root Stack | ~10 | Branch linker + nested stack refs |
| Auth (Cognito) | 7 | User Pool, Identity Pool, Roles |
| Data (AppSync core) | ~34 | API, Schema, S3 buckets, Lambdas, SSM |
| Table Manager | 9 | Step Functions, Lambdas para provisionar tablas |
| 9 Model Stacks | ~360 | 40 recursos × 9 modelos (DynamoDB + Resolvers) |
| Connection Stack | ~10 | Relaciones entre modelos |
| **TOTAL** | **~430** | **Por rama (main y dev son independientes)** |

---

## Comparativa: main vs dev

| Recurso | main (PRODUCTION) | dev (DEVELOPMENT) |
|---------|-------------------|-------------------|
| **CloudFormation Root** | `amplify-d1i9b3ymodzvtk-main-branch-11a71e7e87` | `amplify-d1i9b3ymodzvtk-dev-branch-68452ea83e` |
| **Cognito User Pool** | `us-east-1_TcHewiDNh` | `us-east-1_BdAPZGu2G` |
| **Cognito App Client** | `1gqteev00f9ha1pn4a3enli0og` | `3r6u927re32es24knepu866fb7` |
| **Cognito Identity Pool** | `us-east-1:1c77bbe8-f3fb-45d1-9601-7fdb1e9378c7` | `us-east-1:021130cc-36a1-40f6-91d1-a51a2e202769` |
| **AppSync API ID** | `kfceolndabfv5dhp44qdbug4lm` | `dhgkrew6yfhrvhrcri4c6z7pam` |
| **AppSync Endpoint** | `https://kfceolndabfv5dhp44qdbug4lm.appsync-api.us-east-1.amazonaws.com/graphql` | `https://dhgkrew6yfhrvhrcri4c6z7pam.appsync-api.us-east-1.amazonaws.com/graphql` |
| **DynamoDB Tables** | `*-kfceolndabfv5dhp44qdbug4lm-NONE` | `*-dhgkrew6yfhrvhrcri4c6z7pam-NONE` |
| **S3 Codegen** | `*-amplifydataamplifycodege-sezehqrje9rs` | `*-amplifydataamplifycodege-el3ylbuvud1h` |
| **S3 Introspection** | `*-modelintrospectionschema-y5yuejfc0sla` | `*-modelintrospectionschema-17bn1apbt2px` |
| **Step Function** | `AmplifyTableWaiterStateMachine060600BC-zg4jdeUchNeO` | `AmplifyTableWaiterStateMachine060600BC-LmG7HM33qCgQ` |
| **Desplegado** | 2026-07-02 20:12 UTC | 2026-07-02 20:39 UTC |
| **Última actualización** | 2026-07-02 21:47 UTC | 2026-07-02 21:39 UTC |

### Diferencias clave entre ambientes

| Aspecto | main | dev |
|---------|------|-----|
| **Stage** | PRODUCTION | DEVELOPMENT (ninguno asignado) |
| **Usuarios** | Usuarios reales de la app | Solo para testing/desarrollo |
| **Datos** | Datos de producción | Datos de prueba |
| **Dominio** | `main.d1i9b3ymodzvtk.amplifyapp.com` | `dev.d1i9b3ymodzvtk.amplifyapp.com` |
| **CI/CD trigger** | Push a `main` | Push a `dev` |
| **TTL cache** | 5 segundos | 5 segundos |

> 🔑 **Los datos entre main y dev son completamente independientes.** Un usuario registrado en main NO existe en dev, y viceversa. Cada ambiente tiene su propia base de datos DynamoDB.

---

## Tablas DynamoDB (9 por rama)

El naming convention es: `{ModelName}-{AppSyncApiId}-NONE`

| Modelo | main | dev |
|--------|------|-----|
| Transaction | `Transaction-kfceolndabfv5dhp44qdbug4lm-NONE` | `Transaction-dhgkrew6yfhrvhrcri4c6z7pam-NONE` |
| Category | `Category-kfceolndabfv5dhp44qdbug4lm-NONE` | `Category-dhgkrew6yfhrvhrcri4c6z7pam-NONE` |
| Concept | `Concept-kfceolndabfv5dhp44qdbug4lm-NONE` | `Concept-dhgkrew6yfhrvhrcri4c6z7pam-NONE` |
| CashAccount | `CashAccount-kfceolndabfv5dhp44qdbug4lm-NONE` | `CashAccount-dhgkrew6yfhrvhrcri4c6z7pam-NONE` |
| CashReconciliation | `CashReconciliation-kfceolndabfv5dhp44qdbug4lm-NONE` | `CashReconciliation-dhgkrew6yfhrvhrcri4c6z7pam-NONE` |
| CashBalance | `CashBalance-kfceolndabfv5dhp44qdbug4lm-NONE` | `CashBalance-dhgkrew6yfhrvhrcri4c6z7pam-NONE` |
| RecurringPayment | `RecurringPayment-kfceolndabfv5dhp44qdbug4lm-NONE` | `RecurringPayment-dhgkrew6yfhrvhrcri4c6z7pam-NONE` |
| AppSetting | `AppSetting-kfceolndabfv5dhp44qdbug4lm-NONE` | `AppSetting-dhgkrew6yfhrvhrcri4c6z7pam-NONE` |
| ImportBatch | `ImportBatch-kfceolndabfv5dhp44qdbug4lm-NONE` | `ImportBatch-dhgkrew6yfhrvhrcri4c6z7pam-NONE` |

---

## Lambdas Desplegadas (por rama)

| Lambda | Propósito |
|--------|-----------|
| `AmplifyBranchLinkerCustomResourceLambda` | Vincula rama Git ↔ backend AWS |
| `AmplifyBranchLinkerCustomResourceProviderframeworkonEvent` | CDK framework para custom resource |
| `CustomCDKBucketDeployment*` | Deploy de assets a S3 |
| `CustomS3AutoDeleteObjects*` | Limpieza de objetos al eliminar buckets |
| `TableManagerCustomProviderframeworkonEvent` | Crea/actualiza tablas DynamoDB |
| `TableManagerCustomProviderframeworkisComplete` | Verifica que tablas estén listas |

**Total: 6 Lambdas por rama, 12 en total**

---

## SSM Parameters (por rama)

| Parámetro | Propósito |
|-----------|-----------|
| `AMPLIFY_DATA_DEFAULT_NAME` | Nombre default del recurso data |
| `AMPLIFY_DATA_GRAPHQL_ENDPOINT` | URL del endpoint GraphQL |
| `AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_BUCKET_NAME` | Bucket del schema |
| `AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_KEY` | Key del schema en S3 |

Path: `/amplify/resource_reference/d1i9b3ymodzvtk/{branch-id}/`

---

## Diagrama de Stacks Anidados

```
amplify-d1i9b3ymodzvtk-{branch}  (Root)
│
├── auth179371D7  ──────────────────── Cognito (User Pool + Identity Pool + Roles)
│
└── data7552DF31  ──────────────────── AppSync API + S3 Buckets + SSM
    │
    ├── AmplifyTableManager  ───────── Step Functions + Lambdas (provisiona tablas)
    │
    ├── Transaction  ───────────────── DynamoDB Table + 7 Resolvers + ~30 Functions
    ├── Category  ──────────────────── DynamoDB Table + 7 Resolvers + ~30 Functions
    ├── Concept  ───────────────────── DynamoDB Table + 7 Resolvers + ~30 Functions
    ├── CashAccount  ───────────────── DynamoDB Table + 7 Resolvers + ~30 Functions
    ├── CashReconciliation  ────────── DynamoDB Table + 7 Resolvers + ~30 Functions
    ├── CashBalance  ───────────────── DynamoDB Table + 7 Resolvers + ~30 Functions
    ├── RecurringPayment  ──────────── DynamoDB Table + 7 Resolvers + ~30 Functions
    ├── AppSetting  ────────────────── DynamoDB Table + 7 Resolvers + ~30 Functions
    ├── ImportBatch  ───────────────── DynamoDB Table + 7 Resolvers + ~30 Functions
    │
    └── ConnectionStack  ───────────── Resolvers para relaciones (hasMany/belongsTo)
                                        • Category.concepts → Concept
                                        • CashReconciliation.balances → CashBalance
                                        • Concept.category → Category
                                        • CashBalance.reconciliation → CashReconciliation
```

---

## Notas Importantes

1. **No eliminar stacks manualmente** — Amplify maneja el lifecycle completo. Si necesitas eliminar un ambiente, usa `npx ampx sandbox delete` o elimina la rama desde la consola Amplify.

2. **Los IDs cambian si recreas** — Si eliminas y recreas una rama, obtendrás nuevos IDs de User Pool, AppSync API, etc. Los usuarios y datos anteriores se pierden.

3. **Costo** — Todos estos recursos están dentro de la capa gratuita para uso personal. Las Lambdas solo se ejecutan durante deploys, no en runtime normal.

4. **El sandbox local (`npx ampx sandbox`) crea un TERCER ambiente** — Con su propio stack `amplify-finanzaspersonales-DavidBarrera-sandbox-*` con otros ~430 recursos. Este se documenta en el `amplify_outputs.json` local.

---

*Generado automáticamente consultando AWS CloudFormation — Julio 2026*
