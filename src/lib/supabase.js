// Cliente Supabase do frontend (usa a anon key — segura para expor).
// Criado de forma lazy para não quebrar o build nem o import quando as
// envs VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não estão definidas
// (ex.: ambiente local sem .env.local). Nesse caso as chamadas falham
// em runtime e as páginas exibem estado de erro.
import { createClient } from '@supabase/supabase-js';

let client = null;

export function getSupabase() {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';
    client = createClient(url, anonKey);
  }
  return client;
}
