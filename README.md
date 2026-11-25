# Mini Inventario

Una aplicación web ligera para el control y gestión básica de inventario con detección automática de stock bajo, persistencia en el navegador y un servidor de archivos estáticos en Node.js con Express.

---

## ¿Cómo funciona la aplicación?

El flujo general de la aplicación es el siguiente:

1. **Carga y Visualización Inicial**:
   - Al abrir la página (`index.html`), el script `app.js` invoca a `listarProductos()` de `productos.js`.
   - Se leen los productos guardados en el `localStorage` del navegador bajo la clave `mini-inventario.productos`.
   - Si no hay registros, se muestra un mensaje de aviso ("Todavía no hay productos"). Si hay productos, se renderizan dinámicamente en una tabla HTML.

2. **Detección Automática de Estado de Stock**:
   - Durante el renderizado de cada producto se evalúa:
     $$\text{cantidad} < \text{mínimo}$$
   - Si la cantidad está por debajo del umbral mínimo, se marca con la etiqueta **"Bajo el mínimo"** en color de alerta (rojo oscuro) para facilitar su identificación visual inmediata.
   - En caso contrario, se muestra **"Stock suficiente"**.

3. **Registro y Edición de Productos**:
   - **Creación**: El usuario ingresa Nombre, Cantidad y Stock Mínimo. Al presionar *Guardar producto*, se genera un identificador único mediante `crypto.randomUUID()` y se agrega al listado.
   - **Edición**: Al hacer clic en el botón *Editar* de una fila, los datos del producto se cargan automáticamente en el formulario, el título cambia a *"Editar producto"* y se muestra el botón *"Cancelar edición"*. Al guardar, se actualiza el producto existente conservando su `id`.
   - **Cancelación**: Al pulsar *"Cancelar edición"*, se limpian los campos y el formulario regresa a modo creación.

4. **Validaciones**:
   - El nombre no puede estar vacío ni compuesto solo de espacios.
   - La cantidad y el mínimo deben ser números enteros mayores o iguales a cero (`/^\d+$/` y enteros seguros en JavaScript).
   - En caso de error, se informa al usuario mediante un mensaje de estado en tiempo real.

5. **Persistencia de Datos**:
   - Todos los cambios se serializan en formato JSON y se almacenan en el `localStorage` del navegador, por lo que los datos no se pierden al recargar la página.

---

## ¿Qué se hizo prácticamente?

1. **Backend Minimalista (Node.js + Express 5)**:
   - Configuración de un servidor en `server.js` que sirve los archivos estáticos de la carpeta `public/`.
   - Incorporación de un endpoint `/health` que responde `{ "status": "ok" }` para verificar la operatividad del servicio.
   - Configuración de puerto configurable mediante la variable de entorno `PORT` (por defecto: `3000`).

2. **Frontend Modular y Semántico**:
   - **HTML accesible**: Uso de etiquetas semánticas (`<main>`, `<section>`, `<form>`, `<table>`), atributos de accesibilidad (`aria-labelledby`, `role="status"`, `aria-label`) para lectores de pantalla.
   - **Diseño CSS moderno**: Maquetación responsive con Flexbox y CSS Grid, estados de foco accesibles (`:focus-visible`) y tipografía del sistema.
   - **Separación de responsabilidades con ES Modules (`type="module"`)**:
     - `productos.js`: Contiene la lógica del modelo de datos, acceso a `localStorage` y validación de reglas de negocio.
     - `app.js`: Actúa como controlador de la vista; captura eventos del usuario, actualiza el DOM y gestiona los estados de la interfaz.

---

## Estructura del Proyecto

```text
Titulado de IA/
├── public/                     # Archivos estáticos del frontend
│   ├── app.js                  # Controlador de UI y eventos del DOM
│   ├── estilos.css             # Estilos y diseño visual de la interfaz
│   ├── index.html              # Estructura semántica de la página web
│   └── productos.js            # Modelo de datos, validaciones y localStorage
├── .gitignore                  # Exclusión de archivos (node_modules, etc.)
├── package.json                # Configuración de dependencias y scripts de Node
├── package-lock.json           # Árbol de dependencias bloqueadas
├── README.md                   # Documentación del proyecto
└── server.js                   # Servidor web Express y endpoint de salud
```

### Detalle de cada archivo

| Archivo | Rol y Descripción |
| :--- | :--- |
| `server.js` | Inicializa el servidor Express, expone `/health` y sirve la carpeta `public/`. |
| `public/index.html` | Define la vista: formulario de captura/edición y tabla de productos. |
| `public/estilos.css` | Define la apariencia visual, distribución responsiva y alertas de stock. |
| `public/productos.js` | Funciones `listarProductos()` y `guardarProducto()` con validación estricta y almacenamiento en `localStorage`. |
| `public/app.js` | Orquesta la interacción: manejo del submit, renderizado de filas, llenado para edición y reseteo. |
| `package.json` | Define el proyecto `mini-inventario`, motor Node `>=22` y dependencia de `express ^5.0.0`. |

---

## Requisitos y Ejecución

### Requisitos previos
- [Node.js](https://nodejs.org/) (versión 22 o superior recomendada).
- npm (incluido con Node.js).

### Instalación de dependencias
```bash
npm install
```

### Iniciar el servidor
```bash
npm start
```

Una vez iniciado, abre tu navegador web en:
```
http://localhost:3000
```

Para verificar el estado del servidor:
```
http://localhost:3000/health
```
