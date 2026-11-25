import { listarProductos, guardarProducto } from './productos.js';

const formulario = document.querySelector('form');
const tabla = document.querySelector('table');
const cuerpo = tabla.querySelector('tbody');
const mensaje = document.querySelector('#estado');
const cancelar = document.querySelector('#cancelar');
const titulo = document.querySelector('#titulo-formulario');
let idEdicion = '';

function terminarEdicion() {
  idEdicion = '';
  mensaje.textContent = '';
  formulario.reset();
  titulo.textContent = 'Agregar producto';
  cancelar.hidden = true;
}

function mostrarProductos() {
  const productos = listarProductos();
  tabla.hidden = productos.length === 0;
  document.querySelector('#vacio').hidden = productos.length > 0;
  cuerpo.replaceChildren();

  for (const producto of productos) {
    const fila = cuerpo.insertRow();
    const bajo = producto.cantidad < producto.minimo;
    const estado = bajo ? 'Bajo el mínimo' : 'Stock suficiente';
    for (const valor of [producto.nombre, producto.cantidad, producto.minimo, estado]) {
      fila.insertCell().textContent = valor;
    }
    fila.cells[3].classList.toggle('bajo', bajo);
    const editar = document.createElement('button');
    editar.type = 'button';
    editar.textContent = 'Editar';
    editar.setAttribute('aria-label', 'Editar ' + producto.nombre);
    editar.addEventListener('click', () => {
      idEdicion = producto.id;
      for (const campo of ['nombre', 'cantidad', 'minimo']) {
        formulario.elements[campo].value = producto[campo];
      }
      titulo.textContent = 'Editar producto';
      cancelar.hidden = false;
      mensaje.textContent = '';
      formulario.elements.nombre.focus();
    });
    fila.insertCell().append(editar);
  }
}

formulario.addEventListener('submit', evento => {
  evento.preventDefault();
  try {
    guardarProducto({ ...Object.fromEntries(new FormData(formulario)), id: idEdicion });
    terminarEdicion();
    mostrarProductos();
    mensaje.textContent = 'Producto guardado.';
  } catch (error) {
    mensaje.textContent = error.message;
  }
});

cancelar.addEventListener('click', terminarEdicion);
mostrarProductos();
