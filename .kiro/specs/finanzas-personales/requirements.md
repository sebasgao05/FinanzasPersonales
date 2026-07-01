# Documento de Requerimientos - Finanzas Personales

## Introducción

Aplicación web fullstack de finanzas personales desplegada en AWS Amplify. Reemplaza un sistema basado en hojas de cálculo Excel con módulos interactivos para registro de transacciones, dashboards, flujo de caja, conciliación bancaria, análisis de datos y pagos recurrentes. La aplicación inicia con datos en blanco y permite al usuario construir su historial financiero desde cero.

**Stack tecnológico:** React + TypeScript + Vite, Tailwind CSS, shadcn/ui, Recharts, AWS Amplify Gen 2, DynamoDB, Cognito.

## Glosario

- **Sistema**: La aplicación web Finanzas Personales en su totalidad
- **Formulario_Transacción**: Componente de interfaz para registrar ingresos y egresos
- **Tabla_Datos**: Componente de tabla principal que muestra todos los registros financieros
- **Dashboard**: Página de visualización con KPIs y gráficas financieras
- **Flujo_Caja**: Módulo que calcula y muestra el flujo de caja mensual y acumulado por año
- **Módulo_Conciliación**: Módulo de conciliación de caja y bancos para cuadrar saldos reales
- **Catálogo**: Listas maestras de tipos, categorías, conceptos, meses, años y monedas
- **Motor_Cálculo**: Conjunto de funciones utilitarias TypeScript para cálculos financieros
- **Transacción**: Registro individual de ingreso o egreso financiero
- **Categoría**: Clasificación de primer nivel asociada a un tipo (Ingreso/Egreso)
- **Concepto**: Clasificación de segundo nivel asociada a una categoría
- **Cuenta_Bancaria**: Registro de una cuenta o billetera donde se ubica dinero
- **Pago_Recurrente**: Registro de un compromiso de pago periódico
- **Lote_Importación**: Registro de una operación de importación masiva de datos
- **Usuario**: Persona autenticada que accede a la aplicación
- **Propietario**: Usuario que creó un registro y tiene acceso exclusivo al mismo

## Requerimientos

### Requerimiento 1: Autenticación y Autorización

**User Story:** Como usuario, quiero iniciar sesión de forma segura, para que solo yo pueda acceder a mis datos financieros.

#### Criterios de Aceptación

1. THE Sistema SHALL proveer registro e inicio de sesión mediante AWS Amplify Auth con Cognito
2. WHEN un Usuario se autentica exitosamente, THE Sistema SHALL redirigir al Usuario a la página de instrucciones
3. THE Sistema SHALL asociar cada registro creado en cualquier entidad de datos con el Propietario autenticado mediante autorización basada en propietario
4. WHEN un Usuario consulta datos, THE Sistema SHALL retornar únicamente los registros donde el Usuario es Propietario
5. IF un Usuario no autenticado intenta acceder a cualquier página distinta a la página de inicio de sesión, THEN THE Sistema SHALL redirigir al Usuario a la página de inicio de sesión
6. IF un Usuario ingresa credenciales inválidas al intentar iniciar sesión, THEN THE Sistema SHALL mostrar un mensaje de error indicando que la autenticación falló sin revelar si el correo o la contraseña es el dato incorrecto
7. IF la sesión del Usuario expira mientras navega la aplicación, THEN THE Sistema SHALL redirigir al Usuario a la página de inicio de sesión
8. WHEN el Usuario cierra sesión, THE Sistema SHALL finalizar la sesión activa y redirigir al Usuario a la página de inicio de sesión

### Requerimiento 2: Navegación y Estructura de la Aplicación

**User Story:** Como usuario, quiero navegar fácilmente entre los módulos de la aplicación, para que pueda acceder rápidamente a cualquier funcionalidad.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar una barra lateral de navegación con acceso a todas las páginas: Instrucciones, Ingreso de Datos, Datos, Dashboard, Flujo de Caja, Caja y Bancos, Lista de Datos, Análisis, Pagos Recurrentes, destacando visualmente el elemento correspondiente a la página activa
2. THE Sistema SHALL garantizar que todo el contenido de cada página sea accesible sin desplazamiento horizontal en viewports con ancho mínimo de 320px, reorganizando los elementos en una disposición vertical en pantallas con ancho menor o igual a 768px
3. WHEN el viewport tiene un ancho menor o igual a 768px, THE Sistema SHALL colapsar la barra lateral en un menú hamburguesa que se abra al presionar el ícono y se cierre automáticamente al seleccionar un elemento de navegación
4. IF una página no tiene datos registrados para mostrar, THEN THE Sistema SHALL mostrar un estado vacío que incluya una descripción del tipo de datos esperados en esa página y al menos un enlace o botón que dirija al Usuario a la acción de creación o importación de datos correspondiente

### Requerimiento 3: Página de Instrucciones (Onboarding)

**User Story:** Como usuario nuevo, quiero ver una guía de inicio, para que entienda cómo usar la aplicación paso a paso.

#### Criterios de Aceptación

1. WHEN un Usuario se autentica exitosamente, THE Sistema SHALL mostrar la página de instrucciones como página inicial
2. THE Sistema SHALL presentar 7 tarjetas numeradas en orden secuencial, cada una con título y descripción breve, que expliquen: (1) Registrar ingresos y egresos, (2) Configurar listas maestras, (3) Revisar dashboard, (4) Revisar flujo de caja, (5) Cuadrar caja y bancos, (6) Importar datos, (7) Exportar datos
3. WHEN el Usuario hace clic en una tarjeta de paso, THE Sistema SHALL navegar a la página correspondiente: tarjeta 1 a Ingreso de Datos, tarjeta 2 a Lista de Datos, tarjeta 3 a Dashboard, tarjeta 4 a Flujo de Caja, tarjeta 5 a Caja y Bancos, tarjeta 6 a Datos (sección importar), tarjeta 7 a Datos (sección exportar)
4. THE Sistema SHALL incluir la página de Instrucciones en la barra lateral de navegación para que Usuarios existentes puedan acceder en cualquier momento

### Requerimiento 4: Ingreso de Transacciones

**User Story:** Como usuario, quiero registrar mis ingresos y egresos mediante un formulario, para que pueda mantener un control de mis finanzas.

#### Criterios de Aceptación

1. THE Formulario_Transacción SHALL contener los campos: Fecha, Tipo (Ingreso/Egreso), Categoría, Concepto, Detalle (máximo 100 caracteres), Presupuesto, Monto real, Moneda, Notas (máximo 500 caracteres), donde los campos Fecha, Tipo, Categoría, Concepto, Monto real y Moneda son obligatorios y los campos Detalle, Presupuesto y Notas son opcionales
2. WHEN el Usuario selecciona una Fecha, THE Formulario_Transacción SHALL calcular automáticamente el Mes y el Año correspondientes
3. WHEN el Usuario selecciona un Tipo, THE Formulario_Transacción SHALL filtrar las opciones de Categoría mostrando solo las categorías activas asociadas al Tipo seleccionado y limpiar los campos Categoría y Concepto previamente seleccionados
4. WHEN el Usuario selecciona una Categoría, THE Formulario_Transacción SHALL filtrar las opciones de Concepto mostrando solo los conceptos activos asociados a la Categoría seleccionada y limpiar el campo Concepto previamente seleccionado
5. IF el Usuario ingresa un monto menor o igual a cero o mayor a 999,999,999.99 en los campos Presupuesto o Monto real, THEN THE Formulario_Transacción SHALL mostrar un mensaje de validación indicando el rango permitido (0.01 a 999,999,999.99)
6. IF el Usuario presiona el botón Guardar y algún campo obligatorio está vacío, THEN THE Formulario_Transacción SHALL resaltar los campos obligatorios faltantes y mostrar un mensaje de validación indicando que son requeridos sin enviar los datos
7. WHEN el Usuario presiona el botón Guardar con todos los campos obligatorios completos y valores válidos, THE Sistema SHALL crear una nueva Transacción y limpiar el formulario restableciendo todos los campos a su estado inicial
8. WHEN el Usuario presiona el botón Guardar y crear otro con todos los campos obligatorios completos y valores válidos, THE Sistema SHALL crear una nueva Transacción y mantener los valores de Tipo, Categoría y Moneda, limpiando los demás campos
9. WHEN el Usuario presiona el botón Limpiar, THE Formulario_Transacción SHALL restablecer todos los campos a su estado inicial sin crear ninguna Transacción

### Requerimiento 5: Tabla de Datos

**User Story:** Como usuario, quiero ver, buscar, filtrar y gestionar todos mis registros financieros en una tabla, para que pueda revisar y corregir mi información.

#### Criterios de Aceptación

1. THE Tabla_Datos SHALL mostrar las columnas: Fecha, Mes, Año, Tipo, Categoría, Concepto, Detalle, Presupuesto, Monto, Moneda, Notas, Fecha creación, Fecha actualización
2. THE Tabla_Datos SHALL permitir búsqueda de texto libre sobre los campos Detalle, Categoría, Concepto y Notas, realizando coincidencia parcial sin distinguir mayúsculas de minúsculas y filtrando los resultados a partir de 1 carácter ingresado
3. THE Tabla_Datos SHALL permitir filtrar registros por Mes, Año, Tipo, Categoría y Concepto
4. THE Tabla_Datos SHALL permitir ordenar registros por cualquier columna de forma ascendente o descendente, mostrando por defecto los registros ordenados por Fecha de forma descendente
5. WHEN el Usuario presiona el botón Editar en un registro, THE Sistema SHALL abrir un formulario de edición con los datos actuales de la Transacción
6. WHEN el Usuario guarda los cambios del formulario de edición con datos válidos, THE Sistema SHALL actualizar la Transacción, cerrar el formulario de edición y reflejar los cambios en la tabla
7. WHEN el Usuario presiona el botón Eliminar en un registro, THE Sistema SHALL mostrar un diálogo de confirmación antes de eliminar la Transacción
8. WHEN el Usuario confirma la eliminación, THE Sistema SHALL eliminar la Transacción de forma permanente y remover el registro de la tabla
9. THE Tabla_Datos SHALL mostrar en la parte inferior los totales de: ingresos, egresos y balance (ingresos menos egresos) calculados sobre los registros visibles según los filtros activos
10. IF un cálculo produce un error de división por cero o un valor no numérico, THEN THE Motor_Cálculo SHALL retornar cero en lugar de mostrar errores técnicos al Usuario
11. THE Tabla_Datos SHALL paginar los registros mostrando un máximo de 50 registros por página y permitir al Usuario navegar entre páginas
12. IF la búsqueda o los filtros activos no producen resultados, THEN THE Tabla_Datos SHALL mostrar un estado vacío indicando que no se encontraron registros que coincidan con los criterios aplicados

### Requerimiento 6: Exportación de Datos

**User Story:** Como usuario, quiero exportar mis registros financieros a un archivo, para que pueda tener un respaldo externo o compartir la información.

#### Criterios de Aceptación

1. WHEN el Usuario presiona el botón Exportar CSV en la Tabla_Datos, THE Sistema SHALL generar y descargar al dispositivo del Usuario un archivo CSV codificado en UTF-8 con separador coma, conteniendo todos los registros visibles según los filtros activos
2. THE Sistema SHALL incluir como primera fila del archivo CSV exportado los encabezados de las columnas visibles en la Tabla_Datos: Fecha, Mes, Año, Tipo, Categoría, Concepto, Detalle, Presupuesto, Monto, Moneda, Notas
3. WHEN el Usuario solicita una plantilla CSV, THE Sistema SHALL generar y descargar un archivo CSV codificado en UTF-8 con separador coma que contenga únicamente una fila de encabezados con las columnas requeridas para importación: Fecha, Tipo, Categoría, Concepto, Detalle, Presupuesto, Monto real, Moneda, Notas
4. IF no existen registros visibles en la Tabla_Datos al momento de exportar, THEN THE Sistema SHALL generar el archivo CSV conteniendo únicamente la fila de encabezados sin filas de datos

### Requerimiento 7: Importación de Datos

**User Story:** Como usuario, quiero importar datos desde archivos CSV o Excel, para que pueda cargar información histórica de forma masiva.

#### Criterios de Aceptación

1. WHEN el Usuario selecciona un archivo CSV o Excel para importación, THE Sistema SHALL validar que el archivo contiene las columnas requeridas: Fecha, Tipo, Categoría, Concepto, Detalle, Presupuesto, Monto real, Moneda, Notas
2. IF el archivo seleccionado no es formato CSV ni Excel, está vacío, o excede 10,000 filas de datos, THEN THE Sistema SHALL rechazar el archivo y mostrar un mensaje de error indicando la causa del rechazo
3. WHEN el archivo es válido, THE Sistema SHALL mostrar una vista previa con los primeros 10 registros del archivo antes de confirmar la importación
4. WHEN el Usuario confirma la importación, THE Sistema SHALL crear un Lote_Importación y procesar cada fila del archivo creando una Transacción por cada fila válida
5. IF una fila del archivo contiene datos inválidos según las reglas de validación del Formulario_Transacción (tipo inexistente, categoría no asociada al tipo, monto menor o igual a cero, o fecha con formato no reconocido), THEN THE Sistema SHALL omitir esa fila, registrar el número de fila y la causa del error, y continuar con el procesamiento de las filas restantes
6. WHEN la importación finaliza, THE Sistema SHALL mostrar un resumen indicando: total de filas procesadas, filas exitosas, filas con errores, y para cada fila con error el número de fila y la causa del fallo

### Requerimiento 8: Dashboard

**User Story:** Como usuario, quiero ver un resumen visual de mis finanzas, para que pueda entender rápidamente mi situación financiera actual.

#### Criterios de Aceptación

1. THE Dashboard SHALL mostrar filtros de Mes, Año y Moneda en la parte superior, precargados con los valores predeterminados del Usuario
2. THE Dashboard SHALL mostrar los KPIs: Ingresos totales, Egresos totales, Balance mensual (Ingresos menos Egresos), Presupuesto de ingresos, Presupuesto de egresos, Diferencia presupuesto vs real para ingresos (Presupuesto ingresos menos Ingresos reales), Diferencia presupuesto vs real para egresos (Presupuesto egresos menos Egresos reales), Porcentaje de egresos sobre ingresos (Egresos dividido por Ingresos multiplicado por 100)
3. WHEN el Usuario selecciona filtros de Mes, Año y Moneda, THE Dashboard SHALL recalcular todos los KPIs y gráficas usando únicamente las transacciones que coincidan con los filtros seleccionados
4. THE Dashboard SHALL mostrar una gráfica de dona con la distribución porcentual de egresos por Categoría, agrupando en una categoría "Otros" las categorías que representen menos del 5% del total
5. THE Dashboard SHALL mostrar una gráfica de barras comparando ingresos totales versus egresos totales
6. THE Dashboard SHALL mostrar una gráfica de barras con la evolución mensual de ingresos y egresos del año seleccionado
7. IF los ingresos totales son cero al calcular el porcentaje de egresos sobre ingresos, THEN THE Motor_Cálculo SHALL retornar cero en lugar de producir un error de división
8. WHEN no existen transacciones para los filtros seleccionados, THE Dashboard SHALL mostrar un estado vacío indicando que no hay datos para el período

### Requerimiento 9: Flujo de Caja

**User Story:** Como usuario, quiero ver mi flujo de caja mensual y acumulado del año, para que pueda identificar tendencias y planificar mis finanzas.

#### Criterios de Aceptación

1. THE Flujo_Caja SHALL mostrar un selector de año en la parte superior
2. THE Flujo_Caja SHALL mostrar una tabla con 12 columnas (una por mes) y las filas: Ingreso, Egreso, Porcentaje Egresos/Ingresos, Flujo mensual, Flujo acumulado
3. WHEN el Usuario selecciona un año, THE Motor_Cálculo SHALL calcular para cada mes usando únicamente las transacciones de la moneda predeterminada del Usuario: Ingreso (suma de montos reales tipo Ingreso), Egreso (suma de montos reales tipo Egreso), Porcentaje Egresos/Ingresos (Egreso dividido por Ingreso multiplicado por 100), Flujo mensual (Ingreso menos Egreso), Flujo acumulado (suma de flujos mensuales desde enero hasta el mes actual)
4. IF los ingresos de un mes son cero al calcular el porcentaje de egresos sobre ingresos, THEN THE Motor_Cálculo SHALL retornar cero para ese mes
5. THE Flujo_Caja SHALL mostrar una gráfica de línea con el flujo acumulado a lo largo de los 12 meses
6. THE Flujo_Caja SHALL mostrar una gráfica de barras comparando ingresos y egresos de cada mes
7. WHEN el Usuario accede al Flujo_Caja desde un dispositivo con ancho de pantalla menor a 768px, THE Flujo_Caja SHALL permitir desplazamiento horizontal en la tabla para visualizar todos los meses
8. WHEN no existen transacciones para el año seleccionado en la moneda predeterminada, THE Flujo_Caja SHALL mostrar un estado vacío indicando que no hay datos para el año seleccionado

### Requerimiento 10: Conciliación de Caja y Bancos

**User Story:** Como usuario, quiero conciliar mi dinero real con el flujo acumulado, para que pueda verificar que mis registros coinciden con mis saldos reales.

#### Criterios de Aceptación

1. THE Módulo_Conciliación SHALL mostrar campos de: Fecha de corte, Mes, Año, Acumulado automático (calculado desde Flujo_Caja), Ajuste manual, Total base (Acumulado automático más Ajuste manual)
2. WHEN el Usuario selecciona un Mes y Año, THE Motor_Cálculo SHALL obtener el flujo acumulado correspondiente del módulo Flujo_Caja y asignarlo al campo Acumulado automático; IF no existen datos de flujo de caja para el período seleccionado, THEN THE Motor_Cálculo SHALL asignar cero al campo Acumulado automático
3. THE Módulo_Conciliación SHALL mostrar una lista de cuentas bancarias con valores predeterminados: Efectivo, Nequi, Daviplata, Bancolombia, Lulo, Nu
4. THE Módulo_Conciliación SHALL permitir agregar nuevas cuentas bancarias (máximo 20 cuentas, nombre máximo 30 caracteres, nombre único), editar nombres de cuentas existentes y desactivar cuentas
5. WHEN el Usuario ingresa saldos reales en cada Cuenta_Bancaria (permitiendo valores negativos para sobregiros), THE Motor_Cálculo SHALL calcular: Total ubicado (suma de todos los saldos reales de cuentas activas), Pendiente por ubicar (Total base menos Total ubicado), Porcentaje ubicado (Total ubicado dividido por Total base multiplicado por 100)
6. IF el Total base es cero al calcular el porcentaje ubicado, THEN THE Motor_Cálculo SHALL retornar cero
7. THE Módulo_Conciliación SHALL mostrar un estado de conciliación: Cuadrado (cuando Pendiente por ubicar es cero), Falta ubicar (cuando Pendiente por ubicar es mayor a cero), Sobra (cuando Pendiente por ubicar es menor a cero)
8. THE Módulo_Conciliación SHALL mostrar una gráfica de distribución de saldos por cuenta bancaria
9. WHEN el Usuario presiona el botón Guardar conciliación, THE Sistema SHALL persistir los saldos ingresados y los cálculos en las entidades CashReconciliation y CashBalance

### Requerimiento 11: Administración de Catálogos

**User Story:** Como usuario, quiero administrar las listas maestras de tipos, categorías, conceptos, meses, años y monedas, para que pueda personalizar las opciones disponibles en los formularios.

#### Criterios de Aceptación

1. THE Sistema SHALL proveer una página de administración de catálogos con secciones para: Tipos, Categorías de ingreso, Categorías de egreso, Conceptos de ingreso, Conceptos de egreso, Meses, Años, Monedas, permitiendo agregar, editar el nombre y eliminar elementos en cada sección
2. THE Sistema SHALL incluir valores base predeterminados: Tipos (Ingreso, Egreso), Meses (Enero a Diciembre), Monedas (COP, USD, EUR), y SHALL impedir la eliminación o desactivación de estos valores base predeterminados
3. WHEN el Usuario crea una nueva Categoría, THE Sistema SHALL requerir que el Usuario asocie la Categoría a un Tipo (Ingreso o Egreso) y SHALL validar que el nombre de la Categoría no exceda 50 caracteres y sea único dentro del mismo Tipo
4. WHEN el Usuario crea un nuevo Concepto, THE Sistema SHALL requerir que el Usuario asocie el Concepto a una Categoría existente y SHALL validar que el nombre del Concepto no exceda 50 caracteres y sea único dentro de la misma Categoría
5. WHEN el Usuario intenta eliminar un elemento del Catálogo que está siendo usado por al menos una Transacción, THE Sistema SHALL desactivar el elemento en lugar de eliminarlo y SHALL mostrar un indicador visual de estado desactivado en la página de administración
6. WHEN un elemento del Catálogo está desactivado, THE Sistema SHALL excluir ese elemento de las opciones disponibles en los formularios de creación pero mantenerlo visible en registros históricos
7. WHEN el Usuario elimina un elemento del Catálogo que no está siendo usado por ninguna Transacción, THE Sistema SHALL eliminar el elemento de forma permanente previa confirmación del Usuario
8. IF el Usuario intenta desactivar o eliminar una Categoría que tiene Conceptos asociados activos, THEN THE Sistema SHALL desactivar también todos los Conceptos asociados a esa Categoría e informar al Usuario la cantidad de Conceptos afectados
9. IF el Usuario ingresa un nombre vacío o compuesto únicamente por espacios al crear o editar un elemento del Catálogo, THEN THE Sistema SHALL mostrar un mensaje de validación indicando que el nombre es obligatorio

### Requerimiento 12: Análisis y Agrupación de Datos

**User Story:** Como usuario, quiero agrupar y analizar mis datos financieros por diferentes dimensiones, para que pueda identificar patrones de gasto e ingreso.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir agrupar transacciones por una o más dimensiones simultáneamente de las siguientes: Mes, Año, Tipo, Categoría, Concepto
2. THE Sistema SHALL mostrar para cada agrupación: suma de presupuesto, suma de monto real, porcentaje de ejecución (monto real dividido por presupuesto multiplicado por 100) redondeado a 2 decimales
3. IF el presupuesto de una agrupación es cero al calcular el porcentaje de ejecución, THEN THE Motor_Cálculo SHALL retornar cero
4. THE Sistema SHALL permitir filtrar los datos del análisis por rango de fechas (fecha inicio y fecha fin), mostrando por defecto todas las transacciones del año configurado como predeterminado por el Usuario
5. THE Sistema SHALL mostrar los resultados del análisis en formato de tabla tipo pivot donde las filas representan las combinaciones de las dimensiones seleccionadas y las columnas muestran las métricas de presupuesto, monto real y porcentaje de ejecución
6. WHEN el Usuario presiona el botón Exportar CSV en la página de análisis, THE Sistema SHALL generar un archivo CSV con encabezados de columna y todos los registros visibles en la tabla de resultados según los filtros activos
7. THE Sistema SHALL mostrar al menos una gráfica de barras comparando presupuesto versus monto real por la primera dimensión de agrupación seleccionada
8. WHEN los filtros de análisis no producen transacciones coincidentes, THE Sistema SHALL mostrar un estado vacío indicando que no hay datos para los criterios seleccionados

### Requerimiento 13: Pagos Recurrentes

**User Story:** Como usuario, quiero registrar y gestionar mis pagos recurrentes, para que pueda generar transacciones automáticas cada período y no olvidar compromisos de pago.

#### Criterios de Aceptación

1. THE Sistema SHALL proveer un formulario para registrar pagos recurrentes con los campos obligatorios: Nombre (máximo 100 caracteres), Tipo (Ingreso/Egreso), Categoría, Concepto, Monto estimado (valor entre 0.01 y 999,999,999.99), Día de pago (valor entre 1 y 31), Frecuencia (mensual, quincenal, anual, o personalizada donde el Usuario ingresa un intervalo en días entre 1 y 365), Activo/Inactivo; y el campo opcional: Notas (máximo 500 caracteres)
2. THE Sistema SHALL mostrar una lista de todos los pagos recurrentes registrados con opciones para editar, desactivar y eliminar
3. WHEN el Usuario presiona el botón Generar registro mensual en un Pago_Recurrente activo, THE Sistema SHALL mostrar un diálogo de confirmación con los campos: Tipo, Categoría, Concepto, Monto estimado, y la fecha actual como fecha de la transacción a crear
4. WHEN el Usuario confirma la generación, THE Sistema SHALL crear una nueva Transacción asignando: Tipo del Pago_Recurrente como Tipo, Categoría del Pago_Recurrente como Categoría, Concepto del Pago_Recurrente como Concepto, Monto estimado del Pago_Recurrente como Monto real, la fecha actual como Fecha, y el Nombre del Pago_Recurrente como Detalle
5. IF el Pago_Recurrente está inactivo, THEN THE Sistema SHALL deshabilitar el botón de generación de registro para ese Pago_Recurrente
6. WHEN el Usuario presiona el botón Eliminar en un Pago_Recurrente, THE Sistema SHALL mostrar un diálogo de confirmación antes de eliminar el Pago_Recurrente de forma permanente
7. IF el Usuario envía el formulario de Pago_Recurrente con algún campo obligatorio vacío o con valores fuera de los rangos permitidos, THEN THE Sistema SHALL mostrar un mensaje de validación indicando el campo y la restricción incumplida sin crear el registro

### Requerimiento 14: Motor de Cálculos Financieros

**User Story:** Como desarrollador, quiero que todos los cálculos financieros estén centralizados en funciones utilitarias TypeScript reutilizables, para que los cálculos sean consistentes en toda la aplicación.

#### Criterios de Aceptación

1. THE Motor_Cálculo SHALL implementar funciones para: total de ingresos, total de egresos, balance (ingresos menos egresos), flujo mensual, flujo acumulado, distribución por categoría, presupuesto vs monto real, porcentaje de ejecución, conciliación de caja y bancos
2. THE Motor_Cálculo SHALL recibir como parámetro un arreglo de transacciones y retornar el resultado como valor numérico redondeado a 2 decimales para montos monetarios y a 1 decimal para porcentajes
3. IF cualquier función del Motor_Cálculo recibe un divisor igual a cero, THEN THE Motor_Cálculo SHALL retornar cero en lugar de producir un error
4. IF cualquier función del Motor_Cálculo recibe valores null, undefined, NaN o de tipo no numérico en campos de monto, THEN THE Motor_Cálculo SHALL tratar esos valores como cero y continuar el cálculo sin propagar errores
5. THE Motor_Cálculo SHALL garantizar que para cualquier arreglo de transacciones, el resultado de la función de balance sea igual a la diferencia entre el resultado de la función total de ingresos y el resultado de la función total de egresos (propiedad de consistencia)
6. IF cualquier función del Motor_Cálculo recibe un arreglo vacío de transacciones, THEN THE Motor_Cálculo SHALL retornar cero para funciones de totales, balance y flujo, y un arreglo vacío para funciones de distribución por categoría
7. THE Motor_Cálculo SHALL implementar funciones puras sin efectos secundarios, de modo que invocaciones sucesivas con los mismos parámetros de entrada produzcan siempre el mismo resultado

### Requerimiento 15: Modelo de Datos

**User Story:** Como desarrollador, quiero un modelo de datos bien estructurado en Amplify, para que la información se almacene de forma eficiente y segura.

#### Criterios de Aceptación

1. THE Sistema SHALL implementar las siguientes entidades en Amplify Data: Transaction, Category, Concept, CashAccount, CashBalance, CashReconciliation, RecurringPayment, AppSetting, ImportBatch
2. THE Sistema SHALL implementar autorización basada en propietario para todas las entidades de datos, de modo que cada registro solo sea accesible por el Usuario que lo creó
3. WHEN se crea un registro en cualquier entidad, THE Sistema SHALL registrar automáticamente los campos createdAt y updatedAt con la fecha y hora actual en formato ISO 8601
4. WHEN se actualiza un registro en cualquier entidad, THE Sistema SHALL actualizar automáticamente el campo updatedAt con la fecha y hora actual en formato ISO 8601
5. THE Sistema SHALL implementar las siguientes relaciones entre entidades: un Concept pertenece a exactamente una Category, una Transaction referencia exactamente una Category y exactamente un Concept, y un CashBalance referencia exactamente una CashReconciliation y exactamente una CashAccount
6. IF se intenta crear una Transaction referenciando una Category o Concept inexistente, THEN THE Sistema SHALL rechazar la operación indicando que la referencia es inválida

### Requerimiento 16: Configuración de la Aplicación

**User Story:** Como usuario, quiero configurar valores predeterminados de la aplicación, para que los formularios se precarguen con mis preferencias.

#### Criterios de Aceptación

1. THE Sistema SHALL almacenar configuraciones del Usuario: moneda predeterminada, año predeterminado, mes predeterminado; WHEN un Usuario inicia sesión por primera vez, THE Sistema SHALL crear un registro de configuración con los valores iniciales: moneda COP, año actual, mes actual
2. WHEN el Usuario abre un formulario o filtro, THE Sistema SHALL precargar los campos de moneda, año y mes con los valores predeterminados del Usuario
3. WHEN el Usuario modifica una configuración predeterminada, THE Sistema SHALL persistir el cambio y aplicarlo en todos los formularios y filtros de la aplicación al navegar a cualquier otra página
4. IF el valor configurado como predeterminado ya no existe en los catálogos activos (por ejemplo una moneda desactivada), THEN THE Sistema SHALL usar el primer valor activo disponible del catálogo correspondiente como valor predeterminado