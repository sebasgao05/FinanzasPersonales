# 🔒 Política de Seguridad

## Versiones Soportadas

| Versión | Soportada |
|---------|-----------|
| main (última) | ✅ |
| Ramas anteriores | ❌ |

## Reportar una Vulnerabilidad

Si descubres una vulnerabilidad de seguridad en este proyecto, por favor **NO la reportes como un Issue público**.

### Proceso de reporte

1. **Envía un reporte privado** a través de [GitHub Security Advisories](../../security/advisories/new)
2. Incluye la siguiente información:
   - Descripción detallada de la vulnerabilidad
   - Pasos para reproducirla
   - Impacto potencial
   - Sugerencia de solución (si la tienes)

### Tiempo de respuesta

| Acción | Plazo |
|--------|-------|
| Confirmación de recepción | 48 horas |
| Evaluación inicial | 7 días |
| Resolución (crítica) | 14 días |
| Resolución (baja/media) | 30 días |

### Qué esperar

- Recibirás una confirmación de que tu reporte fue recibido
- Te mantendré informado del progreso
- Recibirás crédito en el advisory (si lo deseas)
- No se tomarán acciones legales contra investigadores que reporten de buena fe

## Prácticas de Seguridad del Proyecto

### Autenticación y Autorización
- Amazon Cognito con email + contraseña verificada
- Tokens JWT con refresh automático
- Aislamiento por owner (`allow.owner()`) — cada usuario solo accede a sus datos

### Infraestructura
- HTTPS forzado en todos los endpoints (CloudFront + AppSync)
- DynamoDB con cifrado en reposo (AWS managed keys)
- IAM roles con privilegios mínimos (auto-gestionados por Amplify)
- Sin endpoints públicos sin autenticación

### Código
- TypeScript estricto (sin `any`)
- Dependencias fijadas con lockfile (`pnpm-lock.yaml`)
- No se almacenan secretos en el código fuente
- `amplify_outputs.json` contiene solo configuración pública (endpoints, IDs de pool)

### Lo que NO se incluye en el repositorio
- Credenciales AWS (access keys, secret keys)
- Tokens de sesión
- Datos de usuarios
- Variables de entorno sensibles

## Dependencias

Este proyecto usa Dependabot para mantener las dependencias actualizadas y recibir alertas de seguridad automáticamente.

## Alcance

Esta política aplica al código fuente del repositorio y la infraestructura definida en `amplify/`. No cubre:
- La infraestructura AWS subyacente (gestionar con AWS)
- Vulnerabilidades en dependencias de terceros (reportar upstream)
- Phishing u otros ataques de ingeniería social
