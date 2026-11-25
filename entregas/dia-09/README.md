# Día 09 — Contenedor de Mini Inventario

El Dockerfile usa Node.js 22, instala dependencias de producción desde el lockfile y copia únicamente el servidor y el sitio público. Ejecuta el proceso como usuario node. El puerto 3000 es el valor local de referencia; Express escucha en 0.0.0.0 y toma PORT del entorno.

La configuración de Supabase se entrega al iniciar el contenedor. El contexto de Docker excluye archivos de entorno, dependencias locales, pruebas y entregas.

Para probar en local, construye la imagen con docker build -t mini-inventario . y arráncala con docker run --rm --env-file .env -e PORT=3000 -p 3000:3000 mini-inventario. Comprueba /health antes de revisar el inicio de sesión.

Pendiente: construir cuando el motor de Docker esté disponible, y validar los despliegues correcto, fallido y recuperado en un servicio de pruebas de Render.

- [Despliegues Docker en Render](https://render.com/docs/docker)
- [MCP de Render](https://render.com/docs/mcp-server)
