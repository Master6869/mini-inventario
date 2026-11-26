// La CLI puede imprimir el código ejecutado: nunca reenviar esa salida.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

process.loadEnvFile(path.join(__dirname, '../.env'));
if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
  console.error('Faltan TEST_EMAIL o TEST_PASSWORD en .env.');
  process.exit(1);
}
const cli = path.join(process.env.APPDATA, 'npm/node_modules/@playwright/cli/playwright-cli.js');
const privateDir = path.join(__dirname, '../.npm-cache/dia05-private');
fs.mkdirSync(privateDir, { recursive: true });
const script = path.join(privateDir, 'login-temporal.js');
const code = `async page => {
  await page.locator('#acceso-form [name=email]').fill(${JSON.stringify(process.env.TEST_EMAIL)});
  await page.locator('#acceso-form [name=password]').fill(${JSON.stringify(process.env.TEST_PASSWORD)});
  await page.getByRole('button', {name:'Iniciar sesión', exact:true}).click();
  await page.locator('#inventario').waitFor({state:'visible', timeout:30000});
  return 'Sesion de pruebas iniciada';
}`;
try {
  fs.writeFileSync(script, code, { mode: 0o600 });
  const result = spawnSync(process.execPath, [cli, '-s=dia05', 'run-code', '--filename=' + script], {
    encoding: 'utf8', windowsHide: true, timeout: 45000,
  });
  const output = String(result.stdout || '') + String(result.stderr || '');
  const failed = result.status !== 0 || /### Error/.test(output) || !output.includes('Sesion de pruebas iniciada');
  if (failed) {
    // Un informe diagnóstico privado puede leerse tras ocultar ambos valores.
    let safe = output;
    for (const value of [process.env.TEST_EMAIL, process.env.TEST_PASSWORD]) safe = safe.split(value).join('[OCULTO]');
    fs.writeFileSync(path.join(privateDir, 'login-diagnostico.txt'), safe);
    console.error('No se pudo completar el acceso. Diagnóstico guardado en caché privada y con credenciales ocultas.');
    process.exitCode = 1;
  } else {
    console.log('Inicio de sesión por Playwright CLI completado. Credenciales ocultas.');
  }
} finally {
  fs.unlinkSync(script);
}
