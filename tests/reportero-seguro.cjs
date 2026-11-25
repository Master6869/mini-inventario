const fs = require('node:fs');
const path = require('node:path');

function ocultar(texto) {
  let value = String(texto || '').replace(/\u001b\[[0-9;]*m/g, '');
  for (const key of ['TEST_EMAIL', 'TEST_PASSWORD']) {
    if (process.env[key]) value = value.split(process.env[key]).join('[OCULTO]');
  }
  return value.replace(/(?:access_token|refresh_token)\s*[:=]\s*[^\s,}]+/gi, '[TOKEN OCULTO]');
}

class ReporteroSeguro {
  constructor() { this.casos = []; }
  onBegin(_config, suite) { console.log(`Playwright: ${suite.allTests().length} pruebas reales, credenciales ocultas.`); }
  onTestEnd(test, result) {
    const caso = {
      prueba: test.title, estado: result.status, duracionMs: result.duration,
      errores: result.errors.map(error => ocultar(error.message)),
    };
    this.casos.push(caso);
    console.log(`${result.status.toUpperCase()}: ${test.title}`);
    for (const error of caso.errores) console.log(error);
  }
  onError(error) { console.error(ocultar(error.message)); }
  onEnd(result) {
    const salida = path.resolve(process.env.E2E_REPORT_FILE || 'test-results/resumen-seguro.json');
    fs.mkdirSync(path.dirname(salida), { recursive: true });
    fs.writeFileSync(salida, JSON.stringify({ estado: result.status, casos: this.casos }, null, 2));
    console.log(`Resultado: ${result.status}. Informe sin credenciales guardado.`);
  }
}
module.exports = ReporteroSeguro;
