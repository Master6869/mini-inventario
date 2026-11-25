const express = require('express');
const path = require('node:path');

function configuracionPublica(env) {
  const url = new URL(env.SUPABASE_URL || '');
  if (url.protocol !== 'https:' || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SUPABASE_URL debe ser la URL HTTPS de tu proyecto.');
  }
  const key = env.SUPABASE_KEY || '';
  let publica = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (!publica && key.split('.').length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
      publica = payload.role === 'anon';
    } catch { /* Una llave mal formada no es una llave pública válida. */ }
  }
  if (!publica) throw new Error('SUPABASE_KEY debe ser publishable o anon.');
  return { url: url.origin, key };
}

function crearApp(env = process.env) {
  const app = express();
  app.disable('x-powered-by');
  app.get('/health', (_request, response) => response.json({ status: 'ok' }));
  app.get('/config.js', (_request, response) => {
    response.type('application/javascript').set({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    try {
      // Nunca se serializa process.env: solo se permiten estas dos variables.
      const json = JSON.stringify(configuracionPublica(env)).replace(/[<>&\u2028\u2029]/g,
        char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
      response.send(`window.SUPABASE_CONFIG = Object.freeze(${json});`);
    } catch {
      response.status(503).send('window.SUPABASE_CONFIG = null;');
    }
  });
  app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'deny' }));
  return app;
}

if (require.main === module) {
  try {
    process.loadEnvFile(path.join(__dirname, '.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const puerto = Number(process.env.PORT || 3000);
  crearApp().listen(puerto, '0.0.0.0', error => {
    if (error) {
      console.error(`No se pudo iniciar el servidor en el puerto ${puerto}: ${error.code}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Mini Inventario: http://localhost:${puerto}`);
  });
}

module.exports = { crearApp, configuracionPublica };
