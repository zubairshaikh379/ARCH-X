import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";

export interface TotpEnrollment {
  factorId: string;
  qrSvg: string;    // inline SVG QR code
  secret: string;   // manual-entry key
  uri: string;      // otpauth:// URI
}

export async function enrollTotp(): Promise<{ ok: boolean; data?: TotpEnrollment; error?: string }> {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) return { ok: false, error: error?.message || "Could not start 2FA setup." };
  return {
    ok: true,
    data: {
      factorId: data.id,
      qrSvg: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    },
  };
}

/** Verify the first code to activate a freshly enrolled TOTP factor. */
export async function activateTotp(factorId: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
  if (error) return { ok: false, error: "Incorrect code — check the 6 digits and try again." };
  return { ok: true };
}

export async function unenrollTotp(factorId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Verified TOTP factor id, or null if 2FA is off. */
export async function activeTotpFactorId(): Promise<string | null> {
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp?.find(f => f.status === "verified")?.id || null;
}

// ─── Session / email helpers ────────────────────────────────────────────────

export function usernameFromSession(session: Session | null): string | null {
  const u = session?.user?.user_metadata?.username;
  return typeof u === "string" ? u : null;
}

export async function currentUsername(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return usernameFromSession(data.session) || undefined;
}

export function isEmailConfirmed(user: User | null | undefined): boolean {
  return !!user?.email_confirmed_at;
}

export async function resendConfirmation(email: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Flexible sign-in / sign-up ─────────────────────────────────────────────

/** Sign in with email, username, or phone + password. Resolves non-email
 *  identifiers to an email via the `email_for_identifier` RPC first. */
export async function signInFlexible(
  identifier: string,
  password: string,
): Promise<{ ok: boolean; username?: string; mfaRequired?: boolean; factorId?: string; error?: string }> {
  const raw = identifier.trim();
  let email = raw;

  if (!raw.includes("@")) {
    const { data, error } = await supabase.rpc("email_for_identifier", { identifier: raw });
    if (error || !data) return { ok: false, error: "Incorrect email/username/phone or password." };
    email = data;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };

  // If a verified TOTP factor exists, the session is only "aal1" until challenged.
  // Fail closed: if we can't confirm the factor list, don't let the login through
  // without a challenge — that would silently bypass 2FA.
  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) {
    await supabase.auth.signOut();
    return { ok: false, error: "Could not verify your account's 2FA status. Please try again." };
  }
  const factorId = factorsData?.totp?.find(f => f.status === "verified")?.id || null;
  if (factorId) {
    const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError || aalData?.currentLevel !== "aal2") {
      return { ok: true, mfaRequired: true, factorId };
    }
  }

  const username = usernameFromSession(data.session);
  return { ok: true, username: username || undefined };
}

/** Complete a TOTP challenge after signInFlexible reported mfaRequired. */
export async function verifyTotpChallenge(
  factorId: string,
  code: string,
): Promise<{ ok: boolean; username?: string; error?: string }> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
  if (error) return { ok: false, error: "Incorrect code — check the 6 digits and try again." };
  const { data: sessionData } = await supabase.auth.getSession();
  const username = usernameFromSession(sessionData.session);
  return { ok: true, username: username || undefined };
}

/** Register a new account. Username/phone are stored in user_metadata. */
export async function signUpUser(params: {
  username: string; email: string; phone?: string; password: string;
}): Promise<{ ok: boolean; needsConfirm?: boolean; error?: string }> {
  const { username, email, phone, password } = params;
  const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { username: username.trim(), ...(phone?.trim() ? { phone: phone.trim() } : {}) },
      emailRedirectTo: redirectTo,
    },
  });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };

  const needsConfirm = !data.session;
  return { ok: true, needsConfirm };
}

// ─── Account management ─────────────────────────────────────────────────────

export async function getAuthUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Send a password-reset email. Redirects back to the app (Site URL) with a
 *  recovery token; App handles the PASSWORD_RECOVERY event to set a new one. */
export async function sendPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

/** Set a new password for the currently-authenticated (or recovery) session. */
export async function updatePassword(newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

/** Change the account email. Supabase emails a confirmation to the new address. */
export async function updateEmail(newEmail: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

function friendlyAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "Incorrect email/username or password.";
  if (/already registered|already exists/i.test(msg)) return "An account with that email already exists.";
  if (/rate limit/i.test(msg)) return "Too many attempts — wait a moment and try again.";
  return msg;
}

// ─── Profile Storage (local cache — unchanged, still used by App) ────────────

export const ProfileStore = {
  key: (username: string) => `archx_profile_${username.toLowerCase()}`,

  get(username: string): Record<string, unknown> | null {
    try {
      const raw = localStorage.getItem(ProfileStore.key(username));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  save(username: string, data: Record<string, unknown>) {
    localStorage.setItem(ProfileStore.key(username), JSON.stringify(data));
  },

  clear(username: string) {
    localStorage.removeItem(ProfileStore.key(username));
  },
};
