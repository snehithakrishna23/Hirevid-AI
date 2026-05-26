import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }
} else {
  console.warn(
    "Supabase credentials not found or set to placeholders in .env.\n" +
    "Please create c:\\hirevid\\.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n" +
    "Falling back to Local Storage database mocks."
  );
}

export const supabase = supabaseInstance;
