import { createClient } from "@supabase/supabase-js";

// Supabase Connection Configuration
// We use the credentials provided directly by the user. If the user wants to configure custom credentials,
// they can define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in their Vercel environment settings.
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://radhriwyqjchkbqooopw.supabase.co";
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhZGhyaXd5cWpjaGticW9vb3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTI1MzcsImV4cCI6MjA5NzY4ODUzN30.YR9Ys3hWyRv4DCwmv_uvY1GfDDwQU2qf_Yxv8dPbXZo";

// `persistSession` keeps the auth token in localStorage and refreshes it
// automatically; `detectSessionInUrl` handles email-confirmation / password-reset
// links that redirect back with tokens in the URL hash.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper to check if Supabase is properly configured and reachable.
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
    if (error) {
      console.warn("Supabase profiles table not reachable. Using local fallback. Details:", error.message);
      return false;
    }
    return true;
  } catch {
    console.warn("Supabase connection failed. Using local storage fallback.");
    return false;
  }
}

/**
 * DATABASE SCHEMA + ROW LEVEL SECURITY
 *
 * The schema, the signup trigger, the locked-down RLS policies and the public
 * leaderboard view now live in a versioned migration:
 *
 *     supabase/migrations/0001_auth_and_rls.sql
 *
 * Run that file once in the Supabase SQL Editor. Rows are keyed by the auth user
 * id (auth.uid()) and RLS only lets a user write their own data — anonymous
 * full-table read/write is no longer allowed.
 */
