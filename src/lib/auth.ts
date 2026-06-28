// Authentication backed by Supabase Auth.
//
// Identities, password hashing (bcrypt server-side), email verification, password
// reset and TOTP MFA are all handled by Supabase — the browser never stores raw
// passwords or a forgeable "session = username" string. The JWT lives in
// localStorage under Supabase's own key and is refreshed automatically.

import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";

export interface SignUpResult {
  user: User | null;
  session: Session | null;
  needsEmailConfirmation: boolean;
}

/** Display username, sourced from signup metadata (falls back to the email handle). */
export function usernameFromUser(user: User | null | undefined): string {
  if (!user) return "";
  const meta = user.user_metadata as { username?: string } | undefined;
  return meta?.username || user.email?.split("@")[0] || "operator";
}

/** Best-effort availability check. The DB unique constraint is the real guard. */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .ilike("username", username)
    .limit(1);
  if (error) return true;
  return !data || data.length === 0;
}

export async function signUp(email: string, password: string, username: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) throw error;
  // No session means the project requires email confirmation before first login.
  return { user: data.user, session: data.session, needsEmailConfirmation: !data.session };
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; session: Session | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

// ─── MFA / TOTP ────────────────────────────────────────────────────────────────

export interface MfaEnrollment {
  factorId: string;
  qrCode: string; // SVG data URL — render directly in an <img>
  secret: string; // manual-entry key
  uri: string;    // otpauth:// URI
}

export async function listMfaFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data.totp ?? [];
}

export async function isMfaEnabled(): Promise<boolean> {
  try {
    const factors = await listMfaFactors();
    return factors.some(f => f.status === "verified");
  } catch {
    return false;
  }
}

export async function enrollMfa(): Promise<MfaEnrollment> {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error) throw error;
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

export async function verifyMfaEnrollment(factorId: string, code: string): Promise<void> {
  const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
  if (chErr) throw chErr;
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (error) throw error;
}

export async function disableMfa(): Promise<void> {
  const factors = await listMfaFactors();
  for (const f of factors) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id });
    if (error) throw error;
  }
}

/** After a password login, does the session still need a TOTP step-up to reach aal2? */
export async function needsMfaChallenge(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return false;
  return data.nextLevel === "aal2" && data.currentLevel !== data.nextLevel;
}

export async function verifyMfaLogin(code: string): Promise<void> {
  const factors = await listMfaFactors();
  const verified = factors.find(f => f.status === "verified");
  if (!verified) throw new Error("No verified authenticator found for this account.");
  const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: verified.id });
  if (chErr) throw chErr;
  const { error } = await supabase.auth.mfa.verify({ factorId: verified.id, challengeId: challenge.id, code });
  if (error) throw error;
}

// ─── Local profile cache (offline convenience only — keyed by auth user id) ─────

export const ProfileStore = {
  key: (id: string) => `archx_profile_${id}`,

  get(id: string): Record<string, unknown> | null {
    try {
      const raw = localStorage.getItem(ProfileStore.key(id));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  save(id: string, data: Record<string, unknown>) {
    if (!id) return;
    localStorage.setItem(ProfileStore.key(id), JSON.stringify(data));
  },

  clear(id: string) {
    localStorage.removeItem(ProfileStore.key(id));
  },
};
