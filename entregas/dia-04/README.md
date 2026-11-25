# Día 4 — Datos e inicio de sesión con Supabase

## Estado de la actividad

Implementación local preparada. **Migración remota pendiente de revisión y de
disponibilidad de las herramientas MCP en la sesión.** No se ha demostrado aún
el aislamiento con dos cuentas reales del proyecto.

- Repositorio: https://github.com/Master6869/mini-inventario
- Base del Día 3: `main`, commit `a54eb40`.
- Rama de trabajo: `dia-04-supabase`.
- Proyecto Supabase: `nkmxpxhxyqwleubukfvs`.
- MCP registrado y autenticado con la URL limitada a ese proyecto.
- Skills oficiales instaladas y leídas: supabase y supabase-postgres-best-practices.

## Cambios

- Registro con correo y contraseña, aviso de confirmación por correo, inicio,
  restauración y cierre de sesión.
- Productos en Supabase mediante el cliente oficial, con crear, consultar,
  editar y eliminar. Cada escritura incluye el propietario.
- Vista privada limpiada al cambiar o cerrar sesión; respuestas antiguas no
  vuelven a mostrar productos de una sesión anterior.
- Ruta `/config.js` con lista explícita de URL y llave pública, sin caché.
  Llaves secretas o JWT de un rol distinto de anon son rechazados.
- `.env` ignorado por Git y `.env.example` sin valores sensibles.
- Diseño reconstruido en `docs/diseno.md`, porque ese documento no existía.
- Migración con RLS y políticas independientes para las cuatro operaciones.

## Prompts clave

1. Conectar datos reales e inicio de sesión con Supabase, mostrando los cambios.
2. Guardar el Día 3 en GitHub y desarrollar el Día 4 en una rama aparte.
3. Usar únicamente llave pública y políticas `user_id = auth.uid()`.

El usuario autorizó posteriormente continuar con las acciones necesarias.

## Un error de la IA y cómo se detectó

La IA intentó guardar el primer commit y crear la rama del Día 4 en una secuencia
de comandos sin detenerse al fallar `git add`. La restricción de escritura en
`.git` produjo `Permission denied`, y el commit no se creó.
Se detectó leyendo el código de salida y los mensajes de Git. Se corrigió con
la ejecución autorizada con permisos adecuados y comprobando cada código de
salida antes de seguir. `main` y `dia-04-supabase` partieron del mismo commit.

## Un comando aprobado y por qué

`git init --initial-branch=main`: aprobado para versionar la aplicación existente.
Después se guardó el Día 3 y se creó una rama aparte para proteger esa base.

La conexión MCP se configuró con:

```powershell
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=nkmxpxhxyqwleubukfvs"
```

El propio comando abrió el flujo OAuth y el usuario completó la autorización.
La sesión informó `Successfully logged in`.

## Verificación local

```powershell
npm run build
npm test
node scripts/verificar-ui.cjs
git status
git check-ignore .env
git ls-files -- .env
```

Las pruebas HTTP comprueban que no se publican variables extra ni archivos
internos y que se rechazan llaves privilegiadas. La prueba SQL ejecuta la
migración real en PostgreSQL embebido (PGlite), simulando los roles y auth.uid()
de Supabase: CRUD propio, bloqueo de lectura/edición/borrado ajenos, rechazo de
propietarios falsos y de transferencias, y acceso denegado para anon.

**Estas pruebas locales no sustituyen la verificación del proyecto remoto.**
Las capturas `acceso-escritorio.png` y `acceso-movil.png` documentan solo la vista
de acceso; no son evidencias de aislamiento entre usuarios reales.

## Prueba pendiente con dos cuentas reales

1. Aplicar la migración revisada mediante el MCP del proyecto y comprobar RLS,
   políticas, permisos e índice. Ejecutar los asesores de seguridad.
2. En Supabase Authentication → Users, crear dos usuarios de prueba confirmados.
   No guardar sus contraseñas en Git ni en esta bitácora.
3. Abrir la web con la cuenta A, crear un producto A y comprobar editar y eliminar.
   Dejar un producto A visible y capturar la sesión con el correo de A.
4. Cerrar sesión. Abrir la cuenta B en otro perfil o ventana privada. Debe comenzar
   sin el producto A. Crear un producto B y capturar la sesión con el correo de B.
5. Volver a A: debe ver A y no B, también después de recargar.
6. Mediante el cliente autenticado de B, consultar, editar y borrar directamente
   el ID del producto A: ninguna operación debe devolver filas ni cambiar A.
   Intentar insertar con user_id de A y transferir un producto B a A: deben fallar.
   Las peticiones deben probarse también sin el filtro user_id de la interfaz.
7. Cerrar sesión: no deben verse productos ni mostrarse respuestas antiguas.
8. Guardar los resultados reales y las dos capturas antes de dar la actividad
   por completada o marcar el PR como listo.

## Explicación del SQL

La tabla conserva nombre, cantidad y mínimo, añade UUID, propietario y fecha.
La referencia a auth.users elimina los productos si se elimina su propietario.
Las restricciones rechazan nombres vacíos o con espacios exteriores, y cantidades
negativas. El índice por propietario ayuda a evaluar RLS.

SELECT y DELETE aplican USING a las filas existentes. INSERT aplica WITH CHECK
a la fila nueva. UPDATE incluye ambos: el usuario debe poseer la fila original
y la fila resultante debe seguir siendo suya. Los permisos se limitan a las
cuatro operaciones para authenticated; anon no recibe acceso a esta tabla.
