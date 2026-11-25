import { obtenerSupabase } from './supabase.js';

export const MAX_CANTIDAD = 2147483647;
const columnas = 'id,nombre,cantidad,minimo';

async function usuarioActual() {
  const { data, error } = await obtenerSupabase().auth.getUser();
  if (error || !data.user) throw new Error('Inicia sesión para gestionar tus productos.');
  return data.user;
}

function comprobar(error) {
  if (!error) return;
  if (error.code === '42P01' || error.code === 'PGRST205') {
    throw new Error('La tabla productos aún no está disponible. Falta aplicar la migración de Supabase.');
  }
  throw new Error('No se pudo completar la operación. Comprueba la conexión y los permisos de tu sesión.');
}

export async function listarProductos() {
  const usuario = await usuarioActual();
  const { data, error } = await obtenerSupabase().from('productos')
    .select(columnas).eq('user_id', usuario.id).order('created_at').order('id');
  comprobar(error);
  return data;
}

export async function guardarProducto({ id, nombre, cantidad, minimo }) {
  const nombreLimpio = String(nombre ?? '').trim();
  const cantidadesValidas = [cantidad, minimo].every(valor =>
    /^\d+$/.test(String(valor)) && Number.isSafeInteger(Number(valor)) &&
    Number(valor) <= MAX_CANTIDAD);
  if (!nombreLimpio || Array.from(nombreLimpio).length > 100 || !cantidadesValidas) {
    throw new Error(`Escribe un nombre de hasta 100 caracteres y cantidades enteras entre 0 y ${MAX_CANTIDAD}.`);
  }
  const usuario = await usuarioActual();
  const producto = { nombre: nombreLimpio, cantidad: Number(cantidad), minimo: Number(minimo) };
  const tabla = obtenerSupabase().from('productos');
  const consulta = id
    ? tabla.update(producto).eq('id', id).eq('user_id', usuario.id)
    : tabla.insert({ ...producto, user_id: usuario.id });
  const { data, error } = await consulta.select(columnas).single();
  comprobar(error);
  return data;
}

export async function eliminarProducto(id) {
  const usuario = await usuarioActual();
  const { error } = await obtenerSupabase().from('productos').delete()
    .eq('id', id).eq('user_id', usuario.id).select('id').single();
  comprobar(error);
}
