# Día 07 — Skill y subagente

La rama parte del PR borrador del Día 4, donde están Supabase y las pruebas disponibles. No se encontraron ramas de los días 5 o 6 en GitHub.

## Comparación

Ejecuté dos sesiones efímeras y de solo lectura con el mismo pedido: «Escribe una prueba de Playwright para editar un producto».

| Sesión | Resultado observado |
|---|---|
| [Sin la skill](sin-skill.md) | Selecciona una fila por su celda y comprueba persistencia al recargar. Supone una ruta y un producto preexistente. Omite el acceso, la limpieza y el caso inválido. |
| [Con la skill disponible](con-skill.md) | Codex detectó la skill, pero su entorno de ejecución falló antes de que pudiera leerla. El borrador añadió restauración del nombre, aunque conservó una ruta supuesta y una sesión preexistente. Tampoco cubrió un error. |

La comparación muestra diferencias entre los borradores. El fallo del entorno impide atribuirlas a la lectura de la skill. Para repetir la prueba en el proyecto habría que configurar una cuenta de pruebas, usar solo el producto creado por el caso y comprobar que una edición inválida conserva el valor anterior. Esta rama todavía carece de SKU, por lo que la skill contempla un nombre único mientras tanto.

## Reintento con la skill cargada explícitamente

Con el mismo pedido se hizo una tercera sesión de solo lectura, suministrando la skill y las etiquetas reales como contexto. El [resultado](skill-contexto-explicito.md) usa las credenciales del entorno, crea un nombre único, acota la edición a su fila, cubre un valor correcto y uno inválido, y plantea limpiar su propio producto. Cambiaron dos variables, la skill y el contexto del repositorio. Queda pendiente aislar el efecto de la activación automática.

La corrección consistió en aportar once etiquetas, rutas o condiciones del flujo como contexto, además del texto de la skill. La propuesta todavía debe manejar el caso en que la creación falle y la limpieza no encuentre la fila.

## Revisión

El subagente de solo lectura revisó el diff contra main y el diff contra la base del Día 4. El resultado de git status --porcelain fue vacío antes y después. No encontró credenciales privadas ni consultas sin aislamiento propias del Día 7.

- Gravedad media, esta bitácora. Faltaban los resultados de ambas sesiones. Se agregaron los borradores reales y el error que impidió validar el efecto de la skill.
- Gravedad media, scripts/verificar-ui.cjs. Las pruebas heredadas de navegador cubren el acceso y la configuración, pero queda pendiente verificar la edición con una sesión autenticada. Se necesita un entorno de pruebas autorizado.
- Gravedad baja, .agents/skills/supabase-postgres-best-practices/references/_contributing.md. El diff contra main contiene un espacio final heredado de la rama base.
