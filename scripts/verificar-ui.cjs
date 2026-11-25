const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');
const { chromium } = require('playwright');
const { crearApp } = require('../server');

(async () => {
  const server = crearApp({
    SUPABASE_URL: 'https://nkmxpxhxyqwleubukfvs.supabase.co',
    SUPABASE_KEY: 'sb_publishable_prueba_sin_acceso',
  }).listen(0, '127.0.0.1');
  let browser;
  try {
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const opciones = process.platform === 'win32' ? { channel: 'msedge' } : {};
    browser = await chromium.launch({ ...opciones, headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
    const errores = [];
    page.on('pageerror', error => errores.push(error.message));
    await page.goto(base);
    await page.getByText('Inicia sesión para ver tus productos.', { exact: true }).waitFor();
    assert.equal(await page.locator('#inventario').isVisible(), false);
    assert.equal(await page.locator('#listado').isVisible(), false);
    assert.equal(await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).isEnabled(), true);
    const carpeta = path.join(__dirname, '../entregas/dia-04/capturas');
    fs.mkdirSync(carpeta, { recursive: true });
    await page.screenshot({ path: path.join(carpeta, 'acceso-escritorio.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(carpeta, 'acceso-movil.png'), fullPage: true });

    // Comprueba también el mensaje de configuración incompleta, sin red remota.
    await page.route('**/config.js', route => route.fulfill({
      contentType: 'application/javascript', body: 'window.SUPABASE_CONFIG = null;',
    }));
    await page.reload();
    await page.getByText(/Falta configurar Supabase/).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).isEnabled(), false);
    assert.deepEqual(errores, []);
    console.log('UI: acceso, vista móvil sin desbordamiento, secciones privadas ocultas y configuración incompleta: OK.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
