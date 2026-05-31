import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance = null;

if (
  supabaseUrl && supabaseAnonKey &&
  supabaseUrl     !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession:   true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    console.log('Supabase client initialized.');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
} else {
  console.warn(
    'Supabase credentials not found in .env.\n' +
    'Falling back to Local Storage mock database.'
  );
}

export const supabase = supabaseInstance;
