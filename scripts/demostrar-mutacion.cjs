const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '..');
const archivo = path.join(root, 'public/app.js');
const original = fs.readFileSync(archivo);
const correcto = 'const bajo = producto.cantidad < producto.minimo;';
const incorrecto = 'const bajo = producto.cantidad <= producto.minimo;';
const contenido = original.toString('utf8');
if (contenido.split(correcto).length !== 2) throw new Error('La comparación esperada no aparece exactamente una vez. No se modificó el archivo.');
const cli = path.join(path.dirname(require.resolve('@playwright/test/package.json')), 'cli.js');
const entrega = path.join(root, 'entregas/dia-05');
fs.mkdirSync(entrega, { recursive: true });
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const leer = nombre => JSON.parse(fs.readFileSync(path.join(entrega, nombre), 'utf8'));

function ejecutar(nombre) {
  // Misma ejecución de Playwright Test que npx playwright test, sin abrir shell.
  return spawnSync(process.execPath, [cli, 'test'], {
    cwd: root, stdio: 'inherit', windowsHide: true,
    env: { ...process.env, E2E_REPORT_FILE: path.join(entrega, nombre) },
  });
}

let mutante;
try {
  fs.writeFileSync(archivo, contenido.replace(correcto, incorrecto));
  console.log('Comparación temporal: <=. Se espera que falle el caso de igualdad.');
  mutante = ejecutar('pruebas-mutacion.json');
} finally {
  fs.writeFileSync(archivo, original);
  console.log('Comparación original restaurada byte por byte.');
}
if (!mutante || mutante.status !== 1) throw new Error('La ejecución mutada no produjo el fallo de prueba esperado.');
const fallida = leer('pruebas-mutacion.json');
const errores = fallida.casos.filter(caso => caso.estado !== 'passed');
if (fallida.casos.length !== 4 || errores.length !== 1 ||
    errores[0].prueba !== 'marcar stock bajo y respetar el límite de igualdad' ||
    !errores[0].errores.some(error => error.includes('Stock suficiente'))) {
  throw new Error('Hubo fallos diferentes de la mutación prevista; revisa el informe seguro.');
}
const restauradoHash = hash(fs.readFileSync(archivo));
if (hash(original) !== restauradoHash) throw new Error('El archivo restaurado no coincide con el original.');
console.log('Fallo esperado confirmado. Ejecutando de nuevo las cuatro pruebas con <.');
const restaurada = ejecutar('pruebas-restauradas.json');
const resultado = leer('pruebas-restauradas.json');
if (restaurada.status !== 0 || resultado.casos.length !== 4 || resultado.casos.some(caso => caso.estado !== 'passed')) {
  throw new Error('El código restaurado no superó las cuatro pruebas.');
}
fs.writeFileSync(path.join(entrega, 'demostracion-mutacion.json'), JSON.stringify({
  cambioProvocado: '< por <=',
  resultadoMutado: '3 pruebas pasan y 1 falla en la igualdad',
  resultadoRestaurado: '4 pruebas pasan',
  hashOriginal: hash(original), hashRestaurado: restauradoHash,
  restauracionExacta: true,
}, null, 2));
console.log('Demostración completa: fallo real detectado, restauración exacta y cuatro pruebas aprobadas.');
