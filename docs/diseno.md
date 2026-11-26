# Diseño de Mini Inventario — Día 4

Este archivo no existía en la versión del Día 3. El diseño se reconstruyó a partir
de `public/productos.js` y del formulario existente, conservando sus campos.

## Tabla `public.productos`

| Campo | Tipo | Regla |
| --- | --- | --- |
| id | uuid | Clave primaria; UUID generado por PostgreSQL. |
| user_id | uuid | Obligatorio; referencia a auth.users(id), con borrado en cascada. |
| nombre | text | Obligatorio, sin espacios exteriores, entre 1 y 100 caracteres. |
| cantidad | integer | Obligatorio, entre 0 y 2147483647. |
| minimo | integer | Obligatorio, entre 0 y 2147483647. |
| created_at | timestamptz | Fecha de creación generada por la base de datos. |

No se añade SKU porque la versión existente no lo incluye. Un producto tiene
stock bajo cuando `cantidad < minimo`; ese estado se calcula en la interfaz.
Los límites de cantidades coinciden en formulario, JavaScript y PostgreSQL.

## Propiedad y acceso

- Cada producto pertenece a un usuario de Supabase Auth.
- RLS se activa desde la migración; hay políticas independientes para SELECT,
  INSERT, UPDATE y DELETE, limitadas al rol authenticated.
- SELECT y DELETE requieren que auth.uid() coincida con user_id.
- INSERT comprueba el propietario del registro nuevo.
- UPDATE comprueba tanto la propiedad actual como la resultante, para impedir
  transferir productos a otra cuenta.
- anon no tiene permisos sobre la tabla. authenticated recibe únicamente
  SELECT, INSERT, UPDATE y DELETE, sujetos a RLS.
- Un índice por user_id acelera el filtro de propiedad.

## Aplicación

Node sirve únicamente `public/`. Lee `.env` fuera de esa carpeta y publica una
lista explícita de dos valores en `/config.js`: la URL y la llave pública.
Rechaza llaves secretas y JWT con un rol distinto de anon. La configuración no
se almacena en caché. El navegador usa el cliente oficial con versión fijada.

Los productos se guardan en PostgreSQL. El SDK puede persistir la sesión de Auth
en el navegador, pero no se usan productos de localStorage ni se importan
automáticamente los datos del Día 3.
