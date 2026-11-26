const fs = require('node:fs');
const path = require('node:path');

function ocultar(texto) {
  let value = String(texto || '').replace(/\u001b\[[0-9;]*m/g, '');
  for (const key of ['TEST_EMAIL', 'TEST_PASSWORD', 'SUPABASE_KEY']) {
    if (process.env[key]) value = value.split(process.env[key]).join('[OCULTO]');
  }
  return value.replace(/(?:access_token|refresh_token)\s*[:=]\s*[^\s,}]+/gi, '[TOKEN OCULTO]');
}

function html(texto) {
  return String(texto).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

class ReporteroSeguro {
  constructor() { this.casos = []; this.erroresGlobales = []; }
  onBegin(_config, suite) { console.log(`Playwright: ${suite.allTests().length} pruebas reales, credenciales ocultas.`); }
  onTestEnd(test, result) {
    const caso = {
      prueba: test.title, estado: result.status, duracionMs: result.duration,
      errores: result.errors.map(error => ocultar(error.message)),
      capturas: [],
    };
    const carpeta = path.resolve('playwright-report');
    fs.mkdirSync(carpeta, { recursive: true });
    for (const adjunto of result.attachments) {
      if (adjunto.name === 'captura-sin-credenciales' && adjunto.contentType === 'image/png' && adjunto.path) {
        const nombre = `fallo-${this.casos.length + 1}.png`;
        fs.copyFileSync(adjunto.path, path.join(carpeta, nombre));
        caso.capturas.push(nombre);
      }
    }
    this.casos.push(caso);
    console.log(`${result.status.toUpperCase()}: ${test.title}`);
    for (const error of caso.errores) console.log(error);
  }
  onError(error) {
    const mensaje = ocultar(error.message);
    this.erroresGlobales.push(mensaje);
    console.error(mensaje);
  }
  onEnd(result) {
    const salida = path.resolve(process.env.E2E_REPORT_FILE || 'test-results/resumen-seguro.json');
    fs.mkdirSync(path.dirname(salida), { recursive: true });
    const resumen = { estado: result.status, casos: this.casos, erroresGlobales: this.erroresGlobales };
    fs.writeFileSync(salida, JSON.stringify(resumen, null, 2));
    const carpeta = path.resolve('playwright-report');
    fs.mkdirSync(carpeta, { recursive: true });
    fs.writeFileSync(path.join(carpeta, 'resumen-seguro.json'), JSON.stringify(resumen, null, 2));
    const casos = this.casos.map(caso => `<section><h2>${html(caso.prueba)}</h2><p><strong>${html(caso.estado)}</strong> · ${caso.duracionMs} ms</p>${caso.errores.map(error => `<pre>${html(error)}</pre>`).join('')}${caso.capturas.map(nombre => `<p><a href="${html(nombre)}">Captura con credenciales ocultas</a></p>`).join('')}</section>`).join('');
    fs.writeFileSync(path.join(carpeta, 'index.html'), `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reporte de Playwright</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:960px;margin:40px auto;padding:0 20px;color:#182a3d}h1{font-size:28px}h2{font-size:20px}section{border-top:1px solid #ccd6df;margin-top:24px;padding-top:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}a{color:#155e59}</style><h1>Reporte de Playwright</h1><p>Resultado: <strong>${html(result.status)}</strong> · ${this.casos.length} pruebas</p><p>Reporte generado por Playwright con credenciales ocultas y sin trazas de autenticación.</p>${this.erroresGlobales.map(error => `<pre>${html(error)}</pre>`).join('')}${casos}</html>`);
    console.log(`Resultado: ${result.status}. Informe sin credenciales guardado.`);
  }
}
module.exports = ReporteroSeguro;
