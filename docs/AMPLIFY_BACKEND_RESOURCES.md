# Recursos de Backend — AWS Amplify Gen 2

> Referencia de lo que existe en AWS para **FinanzasPersonales**.
> Última verificación contra la cuenta: **20 de noviembre de 2026**.

## Información general

| Campo | Valor |
|-------|-------|
| **App ID** | `d1i9b3ymodzvtk` |
| **Nombre** | FinanzasPersonales |
| **Dominio** | `main.d1i9b3ymodzvtk.amplifyapp.com` |
| **Repositorio** | `https://github.com/sebasgao05/FinanzasPersonales` |
| **Región** | `us-east-1` (N. Virginia) |
| **Cuenta AWS** | `009245113723` |
| **Etiqueta de proyecto** | `Project = finanzas personales` |

## Ambientes

Existe **un solo ambiente: `main` (producción)**. La rama `dev` se eliminó de Amplify el 2026-11-20 y con ella todo su backend.

| Rama | Stack raíz de CloudFormation |
|------|------------------------------|
| `main` | `amplify-d1i9b3ymodzvtk-main-branch-11a71e7e87` |

Para probar cambios en local se usa el sandbox (`npx ampx sandbox`), que crea un backend temporal propio y se borra con `npx ampx sandbox delete`. Ver [DEPLOY_AMPLIFY.md](../DEPLOY_AMPLIFY.md).

---

## Etiquetas (tags)

Se definen en `amplify/backend.ts` y se aplican a todo el backend en cada deploy.

| Clave | Valor | Uso |
|-------|-------|-----|
| `Project` | `finanzas personales` | **Etiqueta principal.** Valor exacto, con espacio y sin guion. |
| `Name` | `finanzas-personales-<ambiente>-<servicio>[-<detalle>]` | Nombre legible en la consola. Ver tabla de nombres. |
| `project:name` | `finanzas-personales` | Etiqueta anterior, se conserva. |
| `project:environment` | `production` en `main`; el nombre de la rama en otras; `sandbox` en local | |
| `project:owner` | `sebasgao05` | |
| `project:cost-center` | `finanzas-personales` | |
| `project:managed-by` | `amplify-gen2` | |

**Facturación:** para ver costos por proyecto, activar `Project` en *Billing → Cost Allocation Tags → User-defined cost allocation tags*. Tarda unas 24 h en aparecer en Cost Explorer.

**Buscar todo lo del proyecto:** *Resource Groups → Tag Editor*, filtro `Project = finanzas personales`. Por CLI:

```bash
aws resourcegroupstaggingapi get-resources \
  --tag-filters "Key=Project,Values=finanzas personales" --region us-east-1
```

> Los stacks de CloudFormation reciben la etiqueta en el siguiente deploy de `main`. Los demás recursos ya la tienen aplicada (ver [Estado en la cuenta](#estado-en-la-cuenta)).

---

## Recursos de `main` y su nombre

El nombre físico lo asigna Amplify y **no se puede cambiar sin reemplazar el recurso** (se perderían datos o usuarios). Por eso se identifican con la etiqueta `Name`.

| Servicio | Identificador físico | Etiqueta `Name` |
|----------|----------------------|-----------------|
| Cognito User Pool | `us-east-1_TcHewiDNh` | `finanzas-personales-production-cognito-user-pool` |
| Cognito App Client | `1gqteev00f9ha1pn4a3enli0og` | — |
| Cognito Identity Pool | `us-east-1:1c77bbe8-f3fb-45d1-9601-7fdb1e9378c7` | `finanzas-personales-production-cognito-identity-pool` |
| AppSync API | `kfceolndabfv5dhp44qdbug4lm` | `finanzas-personales-production-appsync-api` |
| S3 codegen | `amplify-d1i9b3ymodzvtk-ma-amplifydataamplifycodege-sezehqrje9rs` | `…-s3-data-codegen-assets` |
| S3 introspección | `amplify-d1i9b3ymodzvtk-ma-modelintrospectionschema-y5yuejfc0sla` | `…-s3-model-introspection` |
| Step Function | `AmplifyTableWaiterStateMachine060600BC-zg4jdeUchNeO` | `…-sfn-table-waiter` |
| Lambdas (6) | `amplify-d1i9b3ymodzvtk-ma-*` | `…-lambda-<función>` |
| DynamoDB (9 tablas) | `<Modelo>-kfceolndabfv5dhp44qdbug4lm-NONE` | `…-dynamodb-<Modelo>` |

El nombre de la API de AppSync (propiedad `name` en `amplify/data/resource.ts`) es `finanzas-personales-api`. Se hace visible en la consola tras el siguiente deploy; antes aparece como `amplifyData`.

### Tablas DynamoDB

Convención: `{Modelo}-{AppSyncApiId}-NONE`, facturación `PAY_PER_REQUEST`.

| Modelo | Tabla |
|--------|-------|
| Transaction | `Transaction-kfceolndabfv5dhp44qdbug4lm-NONE` |
| Category | `Category-kfceolndabfv5dhp44qdbug4lm-NONE` |
| Concept | `Concept-kfceolndabfv5dhp44qdbug4lm-NONE` |
| CashAccount | `CashAccount-kfceolndabfv5dhp44qdbug4lm-NONE` |
| CashReconciliation | `CashReconciliation-kfceolndabfv5dhp44qdbug4lm-NONE` |
| CashBalance | `CashBalance-kfceolndabfv5dhp44qdbug4lm-NONE` |
| RecurringPayment | `RecurringPayment-kfceolndabfv5dhp44qdbug4lm-NONE` |
| AppSetting | `AppSetting-kfceolndabfv5dhp44qdbug4lm-NONE` |
| ImportBatch | `ImportBatch-kfceolndabfv5dhp44qdbug4lm-NONE` |

### Configuración de Cognito

- Inicio de sesión con email, verificación por email, MFA desactivado.
- Contraseña: mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.
- Identidades no autenticadas habilitadas.

### Lambdas (solo se ejecutan durante deploys)

| Lambda | Propósito |
|--------|-----------|
| `AmplifyBranchLinkerCustomResourceLambda` | Vincula la rama de git con el backend |
| `AmplifyBranchLinkerCustomResourceProvider…` | Framework del custom resource (CDK) |
| `CustomCDKBucketDeployment…` | Sube assets a S3 |
| `CustomS3AutoDeleteObjects…` | Vacía buckets al eliminar el stack |
| `TableManagerCustomProvider…` (×2) | Crean y actualizan las tablas DynamoDB |

### SSM Parameters

Ruta: `/amplify/resource_reference/d1i9b3ymodzvtk/main-branch-11a71e7e87/`
`AMPLIFY_DATA_DEFAULT_NAME`, `AMPLIFY_DATA_GRAPHQL_ENDPOINT`, `AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_BUCKET_NAME`, `AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_KEY`.

---

## ¿Por qué hay ~430 recursos de CloudFormation?

Amplify Gen 2 usa stacks anidados. Cada uno de los 9 modelos genera unos 40 recursos (tabla, rol, data source, resolvers y pipeline functions de AppSync).

```
amplify-d1i9b3ymodzvtk-main-branch-…  (raíz)
├── auth…            Cognito: User Pool, App Client, Identity Pool, 2 roles IAM  (~7)
└── data…            AppSync API, schema, 2 buckets S3, SSM, Lambdas             (~34)
    ├── AmplifyTableManager   Step Function + Lambdas que crean las tablas       (~9)
    ├── Transaction, Category, Concept, CashAccount, CashReconciliation,
    │   CashBalance, RecurringPayment, AppSetting, ImportBatch   9 × ~40 = ~360
    └── ConnectionStack       Resolvers de relaciones hasMany/belongsTo          (~10)
```

Relaciones: `Category.concepts`, `Concept.category`, `CashReconciliation.balances`, `CashBalance.reconciliation`.

| Capa | Recursos |
|------|----------|
| Raíz (branch linker) | ~10 |
| Auth | 7 |
| Data (núcleo) | ~34 |
| Table Manager | 9 |
| 9 modelos | ~360 |
| Conexiones | ~10 |
| **Total** | **~430** |

---

## Estado en la cuenta

Verificado el 2026-11-20.

- **Etiqueta `Project = finanzas personales`** aplicada a: app y rama `main` de Amplify, User Pool, Identity Pool, API AppSync, 9 tablas DynamoDB, 2 buckets S3, Step Function y 6 Lambdas (23 recursos). Los stacks de CloudFormation la reciben en el próximo deploy.
- **Uso real de `main`:** 5 usuarios, 109 transacciones, requests recientes a AppSync.
- **Sin recursos huérfanos** de FinanzasPersonales.

### Recursos ajenos en la misma cuenta (no tocar)

| Recurso | Pertenece a |
|---------|-------------|
| User Pool `us-east-1_W6EXTQ69Y`, Identity Pool `…86514192-…`, tablas `amplify-dzhrxd33fsxwx-*` | `liseth-nathan-wedding` |
| Stack `CDKToolkit`, bucket `cdk-hnb659fds-assets-*` | Bootstrap de CDK (compartido) |
| Apps Amplify `Lu-Jo-Matrimonio`, `capacitacion-aws-iapol` | Otros proyectos |

---

## Historial de limpieza

| Fecha | Acción |
|-------|--------|
| 2026-11-20 | Se eliminó la rama `dev` de Amplify (sin requests en AppSync en 60 días, solo datos de prueba). Amplify borró su stack: User Pool `us-east-1_BdAPZGu2G`, Identity Pool, API `dhgkrew6yfhrvhrcri4c6z7pam`, 9 tablas, 2 buckets S3, Step Function y 6 Lambdas. |
| 2026-11-20 | Se borraron a mano 6 log groups `/aws/lambda/amplify-d1i9b3ymodzvtk-de-*` que CloudFormation no elimina. |
| 2026-11-20 | El sandbox local referenciado en `amplify_outputs.json` ya no existía en AWS. |

---

## Cómo eliminar o recrear

1. **No borrar stacks a mano.** Amplify controla el ciclo de vida. Para quitar una rama, usar *Amplify Console → App settings → Branch settings*.
2. **Los IDs cambian al recrear.** Se obtienen nuevos User Pool, API y tablas; se pierden usuarios y datos.
3. **Los log groups de Lambda sobreviven** al borrado del stack y hay que eliminarlos aparte (`/aws/lambda/amplify-d1i9b3ymodzvtk-<ma|de>-*`).
4. **Actualizar este documento** cuando cambien los IDs.
5. **Costo:** uso bajo, tablas `PAY_PER_REQUEST`; las Lambdas solo corren en deploys.
