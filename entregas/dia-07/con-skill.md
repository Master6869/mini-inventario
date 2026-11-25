Esta prueba de Playwright edita el nombre de un producto y comprueba, después de recargar la página, que el cambio quedó guardado. Usa un producto exclusivo de pruebas, ya que el bloque `finally` restaura su nombre original.

El entorno de ejecución no pudo iniciarse y el repositorio está en modo de solo lectura. No pude leer la skill `pruebas-inventario`, guardar el archivo ni ejecutar la prueba. La ruta, los selectores y la sesión autenticada deben coincidir con la configuración del proyecto.

```ts
import { expect, test } from '@playwright/test'

test('guarda el nuevo nombre de un producto', async ({ page }) => {
  const nombreOriginal = 'Producto de prueba'
  const nombreEditado = `${nombreOriginal} ${Date.now()}`

  // Este caso presupone una sesión autenticada y un producto de prueba existente.
  await page.goto('/productos')

  const fila = (nombre: string) =>
    page.getByRole('row').filter({
      has: page.getByRole('cell', { name: nombre, exact: true }),
    })

  const editarNombre = async (actual: string, nuevo: string) => {
    await fila(actual).getByRole('button', { name: 'Editar', exact: true }).click()
    await page.getByLabel('Nombre', { exact: true }).fill(nuevo)
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(fila(nuevo)).toBeVisible()
  }

  await expect(fila(nombreOriginal)).toBeVisible()

  try {
    await editarNombre(nombreOriginal, nombreEditado)
    await page.reload()
    await expect(fila(nombreEditado)).toBeVisible()
    await expect(fila(nombreOriginal)).toHaveCount(0)
  } finally {
    await page.goto('/productos')
    const original = fila(nombreOriginal)
    const editado = fila(nombreEditado)
    await expect(original.or(editado)).toBeVisible()

    if (await editado.isVisible()) {
      await editarNombre(nombreEditado, nombreOriginal)
    }
  }
})
```