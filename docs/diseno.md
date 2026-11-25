# Diseño técnico de Mini Inventario — Día 2

## Estado del documento

Diseño objetivo para las cinco historias de `docs/requisitos.md`. Es una entrega
de planeación, completada después de los Días 3 y 4; no describe todo como ya
implementado. No contiene SQL para ejecutar ni aplica cambios a Supabase.

## Arquitectura y stack

- **Node.js 22 y Express:** sirven HTML, CSS y JavaScript de `public/`, una ruta
  de salud y `/config.js` con una lista explícita de configuración pública.
- **HTML y JavaScript nativos:** formularios, tabla accesible, estados de carga
  y errores, validaciones de interacción y cliente oficial de Supabase.
- **Supabase Auth:** registro, confirmación de correo cuando corresponda,
  inicio de sesión, renovación de tokens y cierre de sesión.
- **PostgreSQL de Supabase:** persistencia, restricciones, unicidad y RLS.
- **Python 3.12:** requisito de las herramientas del curso; no se necesita
  un segundo servidor Python para esta web.

El navegador carga la web desde Express y usa el SDK de Supabase para Auth y
la API de datos. Las peticiones de productos incluyen la sesión del usuario;
PostgreSQL autoriza cada operación con RLS. Express no sustituye esa autorización
ni recibe las contraseñas en una API propia de inventario.

## Componentes previstos

| Componente | Responsabilidad |
| --- | --- |
| `server.js` | Servir `public/`, leer `.env` y entregar configuración permitida. |
| `public/index.html` y CSS | Acceso, formulario con SKU, listado y mensajes accesibles. |
| `public/supabase.js` | Crear un único cliente oficial con llave pública. |
| `public/productos.js` | Consultas y escrituras asíncronas, normalización y validación. |
| `public/app.js` | Eventos, sesión, renderizado y descarte de respuestas antiguas. |
| `supabase/migrations/` | Cambios SQL futuros revisados, con historial reproducible. |

## Modelo de datos objetivo

Tabla `public.productos`; los usuarios se gestionan en Supabase Auth.

| Campo | Tipo PostgreSQL | Reglas previstas |
| --- | --- | --- |
| `id` | `uuid` | Clave primaria; UUID generado por la base. |
| `user_id` | `uuid` | Obligatorio; referencia `auth.users(id)`; propietario de la sesión. |
| `nombre` | `text` | Obligatorio, recortado, de 1 a 100 caracteres. |
| `sku` | `text` | Obligatorio, de 1 a 40 caracteres; A–Z, dígitos, guion o guion bajo; mayúsculas, sin espacios. |
| `cantidad` | `integer` | Obligatorio; de 0 a 2147483647. |
| `minimo` | `integer` | Obligatorio; de 0 a 2147483647. |
| `created_at` | `timestamptz` | Fecha generada por la base; se conserva al editar. |

La unicidad se aplica al par `(user_id, sku)`, no a SKU global. La base comprueba
la forma canónica del SKU y una restricción única impide duplicados aun ante
escrituras simultáneas. Los nombres pueden repetirse. El UUID y `created_at`
no se aceptan como datos editables del formulario.

El índice único compuesto comienza por `user_id`, por lo que también sirve a
las consultas de propiedad. Al incorporar esa restricción se revisará si el
índice individual por `user_id` existente resulta redundante; no se eliminará
ningún índice durante esta planeación. El orden de consulta será
`created_at` y después `id`, con paginación para evitar listas truncadas.

Se conserva la relación de borrado en cascada al eliminar una cuenta como
decisión del modelo existente. No se incorpora una función de borrar cuentas
en esta entrega; cualquier acción que borre datos requiere aprobación.

El estado `Bajo el mínimo` se calcula como `cantidad < minimo`; no se guarda
como columna, para que no quede desactualizado al editar existencias.

## Qué valida cada capa

### Formulario y JavaScript

Comprueban los campos requeridos, longitudes y formato de números; recortan el
nombre y normalizan el SKU a mayúsculas. Ofrecen mensajes comprensibles,
confirmación para eliminar y bloqueo de envíos repetidos. Usan `textContent`
para mostrar nombres y SKU sin interpretarlos como HTML. Estas validaciones
mejoran la experiencia, pero pueden eludirse con peticiones directas.

### Express

Sirve únicamente `public/`. Lee `.env` fuera de esa carpeta y publica solo
`SUPABASE_URL` y `SUPABASE_KEY` permitidos mediante `/config.js`, sin caché.
Rechaza llaves secretas y `service_role`; nunca serializa todas las variables de
entorno. Al no recibir las escrituras de productos, no es la capa que autoriza
al propietario ni la que garantiza la unicidad del SKU.

### Supabase Auth y PostgreSQL

Auth valida credenciales y sesiones. PostgreSQL valida tipos, obligatoriedad,
rangos, formato canónico del SKU, claves foráneas y unicidad por propietario.
RLS impone la autorización aun cuando el formulario y sus filtros se omitan.
Las contraseñas se gestionan con Supabase Auth; no se guardan en `productos`.

## Autorización y RLS

RLS debe estar activo en `public.productos`, con permisos mínimos para el rol
`authenticated` y cuatro políticas independientes:

| Operación | Condición de acceso |
| --- | --- |
| SELECT | La fila pertenece a `auth.uid()`. |
| INSERT | El propietario nuevo coincide con `auth.uid()`. |
| UPDATE | Tanto la fila actual como la resultante pertenecen a `auth.uid()`. |
| DELETE | La fila que se elimina pertenece a `auth.uid()`. |

UPDATE necesita una política SELECT y las condiciones USING y WITH CHECK para
no permitir transferencias de propietario. Se empleará la forma
`(select auth.uid())` y se acotarán las políticas a `authenticated`. El rol anon
no obtiene permisos sobre productos. No se usarán funciones SECURITY DEFINER
para resolver permisos ni claves privilegiadas en el navegador.

Las consultas del cliente también filtran por propietario para limitar el
trabajo y expresar la intención, pero ese filtro no es la barrera de seguridad.
Las pruebas negativas enviarán IDs ajenos y quitarán el filtro de interfaz.

Referencia técnica consultada: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Sesiones y errores

El cliente mantiene la sesión con el SDK. La vista se limpia al salir o cambiar
de cuenta, y una respuesta pendiente de la cuenta anterior se descarta. Los
callbacks de Auth no esperan consultas de Supabase dentro del mismo bloqueo;
el trabajo asíncrono se programa fuera de ellos.

Se distinguen lista vacía, carga, falta de sesión y error de red/permisos.
Los errores no se presentan como guardados exitosos. Un SKU duplicado produce
un mensaje específico; la base de datos garantiza la restricción, incluso si
una validación previa del cliente no detectó la concurrencia.

## Configuración y trabajo posterior

`.env.example` indica los nombres de variables sin valores sensibles y `.env`
permanece ignorado y no rastreado. Las dependencias del SDK tendrán versiones
fijadas y archivo de bloqueo. Cada implementación se hará en una rama con PR.

La aplicación y la tabla del Día 4 no tienen SKU. Para cumplir el diseño se
planeará una migración nueva: identificar registros existentes, acordar sus
SKU, completar el campo y añadir las restricciones cuando los datos cumplan.
No se inventarán SKU definitivos ni se editará una migración ya aplicada.

## Plan de comprobación

1. Probar registro, confirmación, credenciales incorrectas y cierre de sesión.
2. Probar los límites de nombre, SKU y cantidades, duplicados y concurrencia.
3. Probar stock bajo con 4/5, 5/5, 6/5 y 0/0, además de una lista paginada.
4. Probar editar/cancelar y eliminar/confirmar/cancelar con productos propios.
5. Con dos cuentas reales, comprobar que B no lee, cambia ni borra el ID de A;
   intentar un INSERT con propietario ajeno y un UPDATE que transfiera propiedad.
6. Verificar que no se expongan secretos y revisar asesores de Supabase después
   de cada futura migración.

Estas son pruebas previstas. El Día 2 verifica coherencia documental, issues y
PR; no afirma haber aprobado las pruebas funcionales de este diseño objetivo.
