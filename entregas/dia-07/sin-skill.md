Esta prueba de Playwright abre un producto existente, cambia su nombre y vuelve a abrirlo después de recargar la página para comprobar que el cambio se guardó.

No pude acceder al proyecto para guardar ni ejecutar la prueba. El ejemplo asume que Playwright tiene `baseURL` configurada, que `/productos` muestra una tabla y que `Camiseta básica` es un producto reservado para esta prueba en una base de datos de pruebas que se reinicia entre ejecuciones. Ajusta la ruta y los textos a los de tu interfaz.

```ts
import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('guarda el nombre editado de un producto', async ({ page }) => {
  const nombreOriginal = 'Camiseta básica';
  const nombreNuevo = `Camiseta ${randomUUID().slice(0, 8)}`;

  await page.goto('/productos');

  const filaOriginal = page.getByRole('row').filter({
    has: page.getByRole('cell', { name: nombreOriginal, exact: true }),
  });

  await filaOriginal.getByRole('button', { name: 'Editar', exact: true }).click();

  const campoNombre = page.getByRole('textbox', { name: 'Nombre', exact: true });
  await expect(campoNombre).toHaveValue(nombreOriginal);
  await campoNombre.fill(nombreNuevo);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();

  const filaEditada = page.getByRole('row').filter({
    has: page.getByRole('cell', { name: nombreNuevo, exact: true }),
  });

  await expect(filaEditada).toBeVisible();
  await page.reload();
  await filaEditada.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(campoNombre).toHaveValue(nombreNuevo);
});
```