import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.esm.js';

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_PUBLIC_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function getSafeSession() {
  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session ?? null;
  } catch (err) {
    console.error('[Supabase] offline, switching to Guest Mode →', err.message);
    return null;
  }
}