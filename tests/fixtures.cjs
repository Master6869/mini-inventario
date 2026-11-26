const { test: base, expect } = require('@playwright/test');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('node:crypto');

const test = base.extend({
  cuentaPruebas: [async ({}, use) => {
    const api = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await api.auth.signInWithPassword({
      email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD,
    });
    if (error || !data.user) throw new Error('La cuenta TEST no pudo iniciar sesión. Comprueba que esté confirmada y que .env sea correcto.');
    try { await use({ api, userId: data.user.id }); }
    finally { await api.auth.signOut({ scope: 'local' }); }
  }, { scope: 'worker' }],

  productoTemporal: async ({ cuentaPruebas }, use) => {
    const token = randomUUID().replaceAll('-', '');
    const producto = { nombre: 'E2E-D5-' + token };
    try { await use(producto); }
    finally {
      // Solo elimina el nombre UUID de esta prueba y el usuario TEST autenticado.
      const { error } = await cuentaPruebas.api.from('productos').delete()
        .eq('user_id', cuentaPruebas.userId).eq('nombre', producto.nombre);
      if (error) throw new Error('No se pudo limpiar el producto temporal de esta prueba.');
      const { data, error: consultaError } = await cuentaPruebas.api.from('productos')
        .select('id').eq('user_id', cuentaPruebas.userId).eq('nombre', producto.nombre);
      if (consultaError) throw new Error('No se pudo comprobar la limpieza de la prueba.');
      expect(data, 'La prueba debe terminar sin su producto temporal').toHaveLength(0);
    }
  },

  vigilarErrores: [async ({ page }, use, info) => {
    const errores = [];
    page.on('pageerror', error => errores.push(error.message));
    await use();
    if (info.status !== info.expectedStatus && !page.isClosed()) {
      const captura = info.outputPath('fallo-sin-credenciales.png');
      try {
        await page.screenshot({
          path: captura,
          mask: [page.locator('#sesion'), page.locator('[name=email]'), page.locator('[name=password]')],
        });
        await info.attach('captura-sin-credenciales', { path: captura, contentType: 'image/png' });
      } catch { /* El informe conserva la causa original aunque no se pueda capturar. */ }
    }
    expect(errores, 'Sin excepciones JavaScript no controladas').toEqual([]);
  }, { auto: true }],
});

async function iniciarSesion(page) {
  await page.goto('/');
  await page.locator('#acceso-form [name=email]').fill(process.env.TEST_EMAIL);
  await page.locator('#acceso-form [name=password]').fill(process.env.TEST_PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.locator('#inventario')).toBeVisible();
}

async function agregar(page, producto, cantidad, minimo) {
  await page.locator('#producto-form [name=nombre]').fill(producto.nombre);
  await page.locator('#producto-form [name=cantidad]').fill(String(cantidad));
  await page.locator('#producto-form [name=minimo]').fill(String(minimo));
  await page.getByRole('button', { name: 'Guardar producto', exact: true }).click();
  await expect(page.locator('#estado')).toHaveText('Producto guardado.');
  return page.locator('tbody tr').filter({ hasText: producto.nombre });
}

module.exports = { test, expect, iniciarSesion, agregar };
