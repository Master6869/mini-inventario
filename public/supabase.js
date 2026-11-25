import { createClient } from './vendor/supabase.js';

let cliente;
export function obtenerSupabase() {
  if (!cliente) {
    const config = window.SUPABASE_CONFIG;
    if (!config?.url || !config?.key) {
      throw new Error('Falta configurar Supabase. Completa SUPABASE_URL y SUPABASE_KEY en .env y reinicia el servidor.');
    }
    cliente = createClient(config.url, config.key);
  }
  return cliente;
}
