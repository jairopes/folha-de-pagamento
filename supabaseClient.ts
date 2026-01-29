
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://frhrkfnqxjkbjxlkvfya.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NFRgrMWdAlAahDtf5sTihQ_BphcjBfL';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase URL or Anon Key is missing. Check your configuration.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
