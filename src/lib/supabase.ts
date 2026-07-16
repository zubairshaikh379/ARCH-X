import { createClient } from "@supabase/supabase-js";

// Supabase Connection Configuration
// Credentials come only from environment variables (set via Replit's env var
// manager). The anon key is safe to expose client-side by design — it has no
// privileges beyond what RLS policies grant — but we no longer hardcode a
// fallback so a misconfigured environment fails loudly instead of silently
// pointing at a specific project.
const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabaseConfigured =
  SUPABASE_URL !== "https://placeholder.supabase.co" &&
  SUPABASE_ANON_KEY !== "placeholder-anon-key";

if (!supabaseConfigured) {
  console.warn(
    "[ARCH-X] Supabase env vars missing — create a .env file with " +
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. " +
    "Auth and data features are disabled until they are set."
  );
}

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
