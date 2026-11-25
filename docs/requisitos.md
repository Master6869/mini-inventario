# Requisitos de Mini Inventario — Día 2

## Objetivo y alcance

Planear una web donde cada persona inicia sesión y administra su propio
inventario. Esta entrega define requisitos y diseño; no implementa funciones,
no aplica SQL y no modifica la aplicación de los Días 3 y 4.

Se reconstruye la planeación después de esas actividades. Los criterios de
aceptación son condiciones para comprobar una implementación, no resultados
que se afirmen aprobados en esta entrega.

## Decisiones confirmadas por el usuario

- SKU obligatorio, único por usuario y normalizado a mayúsculas sin espacios
  exteriores. Dos usuarios distintos pueden usar el mismo SKU.
- Incluir una prueba negativa: conocer el ID de un producto ajeno no permite
  leerlo, editarlo ni eliminarlo. La seguridad se exige en la base de datos.

## Reglas comunes

- Nombre: texto recortado, entre 1 y 100 caracteres; se permiten nombres repetidos.
- SKU: de 1 a 40 caracteres; letras A–Z, dígitos, guion y guion bajo. Se recorta
  y convierte a mayúsculas antes de validar; no se permiten espacios internos.
  ` ab-01 ` y `AB-01` representan el mismo SKU para una misma cuenta.
- Cantidad y mínimo: enteros entre 0 y 2147483647, sin valores vacíos, negativos,
  decimales ni notación exponencial en el formulario.
- Stock bajo significa estrictamente `cantidad < minimo`; la igualdad no alerta.
- Una sesión identifica al propietario. El navegador no puede asignar productos
  a otra persona ni transferir su propiedad.
- Las pruebas de aislamiento usan dos cuentas confirmadas y consultas directas
  con sus sesiones, sin depender del filtro de la interfaz.

## HU01 Registro e inicio y cierre de sesión

Como persona usuaria, quiero crear una cuenta e iniciar y cerrar sesión con
correo y contraseña, para acceder a mi inventario personal.

### Criterios de aceptación

- [ ] Con un correo válido y una contraseña que cumpla la política de Supabase
  (al menos 8 caracteres en el formulario), el registro informa su resultado;
  si exige confirmar el correo, muestra ese paso sin afirmar que ya hay sesión.
- [ ] Una cuenta confirmada con credenciales correctas inicia sesión y muestra
  su correo y los controles de inventario; credenciales incorrectas no dan acceso.
- [ ] Al recargar con una sesión válida se restaura el acceso sin mostrar datos
  de otra cuenta; con sesión ausente o caducada se solicita iniciar sesión.
- [ ] Cerrar sesión oculta y limpia los productos visibles; una respuesta anterior
  pendiente no vuelve a mostrarlos después del cierre o cambio de cuenta.
- [ ] Sin sesión no se pueden consultar ni modificar productos mediante la API.

## HU02 Registrar un producto con SKU

Como persona autenticada, quiero registrar nombre, SKU, cantidad y mínimo,
para incorporar un producto identificado a mi inventario.

### Criterios de aceptación

- [ ] Guardar `Tornillo`, SKU ` ab-01 `, cantidad 10 y mínimo 3 crea exactamente
  un producto propio con SKU `AB-01`, identificador y fecha de creación.
- [ ] Nombre o SKU vacío, SKU con espacios internos, nombre mayor de 100
  caracteres o SKU mayor de 40 se rechazan con un mensaje claro y sin crear filas.
- [ ] Cantidad y mínimo aceptan 0 y 2147483647; rechazan vacíos, negativos,
  decimales y valores superiores al límite, sin guardar datos parciales.
- [ ] Intentar otro producto con SKU `AB-01` en la misma cuenta informa el
  duplicado y no crea una segunda fila, incluso con peticiones simultáneas.
- [ ] Otra cuenta puede crear su propio SKU `AB-01`; enviar un `user_id` ajeno
  en una inserción directa es rechazado por la base de datos.

## HU03 Consultar productos y detectar stock bajo

Como persona autenticada, quiero ver mis productos y distinguir los que están
por debajo del mínimo, para saber qué existencias debo reponer.

### Criterios de aceptación

- [ ] La lista muestra nombre, SKU, cantidad, mínimo y estado de cada producto
  propio; una cuenta sin productos ve un mensaje de lista vacía.
- [ ] Con mínimo 5, cantidad 4 muestra `Bajo el mínimo`; cantidad 5 y cantidad 6
  muestran `Stock suficiente`. Con cantidad 0 y mínimo 0 no hay alerta.
- [ ] El estado se distingue mediante texto y no solo por color.
- [ ] Los productos aparecen en un orden estable por fecha e ID; si hay más
  registros que el límite de una página, se pueden consultar las páginas siguientes.
- [ ] Con la sesión de B, consultar directamente el ID de un producto de A no
  devuelve la fila ni su contenido, incluso sin filtrar por `user_id`.
- [ ] Un fallo de red o de permisos informa el problema; no se presenta como
  lista vacía ni se reutilizan productos de otra sesión.

## HU04 Editar un producto propio

Como persona autenticada, quiero editar los datos de mis productos,
para mantener actualizado el inventario sin duplicar registros.

### Criterios de aceptación

- [ ] Editar un producto carga sus cuatro campos; guardar cambios válidos
  actualiza la misma fila, conserva su ID, propietario y fecha de creación.
- [ ] Cancelar la edición no modifica los datos guardados.
- [ ] Las reglas de nombre, SKU y cantidades son las mismas que al registrar;
  editar sin cambiar el SKU es válido y usar el SKU de otro producto propio no.
- [ ] Cambiar la cantidad o el mínimo actualiza el estado de stock con la regla
  estricta; si el guardado falla no se anuncia éxito ni se pierde el formulario.
- [ ] Una petición directa de B para editar un ID de A no cambia ninguna fila;
  A tampoco puede transferir su producto a B alterando `user_id`.

## HU05 Eliminar un producto propio

Como persona autenticada, quiero eliminar un producto que ya no uso,
para mantener mi inventario sin registros innecesarios.

### Criterios de aceptación

- [ ] Eliminar muestra una confirmación con el nombre del producto; cancelar
  conserva el registro y la lista.
- [ ] Confirmar elimina exactamente el producto propio seleccionado y actualiza
  la lista; si era el último, muestra el estado vacío.
- [ ] Una petición directa de B para borrar un ID de A no elimina ninguna fila;
  al volver a A el producto permanece sin cambios.
- [ ] Un error de red o permisos se comunica sin anunciar una eliminación exitosa.
- [ ] El cierre de sesión durante la operación no vuelve a mostrar productos de
  esa cuenta cuando termina una respuesta pendiente.

## Fuera del alcance de esta planeación

No se incluyen compras, ventas, precios, proveedores, inventarios compartidos,
roles de administrador, importación masiva ni avisos por correo. La búsqueda
por nombre o SKU puede planearse después. No se ejecutan migraciones, pruebas
funcionales de la web ni despliegues durante el Día 2.

## Diferencia con la versión existente

El modelo reconstruido para el Día 4 omitía SKU. Incorporarlo requiere después
una migración nueva, resolver los SKU de productos existentes sin sobrescribir
datos y adaptar formularios, consultas y validaciones. La paginación explícita
tampoco se da por implementada. Estos puntos quedan en las issues del plan.
