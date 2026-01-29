
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://frhrkfnqxjkbjxlkvfya.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NFRgrMWdAlAahDtf5sTihQ_BphcjBfL';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
