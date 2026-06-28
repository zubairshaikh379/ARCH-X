import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "motion/react";
import { ArchXLogo } from "../components/ArchXLogo";
import {
  signIn, signUp, sendPasswordReset,
  needsMfaChallenge, verifyMfaLogin, getSession,
  isUsernameAvailable,
} from "../lib/auth";
import { Eye, EyeOff, Loader, ArrowLeft, ShieldCheck, MailCheck } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
  onBack: () => void;
}

type AuthMode = "login" | "register" | "forgot";

function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  return "Something went wrong. Please try again.";
}

export default function AuthPage({ onAuthSuccess, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [email, setEmail] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // MFA step-up flow
  const [mfaStage, setMfaStage] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  const reset = () => { setError(""); setInfo(""); setLoading(false); };

  const switchMode = (m: AuthMode) => {
    setMode(m); reset();
    setPassword(""); setConfirmPw("");
  };

  /* ── Login ─────────────────────────────────────────────── */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }

    setLoading(true);
    try {
      const { user } = await signIn(email.trim(), password);
      if (!user) { setError("Sign-in failed. Please try again."); return; }

      if (await needsMfaChallenge()) {
        setPendingUser(user);
        setMfaStage(true);
      } else {
        onAuthSuccess(user);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── Register ──────────────────────────────────────────── */
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    const u = username.trim();
    if (!u || !password || !email.trim()) { setError("Fill in all fields."); return; }
    if (u.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(u)) { setError("Username: letters, numbers, _ and - only."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }

    setLoading(true);
    try {
      if (!(await isUsernameAvailable(u))) {
        setError("That username is already taken.");
        return;
      }
      const { user, needsEmailConfirmation } = await signUp(email.trim(), password, u);
      if (needsEmailConfirmation) {
        setInfo("Account created. Check your inbox to confirm your email, then sign in.");
        setMode("login");
        setPassword(""); setConfirmPw("");
      } else if (user) {
        onAuthSuccess(user);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── Forgot password ───────────────────────────────────── */
  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email address."); return; }
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setInfo("If that email has an account, a password-reset link is on its way.");
      setMode("login");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── MFA verification (login step-up) ──────────────────── */
  const handleVerifyMfa = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyMfaLogin(mfaCode.trim());
      const session = await getSession();
      const user = session?.user ?? pendingUser;
      if (user) onAuthSuccess(user);
      else setError("Verification succeeded but no session was found. Try signing in again.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── MFA Stage UI ──────────────────────────────────────── */
  if (mfaStage) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem", background: "var(--bg)",
      }}>
        <div className="bg-mesh" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass content-layer"
          style={{ width: "100%", maxWidth: "400px", padding: "2.5rem" }}
        >
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.125rem",
            }}>
              <ShieldCheck size={24} style={{ color: "var(--accent)" }} />
            </div>
            <div className="heading-lg" style={{ marginBottom: "0.5rem" }}>2-Step Verification</div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.55 }}>
              Enter the 6-digit code from your authenticator app.
            </div>
          </div>

          <form onSubmit={handleVerifyMfa}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="mfa-input" style={{ fontSize: "0.8125rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" }}>
                Verification Code
              </label>
              <input
                id="mfa-input"
                className="input-field"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                style={{ fontFamily: "var(--font-mono)", fontSize: "1.375rem", letterSpacing: "0.2em", textAlign: "center" }}
                autoFocus
              />
              {error && (
                <div style={{ fontSize: "0.8rem", color: "#f87171", marginTop: "0.375rem" }}>{error}</div>
              )}
            </div>
            <button type="submit" className="btn btn-accent" style={{ width: "100%" }} disabled={loading || mfaCode.length < 6}>
              {loading ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Verify & Continue"}
            </button>
          </form>

          <button
            onClick={() => { setMfaStage(false); setMfaCode(""); setError(""); setPendingUser(null); }}
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: "0.75rem", justifyContent: "center" }}
          >
            ← Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── Main Auth UI ──────────────────────────────────────── */
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "1rem", background: "var(--bg)",
    }}>
      <div className="bg-mesh" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="content-layer"
        style={{ width: "100%", maxWidth: "420px" }}
      >
        {/* Back */}
        <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ marginBottom: "1.5rem" }}>
          <ArrowLeft size={14} /> Back to home
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "2rem" }}>
          <ArchXLogo size={28} className="text-[color:var(--accent)]" />
          <span style={{ fontWeight: 800, fontSize: "1.0625rem", letterSpacing: "-0.02em" }}>ARCH-X</span>
        </div>

        <div className="glass" style={{ padding: "2rem" }}>
          {/* Mode toggle (login / register) */}
          {mode !== "forgot" && (
            <div style={{
              display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "8px",
              padding: "3px", marginBottom: "1.75rem",
            }}>
              {(["login", "register"] as AuthMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1, padding: "0.5rem", borderRadius: "6px", border: "none",
                    background: mode === m ? "rgba(34,211,238,0.15)" : "transparent",
                    color: mode === m ? "var(--accent)" : "var(--text-3)",
                    fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                    fontFamily: "var(--font-sans)", transition: "all 0.18s",
                  }}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {/* Info banner (email confirmation / reset sent) */}
          {info && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "0.5rem",
              padding: "0.75rem 0.875rem", marginBottom: "1.25rem",
              background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)",
              borderRadius: "var(--radius-sm)", fontSize: "0.8125rem", color: "var(--accent)",
            }}>
              <MailCheck size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{info}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === "register" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "register" ? -20 : 20 }}
              transition={{ duration: 0.22 }}
              onSubmit={mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleForgot}
              style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
            >
              {mode === "forgot" && (
                <div style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.5 }}>
                  Enter your account email and we'll send a reset link.
                </div>
              )}

              {/* Username (register only) */}
              {mode === "register" && (
                <div>
                  <label htmlFor="auth-username" style={{ fontSize: "0.8125rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" }}>
                    Username
                  </label>
                  <input
                    id="auth-username"
                    className="input-field"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="operator_handle"
                  />
                </div>
              )}

              {/* Email (all modes) */}
              <div>
                <label htmlFor="auth-email" style={{ fontSize: "0.8125rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" }}>
                  Email
                </label>
                <input
                  id="auth-email"
                  className="input-field"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {/* Password (login + register) */}
              {mode !== "forgot" && (
                <div>
                  <label htmlFor="auth-password" style={{ fontSize: "0.8125rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" }}>
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="auth-password"
                      className="input-field"
                      type={showPw ? "text" : "password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === "register" ? "Min. 8 characters" : "••••••••"}
                      style={{ paddingRight: "2.5rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      style={{
                        position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer", color: "var(--text-3)",
                        display: "flex", alignItems: "center",
                      }}
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm password (register only) */}
              {mode === "register" && (
                <div>
                  <label htmlFor="auth-confirm" style={{ fontSize: "0.8125rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" }}>
                    Confirm Password
                  </label>
                  <input
                    id="auth-confirm"
                    className="input-field"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
              )}

              {/* Forgot password link */}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  style={{
                    alignSelf: "flex-end", background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-3)", fontSize: "0.75rem", fontFamily: "var(--font-sans)",
                    padding: 0, marginTop: "-0.25rem",
                  }}
                >
                  Forgot password?
                </button>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  padding: "0.625rem 0.875rem",
                  background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: "var(--radius-sm)", fontSize: "0.8125rem", color: "#f87171",
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-accent"
                style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}
                disabled={loading}
              >
                {loading
                  ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
                  : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Send Reset Link"
                }
              </button>

              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: "center" }}
                >
                  ← Back to sign in
                </button>
              )}
            </motion.form>
          </AnimatePresence>

          {/* Security note */}
          <div style={{
            marginTop: "1.25rem", paddingTop: "1.25rem",
            borderTop: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <ShieldCheck size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-3)", lineHeight: 1.4 }}>
              Secured by Supabase Auth — encrypted credentials, email verification, and optional 2FA.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
