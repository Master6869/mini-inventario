Propuesta para `tests/editar-producto.test.cjs`. Comprueba que un cambio válido del mínimo persiste al recargar y que el formulario rechaza un mínimo negativo sin alterar el valor guardado. Como esta rama aún no tiene SKU, la prueba usa un nombre único para identificar y eliminar solo el producto que crea.

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');

test('edita el mínimo y conserva el valor guardado si la edición es inválida', async (t) => {
  const { BASE_URL, TEST_EMAIL, TEST_PASSWORD } = process.env;
  assert.ok(BASE_URL && TEST_EMAIL && TEST_PASSWORD,
    'Configura BASE_URL, TEST_EMAIL y TEST_PASSWORD para el entorno de pruebas');

  const browser = await chromium.launch();
  const nombre = `Producto E2E ${randomUUID()}`;
  let page;
  let intentoCrear = false;

  t.after(async () => {
    try {
      if (intentoCrear) {
        await page.reload();
        const fila = filaProducto();
        await fila.waitFor({ state: 'visible' });

        const confirmacion = page.waitForEvent('dialog');
        const eliminar = fila.getByRole('button', { name: 'Eliminar', exact: true });
        await Promise.all([
          confirmacion.then((dialogo) => dialogo.accept()),
          eliminar.click(),
        ]);
        await fila.waitFor({ state: 'hidden' });
      }
    } finally {
      await browser.close();
    }
  });

  const context = await browser.newContext();
  page = await context.newPage();
  page.setDefaultTimeout(10_000);

  function filaProducto() {
    return page.getByRole('row').filter({
      has: page.getByText(nombre, { exact: true }),
    });
  }

  const minimo = page.getByLabel('Mínimo', { exact: true });
  const guardar = page.getByRole('button', { name: 'Guardar producto', exact: true });
  const guardado = page.getByText('Producto guardado.', { exact: true });

  async function abrirEdicion() {
    await filaProducto().getByRole('button', { name: 'Editar', exact: true }).click();
    await minimo.waitFor({ state: 'visible' });
  }

  await page.goto(new URL('/', BASE_URL).href);
  await page.getByLabel('Correo', { exact: true }).fill(TEST_EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();

  await page.getByLabel('Producto', { exact: true }).fill(nombre);
  await page.getByLabel('Cantidad', { exact: true }).fill('10');
  await minimo.fill('2');
  intentoCrear = true;
  await guardar.click();
  await guardado.waitFor({ state: 'visible' });

  await page.reload(); // Descarta el aviso de creación antes de editar.
  await abrirEdicion();
  assert.equal(await minimo.inputValue(), '2');
  await minimo.fill('5');
  await guardar.click();
  await guardado.waitFor({ state: 'visible' });

  await page.reload();
  await abrirEdicion();
  assert.equal(await minimo.inputValue(), '5', 'El mínimo editado debe persistir');

  await minimo.fill('-1');
  await guardar.click();
  assert.equal(
    await minimo.evaluate((input) => input.validity.rangeUnderflow),
    true,
    'El formulario debe rechazar un mínimo menor que cero',
  );
  assert.equal(await guardado.isVisible(), false);

  await page.reload();
  await abrirEdicion();
  assert.equal(await minimo.inputValue(), '5', 'El intento inválido no debe cambiar el mínimo');
});
```

No ejecuté la prueba. Para correrla, apunta `BASE_URL` a un entorno aislado de producción, configura las credenciales de una cuenta de pruebas y ejecuta `node --test tests/editar-producto.test.cjs`.