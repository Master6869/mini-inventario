const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const root = path.join(__dirname, '..');
process.loadEnvFile(path.join(root, '.env'));
require('../server').configuracionPublica(process.env);

(async () => {
  const api = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await api.auth.signInWithPassword({
    email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD,
  });
  if (error || !data.user) throw new Error('No se pudo comprobar la cuenta TEST.');
  try {
    const resultado = await api.from('productos').select('id', { count: 'exact', head: true })
      .eq('user_id', data.user.id).or('nombre.like.E2E-D5-%,nombre.like.E2E-EXP-%');
    if (resultado.error) throw new Error('No se pudo comprobar si quedan productos temporales.');
    const informe = { cuenta: 'TEST (oculta)', registrosTemporales: resultado.count, sinResiduos: resultado.count === 0 };
    const entrega = path.join(root, 'entregas/dia-05');
    fs.mkdirSync(entrega, { recursive: true });
    fs.writeFileSync(path.join(entrega, 'limpieza.json'), JSON.stringify(informe, null, 2));
    if (!informe.sinResiduos) throw new Error('Hay productos temporales pendientes. Este verificador no borra datos.');
    console.log('Verificación autenticada: 0 productos temporales; no se borraron datos durante esta comprobación.');
  } finally { await api.auth.signOut({ scope: 'local' }); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
