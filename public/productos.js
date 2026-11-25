const clave = 'mini-inventario.productos';

export function listarProductos() {
  return JSON.parse(localStorage.getItem(clave) ?? '[]');
}

export function guardarProducto({ id, nombre, cantidad, minimo }) {
  const producto = {
    id: id || crypto.randomUUID(),
    nombre: nombre.trim(),
    cantidad: Number(cantidad),
    minimo: Number(minimo),
  };
  const valoresValidos = [cantidad, minimo].every(
    valor => /^\d+$/.test(valor) && Number.isSafeInteger(Number(valor))
  );
  if (!producto.nombre || !valoresValidos) {
    throw new Error('Escribe un nombre y usa cantidades enteras mayores o iguales a cero.');
  }

  const lista = listarProductos();
  if (id) {
    const posicion = lista.findIndex(item => item.id === id);
    if (posicion === -1) throw new Error('El producto ya no existe.');
    lista[posicion] = producto;
  } else {
    lista.push(producto);
  }
  localStorage.setItem(clave, JSON.stringify(lista));
}
