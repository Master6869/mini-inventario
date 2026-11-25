---
name: pruebas-inventario
description: Usa esta skill al escribir, actualizar o revisar pruebas Playwright de Mini Inventario, incluidos el inicio de sesión y la edición de productos.
---

# Pruebas de Mini Inventario

- Guarda las pruebas Playwright en tests/. Usa las etiquetas de los formularios y los roles accesibles. Acota el botón Editar a la fila del producto.
- Lee la URL y las credenciales de una cuenta de pruebas desde el entorno. Mantén la sesión y los datos de prueba separados de producción.
- Genera un SKU único por caso. Si la rama todavía carece de SKU, identifica el producto con un nombre único y registra la diferencia.
- Conserva el identificador de cada producto que crea la prueba. En la limpieza elimina únicamente esos registros con la sesión de la cuenta de pruebas, incluso cuando falla una comprobación. Si trabajas con una simulación aislada, desecha su estado al terminar.
- Cubre el cambio válido y un error de edición. Verifica la persistencia al recargar y que se conserva el valor anterior cuando la edición se rechaza.
