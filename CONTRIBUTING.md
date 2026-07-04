# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a **Finanzas Personales**! Esta guía te ayudará a empezar.

## Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del entorno](#configuración-del-entorno)
- [Flujo de trabajo](#flujo-de-trabajo)
- [Convenciones de código](#convenciones-de-código)
- [Convenciones de commits](#convenciones-de-commits)
- [Pull Requests](#pull-requests)
- [Reportar bugs](#reportar-bugs)
- [Sugerir mejoras](#sugerir-mejoras)

---

## Código de Conducta

Este proyecto sigue el [Código de Conducta](./CODE_OF_CONDUCT.md). Al participar, aceptas cumplirlo.

## ¿Cómo puedo contribuir?

### 🐛 Reportar bugs
- Usa la plantilla de [Bug Report](../../issues/new?template=bug_report.md)
- Incluye pasos para reproducir, comportamiento esperado vs actual
- Agrega capturas de pantalla si aplica

### 💡 Sugerir mejoras
- Usa la plantilla de [Feature Request](../../issues/new?template=feature_request.md)
- Describe el problema que resuelve y la solución propuesta

### 🔧 Contribuir código
- Revisa los [Issues abiertos](../../issues) para encontrar tareas
- Los issues con label `good first issue` son ideales para empezar
- Comenta en el issue antes de empezar a trabajar para evitar duplicados

---

## Configuración del entorno

### Requisitos

| Herramienta | Versión mínima |
|-------------|---------------|
| Node.js | 18+ (recomendado 20+) |
| pnpm | 9+ |
| Git | 2.x |
| AWS CLI v2 | (solo para backend) |

### Instalación

```bash
# 1. Fork y clonar
git clone https://github.com/TU-USUARIO/FinanzasPersonales.git
cd FinanzasPersonales

# 2. Agregar remote upstream
git remote add upstream https://github.com/sebasgao05/FinanzasPersonales.git

# 3. Instalar dependencias
pnpm install

# 4. Verificar que todo funciona
pnpm lint
pnpm test
pnpm build
```

### Ejecutar en desarrollo

```bash
pnpm dev
# Abre http://localhost:5173
```

> **Nota:** Sin el backend de Amplify, la app funcionará con errores de conexión. Para desarrollo solo frontend, puedes mockear los hooks de datos.

---

## Flujo de trabajo

### Git Flow simplificado

```
main ← dev ← feature/mi-feature
```

1. **Sincroniza** tu fork con upstream:
   ```bash
   git checkout dev
   git pull upstream dev
   ```

2. **Crea** una rama desde `dev`:
   ```bash
   git checkout -b feature/nombre-descriptivo
   # o: fix/descripcion-del-bug
   # o: docs/que-documentas
   ```

3. **Desarrolla** tus cambios

4. **Valida** antes de hacer push:
   ```bash
   pnpm lint        # Sin errores de linting
   pnpm test        # Todos los tests pasan
   pnpm build       # Build exitoso
   ```

5. **Push** y crea un Pull Request hacia `dev`

### Tipos de ramas

| Prefijo | Uso |
|---------|-----|
| `feature/` | Nueva funcionalidad |
| `fix/` | Corrección de bug |
| `docs/` | Solo documentación |
| `refactor/` | Refactorización sin cambio funcional |
| `test/` | Solo tests |
| `chore/` | Mantenimiento (deps, config) |

---

## Convenciones de código

### Idioma
- **Código** (variables, funciones, componentes): Inglés
- **UI** (labels, mensajes, toasts): Español
- **Documentación**: Español
- **Commits**: Español / Inglés

### TypeScript
- Modo estricto activado — no usar `any`
- Preferir interfaces sobre types para objetos
- Exportar types que otros módulos necesiten

### React
- Solo componentes funcionales con hooks
- Custom hooks para lógica reutilizable
- Props tipadas con interfaces
- Evitar prop drilling — usar composición

### Estilos
- Tailwind CSS utility-first
- No CSS modules ni styled-components
- Usar clases de shadcn/ui para consistencia
- `cn()` para clases condicionales

### Estado
- Hooks personalizados (no Redux/Zustand)
- Amplify Data client para CRUD
- `useState`/`useReducer` para estado local

### Tests
- Tests para toda lógica de negocio (en `src/lib/`)
- Vitest como runner
- fast-check para property-based testing en cálculos
- Nombrar archivos de test como `*.test.ts`

---

## Convenciones de commits

Usamos mensajes descriptivos en español:

```
<tipo>: <descripción corta>

[cuerpo opcional con más detalle]
```

### Tipos

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `style` | Formato (no afecta lógica) |
| `refactor` | Refactorización |
| `test` | Agregar o modificar tests |
| `chore` | Mantenimiento |

### Ejemplos

```
feat: agregar filtro por rango de fechas en tabla de transacciones
fix: corregir cálculo de flujo acumulado cuando hay meses sin datos
docs: actualizar diagrama de arquitectura con nuevas tablas
test: agregar property tests para motor de reconciliación
chore: actualizar dependencias de Amplify a v6.18
```

---

## Pull Requests

### Antes de abrir un PR

- [ ] El código compila sin errores (`pnpm build`)
- [ ] Todos los tests pasan (`pnpm test`)
- [ ] No hay errores de linting (`pnpm lint`)
- [ ] Se agregaron tests para nueva funcionalidad
- [ ] La documentación fue actualizada si aplica

### Estructura del PR

Usa la [plantilla de PR](./.github/pull_request_template.md) que incluye:
- Descripción del cambio
- Tipo de cambio
- Checklist de validación
- Screenshots (si hay cambios visuales)

### Revisión

- Los PRs requieren al menos 1 aprobación
- Responde a los comentarios de review
- Haz squash de commits antes del merge si hay muchos commits WIP

---

## Reportar bugs

Antes de reportar, verifica que:
1. Estás usando la última versión de `dev`
2. El bug no fue reportado previamente (busca en Issues)
3. Puedes reproducirlo consistentemente

Incluye:
- Navegador y versión
- Pasos exactos para reproducir
- Qué esperabas vs qué pasó
- Logs de consola (si hay errores)
- Screenshots o grabación de pantalla

---

## Sugerir mejoras

Las sugerencias son bienvenidas. Al proponer una feature:
- Describe el **problema** que resuelve (no solo la solución)
- Explica **cómo** la usarías en el contexto de finanzas personales
- Indica si estás dispuesto a implementarla

---

## Preguntas

Si tienes dudas sobre cómo contribuir, abre un [Discussion](../../discussions) o comenta en un Issue existente.

¡Gracias por contribuir! 🙌
