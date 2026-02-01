
import { createClient } from '@supabase/supabase-js';

// Nota: Estas credenciais parecem ser placeholders ou chaves expiradas.
// O sistema foi atualizado para usar LocalStorage como fallback automático caso o fetch falhe.
const SUPABASE_URL = 'https://frhrkfnqxjkbjxlkvfya.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NFRgrMWdAlAahDtf5sTihQ_BphcjBfL';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'rh-master' },
  },
});
