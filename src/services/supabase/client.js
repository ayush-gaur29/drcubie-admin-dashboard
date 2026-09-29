import { createClient } from '@supabase/supabase-js';

// Centralized production fallback values from the existing Dr. Cubie project.
// Enables seamless deployment on Cloudflare without requiring manual environment variables.
const FALLBACK_SUPABASE_URL = 'https://nflcrjyxgwaedzmlbaqj.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_4lNidlzkIxzMlT8KjvhBaw_FPIqdQ0a';

/**
 * Resolves Supabase URL:
 * Checks Vite import.meta.env, process.env, and falls back to production default.
 */
export const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  FALLBACK_SUPABASE_URL;

/**
 * Resolves Supabase Publishable/Anon Key:
 * Checks Vite import.meta.env (ANON or PUBLISHABLE), process.env, and falls back to production default.
 */
export const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  FALLBACK_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Centralized Supabase client for Dr. Cubie Admin Dashboard.
 * Uses ONLY browser-safe publishable/anon credentials with Row Level Security.
 * NEVER use or store the service_role key here.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export default supabase;
