import { listarProductos, guardarProducto, eliminarProducto } from './productos.js';
import { obtenerSupabase } from './supabase.js';

const formulario = document.querySelector('#producto-form');
const acceso = document.querySelector('#acceso-form');
const inventario = document.querySelector('#inventario');
const listado = document.querySelector('#listado');
const tabla = document.querySelector('table');
const cuerpo = tabla.querySelector('tbody');
const mensaje = document.querySelector('#estado');
const estadoAcceso = document.querySelector('#estado-acceso');
const cancelar = document.querySelector('#cancelar');
const titulo = document.querySelector('#titulo-formulario');
const salir = document.querySelector('#salir');
const sesionTexto = document.querySelector('#sesion');
const vacio = document.querySelector('#vacio');
let idEdicion = '';
let usuarioId = '';
let revision = 0;
let ocupado = false;

function terminarEdicion() {
  idEdicion = '';
  formulario.reset();
  titulo.textContent = 'Agregar producto';
  cancelar.hidden = true;
}

function bloquearFormulario(bloqueado) {
  for (const control of formulario.elements) control.disabled = bloqueado;
}

function mensajeError(error) {
  return error?.message || 'No se pudo completar la operación.';
}

async function mostrarProductos() {
  const actual = ++revision;
  const usuario = usuarioId;
  tabla.hidden = true;
  cuerpo.replaceChildren();
  vacio.hidden = false;
  vacio.textContent = 'Cargando productos…';
  try {
    const productos = await listarProductos();
    if (actual !== revision || usuario !== usuarioId) return false;
    tabla.hidden = productos.length === 0;
    vacio.hidden = productos.length > 0;
    vacio.textContent = 'Todavía no hay productos en tu cuenta.';
    for (const producto of productos) {
      const fila = cuerpo.insertRow();
      const bajo = producto.cantidad < producto.minimo;
      for (const valor of [producto.nombre, producto.cantidad, producto.minimo,
        bajo ? 'Bajo el mínimo' : 'Stock suficiente']) {
        fila.insertCell().textContent = valor;
      }
      fila.cells[3].classList.toggle('bajo', bajo);
      const acciones = fila.insertCell();
      const editar = document.createElement('button');
      editar.type = 'button';
      editar.textContent = 'Editar';
      editar.setAttribute('aria-label', 'Editar ' + producto.nombre);
      editar.addEventListener('click', () => {
        if (ocupado) return;
        idEdicion = producto.id;
        for (const campo of ['nombre', 'cantidad', 'minimo']) formulario.elements[campo].value = producto[campo];
        titulo.textContent = 'Editar producto';
        cancelar.hidden = false;
        mensaje.textContent = '';
        formulario.elements.nombre.focus();
      });
      const eliminar = document.createElement('button');
      eliminar.type = 'button';
      eliminar.textContent = 'Eliminar';
      eliminar.className = 'peligro';
      eliminar.setAttribute('aria-label', 'Eliminar ' + producto.nombre);
      eliminar.addEventListener('click', async () => {
        if (ocupado || !window.confirm(`¿Eliminar «${producto.nombre}»?`)) return;
        ocupado = true;
        bloquearFormulario(true);
        const usuario = usuarioId;
        try {
          await eliminarProducto(producto.id);
          if (usuario !== usuarioId) return;
          if (idEdicion === producto.id) terminarEdicion();
          if (await mostrarProductos()) mensaje.textContent = 'Producto eliminado.';
        } catch (error) {
          if (usuario === usuarioId) mensaje.textContent = mensajeError(error);
        } finally {
          ocupado = false;
          bloquearFormulario(false);
        }
      });
      acciones.append(editar, eliminar);
    }
    return true;
  } catch (error) {
    if (actual !== revision || usuario !== usuarioId) return false;
    vacio.textContent = 'No se pudieron cargar tus productos.';
    mensaje.textContent = mensajeError(error);
    return false;
  }
}

function actualizarSesion(sesion) {
  const nuevoId = sesion?.user?.id || '';
  sesionTexto.textContent = sesion?.user?.email || '';
  salir.hidden = !nuevoId;
  acceso.hidden = Boolean(nuevoId);
  inventario.hidden = !nuevoId;
  listado.hidden = !nuevoId;
  if (usuarioId === nuevoId) {
    if (!nuevoId) estadoAcceso.textContent = 'Inicia sesión para ver tus productos.';
    return;
  }
  usuarioId = nuevoId;
  revision++;
  cuerpo.replaceChildren();
  tabla.hidden = true;
  mensaje.textContent = '';
  terminarEdicion();
  if (nuevoId) {
    estadoAcceso.textContent = 'Sesión iniciada. Tus productos solo son visibles para tu cuenta.';
    // Las consultas se ejecutan fuera del callback síncrono de Auth.
    setTimeout(() => { if (usuarioId === nuevoId) void mostrarProductos(); }, 0);
  } else {
    estadoAcceso.textContent = 'Inicia sesión para ver tus productos.';
  }
}

formulario.addEventListener('submit', async evento => {
  evento.preventDefault();
  if (ocupado) return;
  const datos = { ...Object.fromEntries(new FormData(formulario)), id: idEdicion };
  const usuario = usuarioId;
  ocupado = true;
  bloquearFormulario(true);
  mensaje.textContent = 'Guardando…';
  try {
    await guardarProducto(datos);
    if (usuario !== usuarioId) return;
    terminarEdicion();
    if (await mostrarProductos()) mensaje.textContent = 'Producto guardado.';
  } catch (error) {
    if (usuario === usuarioId) mensaje.textContent = mensajeError(error);
  } finally {
    ocupado = false;
    bloquearFormulario(false);
  }
});

acceso.addEventListener('submit', async evento => {
  evento.preventDefault();
  const email = acceso.elements.email.value.trim();
  const password = acceso.elements.password.value;
  const registro = evento.submitter?.value === 'registro';
  const controles = [...acceso.elements];
  controles.forEach(control => { control.disabled = true; });
  estadoAcceso.textContent = registro ? 'Creando cuenta…' : 'Iniciando sesión…';
  try {
    const auth = obtenerSupabase().auth;
    const { data, error } = registro
      ? await auth.signUp({ email, password })
      : await auth.signInWithPassword({ email, password });
    if (error) throw error;
    acceso.elements.password.value = '';
    if (registro && !data.session) {
      estadoAcceso.textContent = 'Revisa tu correo para confirmar el registro; después inicia sesión.';
    }
  } catch (error) {
    estadoAcceso.textContent = mensajeError(error);
  } finally {
    controles.forEach(control => { control.disabled = false; });
  }
});

salir.addEventListener('click', async () => {
  salir.disabled = true;
  try {
    const { error } = await obtenerSupabase().auth.signOut();
    if (error) throw error;
    actualizarSesion(null);
  } catch (error) {
    estadoAcceso.textContent = mensajeError(error);
  } finally {
    salir.disabled = false;
  }
});

cancelar.addEventListener('click', () => { terminarEdicion(); mensaje.textContent = ''; });
try {
  obtenerSupabase().auth.onAuthStateChange((_evento, sesion) => actualizarSesion(sesion));
} catch (error) {
  estadoAcceso.textContent = mensajeError(error);
  for (const control of acceso.elements) control.disabled = true;
}
