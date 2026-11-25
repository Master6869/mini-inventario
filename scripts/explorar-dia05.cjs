const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

const root = path.join(__dirname, '..');
process.chdir(root);
process.loadEnvFile(path.join(root, '.env'));
require('../server').configuracionPublica(process.env);
if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) throw new Error('Faltan TEST_EMAIL o TEST_PASSWORD.');
const fase = process.argv.includes('--antes') ? 'antes' : 'despues';
const entrega = path.join(root, 'entregas/dia-05');
const privado = path.join(root, '.npm-cache/dia05-private');
fs.mkdirSync(entrega, { recursive: true });
fs.mkdirSync(privado, { recursive: true });
const cli = process.env.PLAYWRIGHT_CLI_ENTRY ||
  path.join(process.env.APPDATA || '', 'npm/node_modules/@playwright/cli/playwright-cli.js');
if (!fs.existsSync(cli)) throw new Error('No se encuentra Playwright CLI. Instálalo o define PLAYWRIGHT_CLI_ENTRY.');
const nombre = 'E2E-EXP-' + randomUUID().replaceAll('-', '').slice(0, 12);
const baseURL = 'http://localhost:3005';

function ocultar(texto) {
  let value = String(texto || '').replace(/\u001b\[[0-9;]*m/g, '');
  for (const key of ['TEST_EMAIL', 'TEST_PASSWORD']) value = value.split(process.env[key]).join('[OCULTO]');
  return value;
}
function comando(args) {
  const result = spawnSync(process.execPath, [cli, '-s=dia05', ...args], {
    cwd: root, encoding: 'utf8', windowsHide: true, timeout: 45000,
  });
  const raw = String(result.stdout || '') + String(result.stderr || '');
  if (result.status !== 0 || raw.includes('### Error')) {
    fs.writeFileSync(path.join(privado, 'cli-diagnostico.txt'), ocultar(raw));
    throw new Error('Falló un comando de exploración. Revisa el diagnóstico privado con credenciales ocultas.');
  }
  return raw;
}
async function limpiar() {
  const api = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await api.auth.signInWithPassword({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
  if (error || !data.user) throw new Error('No se pudo autenticar la limpieza de la exploración.');
  try {
    const borrado = await api.from('productos').delete().eq('user_id', data.user.id).eq('nombre', nombre);
    if (borrado.error) throw new Error('No se pudo retirar el producto temporal.');
    const consulta = await api.from('productos').select('id').eq('user_id', data.user.id).eq('nombre', nombre);
    if (consulta.error || consulta.data.length) throw new Error('Quedan datos de esta exploración.');
    return 0;
  } finally { await api.auth.signOut({ scope: 'local' }); }
}

(async () => {
  // No reutilizar un servidor de otra rama por accidente.
  try { await fetch(baseURL + '/health'); throw new Error('El puerto 3005 ya está ocupado. Detén solo la copia de pruebas antes de explorar.'); }
  catch (error) { if (error.message.includes('ya está ocupado')) throw error; }
  const server = spawn(process.execPath, ['server.js'], {
    cwd: root, env: { ...process.env, PORT: '3005' }, stdio: 'ignore', windowsHide: true,
  });
  let informe;
  let creadoPosible = false;
  try {
    let listo = false;
    for (let intento = 0; intento < 50; intento++) {
      try { if ((await fetch(baseURL + '/health')).ok) { listo = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!listo) throw new Error('No inició la copia de pruebas.');
    comando(['open', baseURL, '--browser=msedge']);
    const acceso = spawnSync(process.execPath, ['scripts/cli-login-privado.cjs'], {
      cwd: root, stdio: 'pipe', windowsHide: true, timeout: 45000,
    });
    if (acceso.status !== 0) throw new Error('No se pudo completar el acceso de pruebas.');
    const codigo = `async page => {
      await page.locator('#producto-form [name=nombre]').fill(${JSON.stringify(nombre)});
      await page.locator('#producto-form [name=cantidad]').fill('1');
      await page.locator('#producto-form [name=minimo]').fill('5');
      await page.getByRole('button',{name:'Guardar producto',exact:true}).click();
      await page.getByText('Producto guardado.',{exact:true}).waitFor();
      const fila=page.locator('tbody tr').filter({hasText:${JSON.stringify(nombre)}});
      await fila.waitFor();
      if (!await fila.getByText('Bajo el mínimo',{exact:true}).isVisible()) throw new Error('No se marcó el stock bajo');
      await page.setViewportSize({width:1280,height:800});
      await fila.scrollIntoViewIfNeeded();
      await page.screenshot({path:'entregas/dia-05/escritorio-1280x800-${fase}.png',mask:[page.locator('#sesion')]});
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:'entregas/dia-05/movil-completa-${fase}.png',fullPage:true,mask:[page.locator('#sesion')]});
      await fila.scrollIntoViewIfNeeded();
      await page.screenshot({path:'entregas/dia-05/movil-390x844-${fase}.png',mask:[page.locator('#sesion')]});
      return await page.locator('.tabla').evaluate(c=>({anchoContenedor:c.clientWidth,anchoTabla:c.querySelector('table').scrollWidth,anchoDocumento:document.documentElement.scrollWidth,anchoVentana:innerWidth}));
    }`;
    const archivo = path.join(privado, 'capturar.js');
    fs.writeFileSync(archivo, codigo);
    creadoPosible = true;
    const resultado = comando(['run-code', '--filename=' + archivo]);
    const match = resultado.match(/### Result\r?\n([^\r\n]+)/);
    if (!match) throw new Error('No se recibió el resultado de la exploración.');
    const medidas = JSON.parse(match[1]);
    const consola = ocultar(comando(['console', 'error']));
    fs.writeFileSync(path.join(entrega, `consola-${fase}.txt`), consola);
    informe = { herramienta: 'playwright-cli', fase, viewportEscritorio: [1280,800], viewportMovil: [390,844], medidas, stockBajoVisible: true, correoOcultoEnCapturas: true };
  } finally {
    try {
      if (creadoPosible) {
        const residuos = await limpiar();
        if (informe) informe.productosResidualesDeExploracion = residuos;
      }
    } finally {
      try { comando(['close']); } catch {}
      server.kill();
    }
  }
  fs.writeFileSync(path.join(entrega, `exploracion-${fase}.json`), JSON.stringify(informe, null, 2));
  console.log('Exploración CLI terminada: capturas guardadas, correo oculto y producto temporal retirado.');
  console.log(JSON.stringify(informe.medidas));
})().catch(error => { console.error(ocultar(error.message)); process.exitCode = 1; });
