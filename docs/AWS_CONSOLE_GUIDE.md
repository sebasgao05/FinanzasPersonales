# Guía de Consola AWS — Soporte y Monitoreo

> Referencia rápida para saber **dónde ver qué** en la consola de AWS cuando necesitas debuggear, monitorear o dar soporte a la app.

**Región:** `us-east-1` (N. Virginia) — Asegúrate de tener esta región seleccionada en la esquina superior derecha de la consola.

---

## 📋 Tabla de Acceso Rápido

| Necesitas... | Servicio | URL directa |
|--------------|----------|-------------|
| Ver estado del deploy | Amplify | [Amplify Console](https://us-east-1.console.aws.amazon.com/amplify/apps/d1i9b3ymodzvtk) |
| Ver logs de build | Amplify → Branch → Build | Dentro de cada branch |
| Ver usuarios registrados | Cognito | [User Pools](https://us-east-1.console.aws.amazon.com/cognito/v2/idp/user-pools) |
| Probar queries GraphQL | AppSync | [AppSync APIs](https://us-east-1.console.aws.amazon.com/appsync/home?region=us-east-1#/apis) |
| Ver datos en las tablas | DynamoDB | [DynamoDB Tables](https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables) |
| Ver stacks de infraestructura | CloudFormation | [Stacks](https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks) |
| Ver logs de Lambda | CloudWatch | [Log Groups](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups) |
| Ver métricas de API | CloudWatch | [Metrics](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#metricsV2) |
| Ver roles y permisos | IAM | [IAM Roles](https://us-east-1.console.aws.amazon.com/iam/home#/roles) |
| Ver buckets S3 | S3 | [S3 Buckets](https://s3.console.aws.amazon.com/s3/buckets?region=us-east-1) |

---

## 1. AWS Amplify Console

**URL:** `https://us-east-1.console.aws.amazon.com/amplify/apps/d1i9b3ymodzvtk`

### Qué puedes ver:
- **Estado de cada rama** (main, dev) — si el último deploy fue exitoso o falló
- **Historial de builds** — cada push genera un build con logs
- **Dominio** — URLs de cada branch (`main.d1i9b3ymodzvtk.amplifyapp.com`, `dev.d1i9b3ymodzvtk.amplifyapp.com`)
- **Variables de entorno** — si tienes configuradas
- **Configuración de build** — basada en `amplify.yml`

### Cómo ver logs de un deploy:
1. Click en la rama (main o dev)
2. Click en el build específico (ej: `#15`)
3. Verás las fases: `Provision → Build → Deploy → Verify`
4. Click en cada fase para expandir los logs

### Errores comunes en builds:
| Error | Causa | Solución |
|-------|-------|----------|
| `Build failed` | Error de TypeScript o dependencias | Ver logs de fase "Build" |
| `Deploy failed` | Error en CloudFormation | Ver CloudFormation stacks |
| `Provision failed` | Problema de permisos IAM | Ver IAM role de Amplify |

---

## 2. Amazon Cognito (Usuarios)

### User Pool de main: `us-east-1_TcHewiDNh`
### User Pool de dev: `us-east-1_BdAPZGu2G`

**URL:** `https://us-east-1.console.aws.amazon.com/cognito/v2/idp/user-pools`

### Qué puedes ver:
- **Lista de usuarios registrados** — email, estado (Confirmed/Unconfirmed), fecha de creación
- **Grupos** — (no hay configurados actualmente)
- **Configuración de seguridad** — password policy, MFA
- **App clients** — el client ID que usa la SPA

### Acciones de soporte:

| Acción | Dónde |
|--------|-------|
| Ver si un usuario existe | User Pool → Users → Buscar por email |
| Confirmar usuario manualmente | Users → Select user → Actions → Confirm |
| Resetear contraseña | Users → Select user → Actions → Reset password |
| Deshabilitar usuario | Users → Select user → Actions → Disable |
| Ver atributos del usuario | Users → Select user → User attributes |
| Ver sesiones activas | Users → Select user → Sign-in activity |

### Cómo verificar que un usuario puede autenticarse:
1. Ir a User Pool → App Integration → App clients
2. Click en el client ID
3. En "Hosted UI" puedes probar el login (si está habilitado)
4. O usa la consola de AppSync (más fácil, ver sección 3)

---

## 3. AWS AppSync (GraphQL API)

### API de main: `kfceolndabfv5dhp44qdbug4lm`
### API de dev: `dhgkrew6yfhrvhrcri4c6z7pam`

**URL:** `https://us-east-1.console.aws.amazon.com/appsync/home?region=us-east-1#/apis`

### Qué puedes ver:
- **Schema** — el schema GraphQL completo (queries, mutations, subscriptions, types)
- **Data Sources** — las conexiones a DynamoDB (una por modelo)
- **Resolvers** — el mapeo entre operaciones y tablas
- **Queries (Editor)** — ¡puedes ejecutar queries directamente!
- **Settings** — endpoints, auth modes, logs
- **Monitoring** — métricas de requests, errores, latencia

### Cómo probar una query desde la consola:
1. Ir a la API → **Queries** (panel izquierdo)
2. Seleccionar auth mode: "User Pool" (necesitas un token) o "IAM"
3. Para User Pool: necesitas login → la consola te ofrece "Login with User Pools"
4. Escribir la query:
```graphql
query ListTransactions {
  listTransactions {
    items {
      id
      date
      amount
      categoryName
      conceptName
      type
    }
  }
}
```
5. Click "Run" (▶️)

### Cómo habilitar logs detallados de AppSync:
1. API → Settings → Logging
2. Habilitar "Enable Logs"
3. Field resolver log level: `ALL` (para debug) o `ERROR` (producción)
4. Los logs aparecen en CloudWatch: `/aws/appsync/apis/{apiId}`

### Métricas disponibles (Monitoring tab):
- **4XXError** — Errores de cliente (auth fallido, query inválida)
- **5XXError** — Errores de servidor (resolver falló)
- **Latency** — Tiempo de respuesta (p50, p90, p99)
- **Requests** — Total de requests

---

## 4. Amazon DynamoDB (Datos)

**URL:** `https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables`

### Cómo encontrar las tablas:
- Buscar por: `Transaction-kfceolndabfv5dhp44qdbug4lm` (main) o `Transaction-dhgkrew6yfhrvhrcri4c6z7pam` (dev)
- O filtrar por: `kfceolndabfv` para ver todas las de main, `dhgkrew6yfhr` para dev

### Qué puedes ver por tabla:
- **Overview** — Items count, tamaño, capacidad
- **Explore items** — Ver/buscar/filtrar datos directamente
- **Indexes** — GSIs creados por Amplify
- **Metrics** — Read/Write capacity consumed
- **Backups** — (no configurados por defecto)

### Cómo consultar datos directamente:
1. Click en la tabla → **Explore table items**
2. **Scan** — Ver todos los items (cuidado en tablas grandes)
3. **Query** — Buscar por partition key (id) o por GSI
4. Puedes filtrar por atributos: `owner = "user-uuid"`

### Acciones de soporte:
| Acción | Cómo |
|--------|------|
| Ver datos de un usuario | Explore items → Filter: `owner` contains `email/uuid` |
| Ver un item específico | Explore items → Query → Partition key = `{id}` |
| Editar un item | Click en el item → Edit → Save |
| Eliminar un item | Select item → Actions → Delete |
| Exportar datos | Explore items → Download results as CSV |
| Ver consumo | Metrics tab → ConsumedReadCapacityUnits / ConsumedWriteCapacityUnits |

### Tips:
- El campo `owner` contiene el `sub` (UUID) del usuario en Cognito
- Los campos `createdAt` y `updatedAt` son auto-generados por AppSync
- `__typename` es metadata de AppSync (ignorar)

---

## 5. AWS CloudWatch (Logs y Métricas)

**URL:** `https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1`

### Log Groups relevantes:

| Log Group | Contenido |
|-----------|-----------|
| `/aws/appsync/apis/kfceolndabfv5dhp44qdbug4lm` | Logs de AppSync main (si está habilitado) |
| `/aws/appsync/apis/dhgkrew6yfhrvhrcri4c6z7pam` | Logs de AppSync dev (si está habilitado) |
| `/aws/lambda/amplify-d1i9b3ymodzvtk-ma-*` | Logs de Lambdas de main |
| `/aws/lambda/amplify-d1i9b3ymodzvtk-de-*` | Logs de Lambdas de dev |

### Cómo ver logs de AppSync:
1. Primero habilitar logs en AppSync (Settings → Logging → Enable)
2. CloudWatch → Log groups → `/aws/appsync/apis/{apiId}`
3. Cada request genera un log con: requestId, operación, latencia, errores

### Cómo buscar errores:
1. Log groups → Seleccionar el grupo
2. **Log Insights** (recomendado para búsquedas):
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 50
```

### Métricas útiles para monitorear:

**AppSync:**
- `4XXError` — Problemas de auth o queries mal formadas
- `5XXError` — Problemas en resolvers
- `Latency` — Si sube mucho, puede haber un problema de DynamoDB

**DynamoDB:**
- `ConsumedReadCapacityUnits` — Consumo de lecturas
- `ConsumedWriteCapacityUnits` — Consumo de escrituras
- `ThrottledRequests` — Si ves throttling, necesitas más capacidad
- `SystemErrors` — Errores internos de DynamoDB

**Cognito:**
- `SignInSuccesses` — Logins exitosos
- `SignInThrottles` — Rate limiting en auth
- `TokenRefreshSuccesses` — Refreshes de token

### Cómo crear una alarma:
1. CloudWatch → Alarms → Create alarm
2. Select metric (ej: AppSync → 5XXError)
3. Threshold: > 0 en 5 minutos
4. Notification: SNS topic (configura tu email)

---

## 6. AWS CloudFormation (Infraestructura)

**URL:** `https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks`

### Cómo encontrar tus stacks:
- Filtrar por: `amplify-d1i9b3ymodzvtk`
- Verás ~28 stacks (14 por rama: 1 root + 1 auth + 12 data)

### Qué puedes ver por stack:
- **Events** — Historial de operaciones (CREATE, UPDATE, DELETE) con timestamps
- **Resources** — Lista de recursos que contiene el stack
- **Outputs** — Valores exportados (endpoints, ARNs)
- **Template** — El template JSON/YAML que generó Amplify
- **Parameters** — Inputs del stack

### Cuándo consultar CloudFormation:
| Situación | Qué buscar |
|-----------|-----------|
| Deploy falló | Events → buscar `FAILED` → ver "Status reason" |
| Recurso no se creó | Resources → buscar el recurso → ver status |
| Quieres ver qué cambió | Events → filtrar por timestamp del último deploy |
| Rollback | Events → `ROLLBACK_IN_PROGRESS` → ver qué lo causó |

### Tips:
- Los stacks con `UPDATE_ROLLBACK_COMPLETE` tuvieron un deploy fallido que se revirtió
- Si un stack está en `DELETE_FAILED`, puede haber un recurso que no se pudo eliminar
- Nunca elimines stacks manualmente — usa Amplify CLI

---

## 7. Amazon S3 (Buckets)

**URL:** `https://s3.console.aws.amazon.com/s3/buckets?region=us-east-1`

### Buckets de tu app:

| Bucket | Contenido |
|--------|-----------|
| `amplify-d1i9b3ymodzvtk-ma-amplifydataamplifycodege-*` | Codegen assets (main) |
| `amplify-d1i9b3ymodzvtk-de-amplifydataamplifycodege-*` | Codegen assets (dev) |
| `amplify-d1i9b3ymodzvtk-ma-modelintrospectionschema-*` | Schema JSON (main) |
| `amplify-d1i9b3ymodzvtk-de-modelintrospectionschema-*` | Schema JSON (dev) |
| `amplify-d1i9b3ymodzvtk-*-deployment` | Artifacts de deploy |

### Qué puedes ver:
- Schema de introspección del modelo (JSON grande con toda la definición de tipos)
- Assets de codegen generados por Amplify
- No deberías necesitar modificar nada aquí manualmente

---

## 8. AWS IAM (Roles y Permisos)

**URL:** `https://us-east-1.console.aws.amazon.com/iam/home#/roles`

### Roles relevantes:
- Filtrar por `amplify-d1i9b3ymodzvtk`

| Rol | Propósito |
|-----|-----------|
| `*-amplifyAuthauthenticatedU-*` | Permisos para usuarios logueados |
| `*-amplifyAuthunauthenticate-*` | Permisos para usuarios no logueados |
| `*-AmplifyBranchLinkerCustom-*` | Lambda de branch linking |
| `*-AmplifyManagedTableOnEvent-*` | Lambda de table manager |
| `*-AmplifyTableWaiterStateMa-*` | Step Function waiter |
| `TransactionIAMRole*` | AppSync → DynamoDB (por tabla) |

### Cuándo consultar IAM:
- Si ves errores `AccessDenied` o `Unauthorized` en los logs
- Para verificar qué puede hacer un usuario autenticado
- Para auditar permisos

---

## 9. Troubleshooting — Escenarios Comunes

### "Un usuario no puede hacer login"

1. **Cognito** → User Pool → Users → Buscar el email
2. Verificar:
   - ¿El usuario existe? Si no, no se ha registrado
   - ¿Status es `Confirmed`? Si es `Unconfirmed`, no verificó el email
   - ¿Está `Enabled`? Si está deshabilitado, no puede entrar
3. Si necesitas resetearlo: Actions → Reset password (le envía un código)

### "Los datos no se guardan"

1. **AppSync** → Queries → Probar la mutation manualmente
2. Si falla con error de auth:
   - Verificar que el token JWT no esté expirado
   - Verificar que el usuario está en el User Pool correcto (main vs dev)
3. Si falla con error de resolver:
   - Habilitar logs en AppSync Settings
   - Ver CloudWatch logs
4. **DynamoDB** → Explore table → Verificar si el item existe

### "La app carga pero no muestra datos"

1. Verificar que `amplify_outputs.json` apunta al ambiente correcto
2. Abrir DevTools del browser → Network → Filtrar por `graphql`
3. Verificar que los requests van al endpoint correcto
4. Si hay 401: el token expiró o el usuario no existe en ese ambiente
5. Si hay 200 pero items vacío: el usuario no tiene datos en ese ambiente

### "El deploy falló"

1. **Amplify Console** → Branch → Build history → Click en el build fallido
2. Expandir la fase que falló:
   - **Build phase**: Error de TypeScript, dependencias, o tests
   - **Deploy phase**: Error de CloudFormation
3. Si es CloudFormation:
   - **CloudFormation** → Stack root → Events → Buscar `FAILED`
   - El "Status reason" te dice exactamente qué falló
4. Errores comunes:
   - `Resource limit exceeded` → Demasiados recursos en la cuenta
   - `The role * is invalid` → Problema de permisos
   - `Template format error` → Bug en Amplify (raro)

### "La app está lenta"

1. **AppSync** → Monitoring → Ver latencia (p50, p90, p99)
2. Si la latencia es alta:
   - **DynamoDB** → Table → Metrics → Ver si hay throttling
   - Considerar agregar GSIs para queries frecuentes
3. **CloudFront** → Ver cache hit rate (debería ser alto para assets estáticos)

### "Quiero ver qué hizo un usuario específico"

1. **DynamoDB** → Tabla → Explore items
2. Filtrar: `owner` = el sub del usuario (lo encuentras en Cognito → User → sub attribute)
3. Ordena por `createdAt` para ver cronológicamente

---

## 10. Comandos CLI Útiles (alternativa a la consola)

Si prefieres la terminal sobre la consola web:

```bash
# Ver estado del backend
npx ampx sandbox status

# Ver outputs del backend (endpoints, IDs)
cat amplify_outputs.json | jq .

# Listar tablas DynamoDB del ambiente dev
aws dynamodb list-tables --region us-east-1 | grep dhgkrew6yfhr

# Scan de una tabla (ver primeros items)
aws dynamodb scan --table-name "Transaction-dhgkrew6yfhrvhrcri4c6z7pam-NONE" --region us-east-1 --max-items 5

# Ver logs de AppSync (últimos 30 min)
aws logs filter-log-events \
  --log-group-name "/aws/appsync/apis/dhgkrew6yfhrvhrcri4c6z7pam" \
  --start-time $(date -d '30 minutes ago' +%s000) \
  --region us-east-1

# Ver usuarios de Cognito
aws cognito-idp list-users --user-pool-id us-east-1_BdAPZGu2G --region us-east-1

# Ver stacks de CloudFormation
aws cloudformation list-stacks --region us-east-1 \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  | grep d1i9b3ymodzvtk

# Ver eventos de un deploy fallido
aws cloudformation describe-stack-events \
  --stack-name amplify-d1i9b3ymodzvtk-dev-branch-68452ea83e \
  --region us-east-1 \
  --query "StackEvents[?ResourceStatus=='CREATE_FAILED' || ResourceStatus=='UPDATE_FAILED']"
```

---

## 11. Monitoreo Proactivo (Recomendaciones)

### Configurar alarmas básicas (opcional pero recomendado):

| Métrica | Threshold | Significado |
|---------|-----------|-------------|
| AppSync 5XXError > 0 | 5 min | Hay errores en el backend |
| DynamoDB ThrottledRequests > 0 | 5 min | La tabla necesita más capacidad |
| Cognito SignInThrottles > 0 | 5 min | Rate limiting en auth |

### Dashboard de CloudWatch (opcional):
1. CloudWatch → Dashboards → Create dashboard
2. Agregar widgets:
   - AppSync: Requests, 4XX, 5XX, Latency
   - DynamoDB: ConsumedRCU, ConsumedWCU (por tabla)
   - Cognito: SignIns, Throttles

---

## 12. Acceso y Permisos

Para acceder a la consola necesitas:
- Credenciales IAM con acceso a los servicios mencionados
- La cuenta AWS: `009245113723`
- Región: `us-east-1`

### Permisos mínimos para soporte (read-only):
```json
{
  "Effect": "Allow",
  "Action": [
    "amplify:Get*",
    "amplify:List*",
    "appsync:Get*",
    "appsync:List*",
    "cognito-idp:List*",
    "cognito-idp:Describe*",
    "cognito-idp:AdminGetUser",
    "dynamodb:Describe*",
    "dynamodb:Scan",
    "dynamodb:Query",
    "dynamodb:GetItem",
    "cloudformation:Describe*",
    "cloudformation:List*",
    "cloudwatch:GetMetric*",
    "cloudwatch:List*",
    "logs:GetLogEvents",
    "logs:FilterLogEvents",
    "logs:DescribeLogGroups",
    "s3:GetObject",
    "s3:ListBucket"
  ],
  "Resource": "*"
}
```

---

*Última actualización: Julio 2026*
