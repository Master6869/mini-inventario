# Mini Inventario — Día 4

Aplicación Node.js y Express con registro e inicio de sesión por correo,
inventario personal en Supabase y operaciones para crear, consultar, editar y
eliminar productos. La versión del Día 3 se conserva en la rama `main`.

**Estado:** web implementada y migración aplicada mediante MCP al proyecto remoto.
RLS, políticas y permisos verificados; la prueba SQL remota de CRUD y acceso
ajeno pasó y se revirtió. Falta la prueba visual con dos cuentas reales.
Véase [la bitácora](entregas/dia-04/README.md).

## Ejecutar

Requiere Node.js 22 o superior. Desde la carpeta del proyecto:

```powershell
npm ci
npm run build
Copy-Item .env.example .env
```

Si ya tienes `.env`, conserva ese archivo y no lo sobrescribas. Completa:

```dotenv
SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
SUPABASE_KEY=TU_LLAVE_PUBLICA_PUBLISHABLE_O_ANON
PORT=3000
```

El proyecto de esta actividad es `nkmxpxhxyqwleubukfvs`. La llave pública se obtiene
en la configuración de Claves API de Supabase. Nunca usar una secret key ni
service_role. `.env` está excluido de Git y no está dentro de `public/`.

```powershell
npm start
```

Abre http://localhost:3000. Después de cambiar `.env`, reinicia el servidor.
`/config.js` publica únicamente la URL y la llave pública, con `Cache-Control:
no-store`. Con configuración ausente o llave no permitida responde 503 y la web
explica que falta configurar Supabase.

## Base de datos y MCP

El esquema está en [docs/diseno.md](docs/diseno.md). Ese documento se reconstruyó
desde el modelo existente porque faltaba en el Día 3. La migración está en
`supabase/migrations/20261125220239_crear_productos.sql`.

```powershell
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=nkmxpxhxyqwleubukfvs"
codex mcp login supabase
```

Si `mcp add` ya completó OAuth automáticamente, el inicio de sesión ya está
realizado. La migración `crear_productos` ya está aplicada; no volver a ejecutarla.
Su versión local coincide con el historial remoto. Para futuros cambios, revisar
el SQL completo y comprobar el esquema mediante MCP antes de aplicarlo. No
volver a crear una tabla existente ni aplicar SQL por otra vía.

La tabla usa UUID, propietario `user_id`, nombre, cantidad, mínimo y fecha. RLS
restringe las cuatro operaciones al propietario autenticado. UPDATE comprueba
tanto la fila anterior como la nueva para impedir cambiar de propietario.

## Usar la web

1. Crear cuenta con correo y contraseña. Si la confirmación está activada,
   confirmar el correo antes de iniciar sesión.
2. Iniciar sesión, agregar productos y editar sus cantidades.
3. El estado de stock bajo se calcula como `cantidad < minimo`.
4. Eliminar un producto requiere confirmarlo en la interfaz.
5. Cerrar sesión limpia los productos visibles. Otra cuenta carga sus propios
   productos. La protección definitiva de los datos está en RLS.

Los productos antiguos de localStorage no se importan automáticamente. El SDK
sí puede usar almacenamiento del navegador para conservar la sesión de Auth.

## Verificar

```powershell
npm test
node scripts/verificar-ui.cjs
git status
git check-ignore .env
git ls-files -- .env
```

- `npm test`: seguridad HTTP de `/config.js`, bloqueo de secretos y archivos
  internos, y migración/RLS en PostgreSQL local embebido con dos identidades.
- `verificar-ui.cjs`: navegador de prueba, acceso en escritorio/móvil, controles
  privados ocultos sin sesión y mensaje por configuración incompleta. En Windows
  usa Edge; en otros sistemas requiere Chromium de Playwright instalado.
- `git check-ignore .env` debe devolver `.env`; `git ls-files -- .env` no debe
  devolver nada.

Estas comprobaciones locales no sustituyen las pruebas remotas con dos usuarios
confirmados descritas en la bitácora. Las capturas actuales muestran solo la
página de acceso.

## Archivos principales

| Archivo | Función |
| --- | --- |
| server.js | Express, lectura de .env y ruta pública de configuración. |
| public/supabase.js | Cliente único de Supabase. |
| public/productos.js | CRUD y validaciones, con propietario de cada escritura. |
| public/app.js | Acceso, sesiones y vista de productos. |
| scripts/supabase-browser.js | Entrada para compilar el SDK local. |
| public/vendor/supabase.js | SDK compilado, sin depender de un CDN. |
| docs/diseno.md | Campos y reglas del modelo. |
| supabase/migrations/ | SQL aplicado mediante MCP y alineado con el historial remoto. |
| entregas/dia-04/ | Bitácora y evidencias con su estado real. |

Las dependencias Supabase, el compilador y las herramientas de prueba tienen
versiones fijadas y archivo de bloqueo. Para regenerar el SDK usa `npm run build`.

## Pruebas del Día 5

La rama `dia-05-pruebas` incorpora cuatro pruebas reales de Playwright Test y
la corrección de la tabla móvil. Su configuración inicia una copia independiente
en el puerto 3005, que debe estar libre antes de probar.

Configura `TEST_EMAIL` y `TEST_PASSWORD` en `.env` con una cuenta confirmada de
pruebas. No publiques esos valores. Ejecuta `npm run test:e2e` para la suite y
`node scripts/demostrar-mutacion.cjs` para provocar y revertir el fallo de stock.
`npm test` ejecuta por separado las cinco pruebas unitarias existentes.

La exploración repetible se ejecuta con `node scripts/explorar-dia05.cjs` y usa
Playwright CLI instalado globalmente. Las pruebas generan nombres UUID y limpian
solo sus registros. El usuario eligió usar nombres únicos y posponer SKU.
Las capturas y resultados reales están en [la bitácora del Día 5](entregas/dia-05/README.md).
