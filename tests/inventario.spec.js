const { test, expect, iniciarSesion, agregar } = require('./fixtures.cjs');
const { randomUUID } = require('node:crypto');

test('iniciar sesión con la cuenta de pruebas y cerrar sesión', async ({ page, productoTemporal }) => {
  await iniciarSesion(page);
  await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page.locator('#inventario')).toBeHidden();
  await expect(page.locator('#listado')).toBeHidden();
});

test('rechazar una contraseña incorrecta', async ({ page, productoTemporal }) => {
  await page.goto('/');
  await page.locator('#acceso-form [name=email]').fill(process.env.TEST_EMAIL);
  await page.locator('#acceso-form [name=password]').fill('Incorrecta-' + randomUUID());
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.locator('#estado-acceso')).toContainText(/invalid login credentials|credenciales.*incorrect|contraseña.*incorrect/i);
  await expect(page.locator('#inventario')).toBeHidden();
  await expect(page.locator('#listado')).toBeHidden();
});

test('agregar un producto y comprobar que persiste al recargar', async ({ page, productoTemporal }) => {
  await iniciarSesion(page);
  const fila = await agregar(page, productoTemporal, 10, 3);
  await expect(fila).toHaveCount(1);
  await expect(fila.getByText('Stock suficiente', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('tbody tr').filter({ hasText: productoTemporal.nombre })).toHaveCount(1);
});

test('marcar stock bajo y respetar el límite de igualdad', async ({ page, productoTemporal }) => {
  await iniciarSesion(page);
  const fila = await agregar(page, productoTemporal, 1, 5);
  await expect(fila.getByText('Bajo el mínimo', { exact: true })).toBeVisible();
  await expect(fila.locator('.bajo')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  const medidas = await page.locator('.tabla').evaluate(contenedor => ({
    anchoDisponible: contenedor.clientWidth,
    anchoTabla: contenedor.querySelector('table').scrollWidth,
    anchoDocumento: document.documentElement.scrollWidth,
    anchoVentana: innerWidth,
  }));
  expect(medidas.anchoTabla, 'Estado y acciones deben caber sin desplazamiento horizontal').toBeLessThanOrEqual(medidas.anchoDisponible);
  expect(medidas.anchoDocumento).toBeLessThanOrEqual(medidas.anchoVentana);
  await fila.getByRole('button', { name: 'Editar ' + productoTemporal.nombre, exact: true }).click();
  await page.locator('#producto-form [name=cantidad]').fill('5');
  await page.getByRole('button', { name: 'Guardar producto', exact: true }).click();
  await expect(page.locator('#estado')).toHaveText('Producto guardado.');
  await expect(fila.getByText('Stock suficiente', { exact: true })).toBeVisible();
  await expect(fila.locator('.bajo')).toHaveCount(0);
});
