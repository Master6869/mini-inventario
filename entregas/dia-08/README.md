# Día 08 — MCP de inventario

El servidor local ofrece buscar_producto y stock_bajo. Ambos devuelven hasta 50 filas y trabajan en una transacción de solo lectura. Los nombres se tratan como datos y la búsqueda usa un parámetro literal. La tabla utilizada es la de la rama del Día 4.

## Puesta en marcha

1. Crea un entorno virtual con Python 3.12. Instala requirements.txt de esta carpeta del servidor con el Python del entorno.
2. En un proyecto de pruebas autorizado, revisa el [SQL del rol de lectura](../../mcp-inventario/rol-pruebas.sql) y limita la política a la cuenta de prueba. El SQL es una propuesta pendiente de aprobación. Guarda la URL del Session pooler en mcp-inventario/.env como DATABASE_URL.
3. Registra el servidor usando el ejecutable del entorno y la ruta absoluta de server.py como argumento.
4. Registra el MCP oficial con un único project_ref, read_only=true y features=database. Ejecuta la misma consulta de stock bajo en ambos.

Pendiente de conexión al proyecto de pruebas: comparar pasos y resultados, comprobar el rechazo de escritura y registrar cómo se maneja un nombre de producto con instrucciones incrustadas.

- [Configuración del MCP oficial](https://supabase.com/docs/guides/ai-tools/mcp)

## Verificación local

Se comprobó la sintaxis de Python y que Git ignora el archivo de entorno. Con PostgreSQL local y dos cuentas ficticias, el rol leyó solo el producto de la cuenta autorizada. El intento de insertar prueba-escritura y el intento de leer user_id devolvieron SQLSTATE 42501.
