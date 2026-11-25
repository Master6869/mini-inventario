# Día 2 — Planeación requisitos y diseño

## Objetivo y entregables

Planear Mini Inventario sin implementar código. La entrega contiene cinco
historias en `docs/requisitos.md`, diseño técnico en `docs/diseno.md`, cinco
issues con criterios como listas de tareas y un PR de `dia-02-planeacion`.

Repositorio público: https://github.com/Master6869/mini-inventario

Esta planeación se completa después de los Días 3 y 4. Se conserva ese historial
y se distinguen requisitos objetivo de funciones ya implementadas. SKU y
paginación quedan como trabajo de implementación futuro.

## Modo de planeación y comandos

El comando de la actividad para abrir una sesión nueva de Codex es:

```powershell
codex --sandbox read-only --ask-for-approval on-request
```

No se lanzó otro agente ni se ejecutó una sesión nueva con ese comando. En este
chat se revisaron primero archivos, ramas e issues con consultas de lectura;
después se escribieron los documentos y se publicaron las issues y el PR
autorizados. El sandbox de solo lectura no permite por sí solo guardar esos
archivos: la publicación requiere una acción de escritura autorizada aparte.
No se cambió el código de la aplicación ni la base de datos.

## Prompts clave

> Vamos a planear Mini Inventario, una web donde una persona inicia sesión,
> registra productos con nombre, SKU, cantidad y cantidad mínima, y ve cuáles
> están por debajo del mínimo. No escribas código. Hazme preguntas sobre lo que
> no esté claro y luego propone 5 historias de usuario, cada una con criterios
> de aceptación que se puedan comprobar.

> Propón el diseño técnico de Mini Inventario y guárdalo en docs/diseno.md. Usa
> Node.js con Express para servir la página, HTML y JavaScript sin framework, y
> Supabase para base de datos e inicio de sesión. Define la tabla productos con
> id, user_id, nombre, sku, cantidad, minimo y created_at. Explica qué valida cada
> capa.

> Crea un issue en GitHub por cada historia de docs/requisitos.md usando gh.
> Pon los criterios de aceptación como lista de tareas. Muéstrame cada comando
> antes de ejecutarlo.

## Preguntas y criterio propio

El agente preguntó por la unicidad del SKU. El usuario eligió explícitamente:
**«Sí, único por usuario»**. Por tanto, dos cuentas pueden usar el mismo código,
pero una misma cuenta no puede repetirlo, incluso cambiando mayúsculas o espacios
exteriores. El plan adopta una forma canónica en mayúsculas.

También se preguntó qué segunda corrección exigir. El usuario eligió:
**«Probar que nadie pueda leer o cambiar productos ajenos aunque conozca su ID»**.

## Dos correcciones realizadas a la propuesta del agente

### Corrección 1 Incorporar SKU y precisar su unicidad

El diseño reconstruido previamente por la IA para el Día 4 omitía SKU porque la
web existente no lo tenía. La actividad del Día 2 sí lo requiere: se corrigieron
el modelo y los criterios para incluir `sku`, normalización y unicidad del par
`user_id` y `sku`, con mensaje de duplicado. El usuario confirmó esa regla.

Se comprobó que el campo aparece en el esquema de siete columnas y en las
historias de registrar, consultar y editar. No se ha aplicado una migración
durante esta planeación.

### Corrección 2 Exigir una prueba directa de acceso ajeno

El objetivo general de inventarios separados se precisó con el criterio elegido
por el usuario: no basta observar que la interfaz de B no lista productos de A.
Se exige consultar, editar y borrar un ID ajeno mediante una petición directa,
sin el filtro de la interfaz. También se comprueban propietarios falsos y
transferencias. Se añadieron criterios a HU02, HU03, HU04 y HU05 y al diseño RLS.

Esta corrección es una precisión de la prueba de aceptación; no se afirma que
la implementación previa careciera de RLS o permitiera accesos indebidos.

## Error de la IA detectado

La omisión de SKU en el diseño anterior dejó el modelo incompleto frente al
enunciado del Día 2. Se detectó comparando las siete columnas requeridas con
el documento anterior. La corrección queda planificada, no implementada.

## Un comando aprobado y un enfoque rechazado

Se autoriza crear cinco issues con `gh issue create --body-file ...`, porque
publica un plan revisable con sus criterios y conserva los saltos de línea.
Se muestran los cinco comandos antes de ejecutarlos y se comprueba cada salida.

Se descarta modificar `public/productos.js` o ejecutar una migración para añadir
SKU en este paso: empezar a codificar incumpliría el alcance de planeación.
Fue una decisión de alcance aplicada por el agente, no una negativa atribuida
al usuario.

## Ramas y publicación

La rama `dia-02-planeacion` parte de `dia-01-configuracion`, ya que el PR del Día 1
todavía está abierto. El PR del Día 2 compara contra esa rama para mostrar solo
la documentación de planeación. Integrar los PR en main queda pendiente de revisión.

## Verificación de la entrega

Se crearon las cinco issues mediante `gh`, mostrando antes sus comandos:

| Historia | Issue | Criterios como tareas |
| --- | --- | --- |
| HU01 Acceso | [#3](https://github.com/Master6869/mini-inventario/issues/3) | 5 |
| HU02 Registro con SKU | [#4](https://github.com/Master6869/mini-inventario/issues/4) | 5 |
| HU03 Consulta y stock bajo | [#5](https://github.com/Master6869/mini-inventario/issues/5) | 6 |
| HU04 Edición | [#6](https://github.com/Master6869/mini-inventario/issues/6) | 5 |
| HU05 Eliminación | [#7](https://github.com/Master6869/mini-inventario/issues/7) | 5 |

La lectura posterior con `gh issue list --json number,title,body,url` confirmó
que cada título y cuerpo coincide con el documento preparado, normalizando
únicamente los saltos de línea de Windows. Hay 26 tareas, todas sin marcar.
Se comprobó también la presencia de los siete campos del diseño objetivo.

Los enlaces y el conteo están en [issues.json](issues.json), y el resultado
de la comprobación está en [verificacion.txt](verificacion.txt).

Comando representativo aprobado, con un archivo de texto completo para evitar
problemas de comillas o pérdida de saltos de línea:

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' issue create --repo Master6869/mini-inventario --title '[Día 2][HU02] Registrar un producto con SKU' --body-file '.npm-cache\guia-git\dia02-issues\hu02.md'
```

El archivo usado por `--body-file` fue un auxiliar local de preparación; su
contenido publicado se verificó contra los criterios de la historia. No se
debe repetir ese comando para una issue que ya existe.

Los criterios funcionales describen pruebas futuras. En este día solo se
verifican documentos, correspondencia de las cinco issues, listas de tareas,
coherencia del diseño, cambios limitados a documentación y enlaces publicados.
