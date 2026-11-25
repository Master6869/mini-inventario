const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const vm = require('node:vm');
const { crearApp } = require('../server');

const envPublico = {
  SUPABASE_URL: 'https://nkmxpxhxyqwleubukfvs.supabase.co',
  SUPABASE_KEY: 'sb_publishable_prueba_sin_acceso',
  SECRETO_INTERNO: 'no-publicar-este-valor',
  TEST_EMAIL: 'cuenta-ficticia@ejemplo.test',
  TEST_PASSWORD: 'ContrasenaFicticiaParaTest123',
};

async function conServidor(env, verificar) {
  const server = crearApp(env).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await verificar(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('/config.js publica únicamente URL y llave pública, sin caché', async () => {
  await conServidor(envPublico, async base => {
    const response = await fetch(base + '/config.js');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(response.headers.get('content-type'), /application\/javascript/);
    const source = await response.text();
    assert.ok(!source.includes(envPublico.SECRETO_INTERNO));
    assert.ok(!source.includes(envPublico.TEST_EMAIL));
    assert.ok(!source.includes(envPublico.TEST_PASSWORD));
    const context = { window: {} };
    vm.runInNewContext(source, context);
    assert.deepEqual(JSON.parse(JSON.stringify(context.window.SUPABASE_CONFIG)), {
      url: envPublico.SUPABASE_URL, key: envPublico.SUPABASE_KEY,
    });
  });
});

test('/config.js rechaza llaves secretas y JWT service_role sin filtrarlos', async () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url') + '.firma';
  for (const key of ['sb_secret_valor_no_publico', jwt, 'invalida']) {
    await conServidor({ ...envPublico, SUPABASE_KEY: key }, async base => {
      const response = await fetch(base + '/config.js');
      assert.equal(response.status, 503);
      assert.equal(await response.text(), 'window.SUPABASE_CONFIG = null;');
    });
  }
});

test('/config.js admite la llave anon heredada y rechaza URL insegura', async () => {
  const key = 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url') + '.firma';
  await conServidor({ ...envPublico, SUPABASE_KEY: key }, async base => {
    assert.equal((await fetch(base + '/config.js')).status, 200);
  });
  await conServidor({ ...envPublico, SUPABASE_URL: 'http://ejemplo.com' }, async base => {
    assert.equal((await fetch(base + '/config.js')).status, 503);
  });
});

test('sin configurar, el sitio explica el acceso y no expone archivos internos', async () => {
  await conServidor({}, async base => {
    const html = await (await fetch(base)).text();
    assert.match(html, /Día 4/);
    assert.match(html, /Crear cuenta/);
    assert.equal((await fetch(base + '/config.js')).status, 503);
    for (const archivo of ['/.env', '/.git/config', '/server.js', '/package.json']) {
      assert.equal((await fetch(base + archivo)).status, 404, archivo);
    }
    assert.equal((await fetch(base + '/vendor/supabase.js')).status, 200);
    assert.deepEqual(await (await fetch(base + '/health')).json(), { status: 'ok' });
  });
});
