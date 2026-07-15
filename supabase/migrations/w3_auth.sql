-- ─────────────────────────────────────────────────────────────────────────────
-- ARCH-X  W3 — Real Auth (flexible-login resolver)
-- Companion to the ULTIMATE MIGRATION schema (profiles keyed by auth.users.id,
-- strict RLS). Run this AFTER that migration, in the Supabase SQL Editor.
--
-- Identifiers (email / username / phone) live natively in auth.users:
--   • email                          → auth.users.email
--   • username, phone (optional)     → auth.users.raw_user_meta_data JSON
-- profiles has NO email/phone columns, so the resolver reads auth.users directly.
-- SECURITY DEFINER lets it read the protected auth schema without exposing it.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.email_for_identifier(identifier text)
returns text
language sql
security definer
set search_path = public, auth
as $$
  select u.email
  from auth.users u
  where lower(u.email) = lower(identifier)
     or lower(u.raw_user_meta_data->>'username') = lower(identifier)
     or u.raw_user_meta_data->>'phone' = identifier
  limit 1;
$$;

grant execute on function public.email_for_identifier(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: phone uniqueness is NOT DB-enforced (phone lives only in user_metadata).
-- The resolver returns the first match. If strict phone uniqueness is needed
-- later, add a unique index via a trigger that mirrors phone into a table column.
--
-- REQUIRED DASHBOARD CONFIG (Supabase → Authentication):
--   • Providers → Email: ENABLE "Confirm email".
--   • URL Configuration → Site URL = deployed Vercel URL; add
--     http://localhost:3000 as an additional Redirect URL for dev.
--   • Multi-Factor Authentication: ENABLE "TOTP (Authenticator app)".
-- Phone auth stays DISABLED — phone is a login identifier only, no SMS/OTP.
-- ─────────────────────────────────────────────────────────────────────────────
