# Día 09 — Contenedor de Mini Inventario

El Dockerfile usa Node.js 22, instala dependencias de producción desde el lockfile y copia únicamente el servidor y el sitio público. Ejecuta el proceso como usuario node. El puerto 3000 es el valor local de referencia; Express escucha en 0.0.0.0 y toma PORT del entorno.

La configuración de Supabase se entrega al iniciar el contenedor. El contexto de Docker excluye archivos de entorno, dependencias locales, pruebas y entregas.

Para probar en local, construye la imagen con docker build -t mini-inventario . y arráncala con docker run --rm --env-file .env -e PORT=3000 -p 3000:3000 mini-inventario. Comprueba /health antes de revisar el inicio de sesión.

## Verificación local

- El primer intento encontró Docker Desktop detenido. Después de iniciarlo, la imagen se construyó y respondió con status ok en /health, con PORT=3400. La configuración pública de prueba se cargó correctamente y el proceso corrió como node. La comprobación dentro del contenedor confirmó que no había .env, test ni entregas.
- Las cinco pruebas de Node pasaron. La primera petición HTTP llegó antes de que el contenedor estuviera listo. Se repitió esperando a /health.
- En un Dockerfile temporal, RUN npm run no-existe detuvo la construcción con Missing script: "no-existe" y código 1. El Dockerfile original volvió a construir correctamente.

Quedan pendientes el servicio público de Render, sus logs y las capturas de los despliegues.

- [Despliegues Docker en Render](https://render.com/docs/docker)
- [MCP de Render](https://render.com/docs/mcp-server)
