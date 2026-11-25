# Mini Inventario

Web para registrar productos, consultar existencias y detectar stock bajo.

## Requisitos del proyecto

- Node.js 22 para ejecutar la aplicación web.
- Python 3.12 para las actividades y herramientas del curso.

## Ejecutar la web

```powershell
npm ci
npm start
```

Abrir http://localhost:3000. La web actual usa Node.js; no necesita iniciar un
servidor Python. El puerto se puede cambiar con la variable `PORT`.

## Trabajo en equipo y seguridad

Cada cambio se realiza en una rama y se revisa mediante un pull request.
Las instrucciones de Codex están en [AGENTS.md](AGENTS.md). No se publican llaves,
contraseñas ni archivos `.env`; las dependencias y los entornos virtuales se
excluyen mediante `.gitignore`.

Repositorio público: https://github.com/Master6869/mini-inventario

Entregables del inicio del proyecto: [Día 1](entregas/dia-01/README.md).

Esta rama documenta el Día 1 a partir de la base ya existente del Día 3; los
archivos de la aplicación se conservan. El trabajo de Supabase continúa en
`dia-04-supabase`.
