const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const [runId, estado] = process.argv.slice(2);
if (!/^\d+$/.test(runId || '') || !['verde-inicial', 'rojo', 'verde-final', 'bloqueo-cuenta'].includes(estado)) {
  throw new Error('Uso: node scripts/capturar-ci.cjs RUN_ID verde-inicial|rojo|verde-final|bloqueo-cuenta');
}
const url = `https://github.com/Master6869/mini-inventario/actions/runs/${runId}`;
(async () => {
  const browser = await chromium.launch({
    headless: true, channel: process.platform === 'win32' ? 'msedge' : undefined,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (!response?.ok()) throw new Error('No se pudo abrir la ejecución pública de GitHub.');
    await page.locator('main').waitFor();
    await page.waitForFunction(() => document.body.innerText.includes('CI Playwright'));
    const texto = await page.locator('main').innerText();
    if (/Sign in to view this page/i.test(texto)) throw new Error('La página requiere acceso; no se guardó una captura de estado.');
    const entrega = path.join(__dirname, '../entregas/dia-06');
    fs.mkdirSync(entrega, { recursive: true });
    await page.screenshot({ path: path.join(entrega, `ci-${estado}.png`), fullPage: true });
    console.log(`Captura real guardada: ci-${estado}.png`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
