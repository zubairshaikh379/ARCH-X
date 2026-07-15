import { useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArchXLogo } from "../components/ArchXLogo";
import {
  signInFlexible, signUpUser, verifyTotpChallenge, resendConfirmation, sendPasswordReset,
} from "../lib/auth";
import { Eye, EyeOff, Loader, ArrowLeft, ShieldCheck, MailCheck, KeyRound } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: (username: string) => void;
  onBack: () => void;
  initialMode?: AuthMode;
}

type AuthMode = "login" | "register";

export default function AuthPage({ onAuthSuccess, onBack, initialMode = "login" }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Shared fields
  const [identifier, setIdentifier] = useState("");   // login: email/username/phone
  const [username, setUsername] = useState("");        // register
  const [email, setEmail] = useState("");              // register
  const [phone, setPhone] = useState("");              // register (optional)
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // TOTP challenge stage
  const [totpStage, setTotpStage] = useState(false);
  const [totpFactorId, setTotpFactorId] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState("");

  // Email-confirmation stage
  const [confirmStage, setConfirmStage] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");

  // Forgot-password stage
  const [forgotStage, setForgotStage] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const reset = () => { setError(""); setLoading(false); };

  const switchMode = (m: AuthMode) => {
    setMode(m); reset();
    setIdentifier(""); setUsername(""); setEmail(""); setPhone("");
    setPassword(""); setConfirmPw("");
  };

  /* ── Login ─────────────────────────────────────────────── */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    if (!identifier.trim() || !password) { setError("Fill in all fields."); return; }

    setLoading(true);
    try {
      const res = await signInFlexible(identifier, password);
      if (!res.ok) { setError(res.error || "Sign in failed."); return; }
      if (res.mfaRequired && res.factorId) {
        setTotpFactorId(res.factorId);
        setTotpStage(true);
        return;
      }
      if (res.username) onAuthSuccess(res.username);
      else setError("Signed in, but your profile is missing a username. Contact support.");
    } catch {
      setError("Authentication error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Register ──────────────────────────────────────────── */
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    const u = username.trim();
    if (!u || !password || !email.trim()) { setError("Username, email, and password are required."); return; }
    if (u.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(u)) { setError("Username: letters, numbers, _ and - only."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (phone.trim() && !/^[+\d][\d\s-]{5,}$/.test(phone.trim())) { setError("Enter a valid phone number, or leave it blank."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res = await signUpUser({ username: u, email, phone, password });
      if (!res.ok) { setError(res.error || "Registration failed."); return; }
      if (res.needsConfirm) {
        setConfirmEmail(email.trim());
        setConfirmStage(true);
      } else {
        onAuthSuccess(u);   // confirmation disabled → session already active
      }
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── TOTP challenge ────────────────────────────────────── */
  const handleVerifyTotp = async (e: FormEvent) => {
    e.preventDefault();
    setTotpError("");
    if (totpCode.trim().length !== 6) { setTotpError("Enter the 6-digit code."); return; }
    setLoading(true);
    const res = await verifyTotpChallenge(totpFactorId, totpCode);
    setLoading(false);
    if (res.ok && res.username) onAuthSuccess(res.username);
    else setTotpError(res.error || "Verification failed.");
  };

  const handleResend = async () => {
    setResendMsg("Sending…");
    const res = await resendConfirmation(confirmEmail);
    setResendMsg(res.ok ? "Confirmation email re-sent." : (res.error || "Could not resend."));
  };

  const handleSendReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetMsg("");
    if (!resetEmail.includes("@")) { setResetMsg("Enter the email on your account."); return; }
    setLoading(true);
    const res = await sendPasswordReset(resetEmail);
    setLoading(false);
    if (res.ok) { setResetSent(true); setResetMsg(""); }
    else setResetMsg(res.error || "Could not send reset email.");
  };

  const shell = (children: React.ReactNode, maxWidth = "400px") => (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem", background: "var(--bg)",
    }}>
      <div className="bg-mesh" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass content-layer"
        style={{ width: "100%", maxWidth, padding: "2.5rem" }}
      >
        {children}
      </motion.div>
    </div>
  );

  /* ── Forgot-password Stage UI ──────────────────────────── */
  if (forgotStage) {
    return shell(
      <>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <IconBubble><KeyRound size={24} style={{ color: "var(--accent)" }} /></IconBubble>
          <div className="heading-lg" style={{ marginBottom: "0.5rem" }}>Reset your password</div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.55 }}>
            {resetSent
              ? <>If an account exists for <b style={{ color: "var(--text-1)" }}>{resetEmail}</b>, a reset link is on its way. Open it to set a new password.</>
              : "Enter your account email and we'll send a reset link."}
          </div>
        </div>
        {!resetSent && (
          <form onSubmit={handleSendReset}>
            <input
              className="input-field" type="email" autoComplete="email"
              value={resetEmail} onChange={e => setResetEmail(e.target.value)}
              placeholder="you@example.com" autoFocus style={{ marginBottom: "0.75rem" }}
            />
            {resetMsg && <ErrText>{resetMsg}</ErrText>}
            <button type="submit" className="btn btn-accent" style={{ width: "100%", marginTop: "0.5rem" }} disabled={loading}>
              {loading ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Sending…</> : "Send reset link"}
            </button>
          </form>
        )}
        <button
          onClick={() => { setForgotStage(false); setResetSent(false); setResetEmail(""); setResetMsg(""); }}
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: "0.75rem", justifyContent: "center" }}
        >
          ← Back to sign in
        </button>
      </>
    );
  }

  /* ── TOTP Stage UI ─────────────────────────────────────── */
  if (totpStage) {
    return shell(
      <>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <IconBubble><ShieldCheck size={24} style={{ color: "var(--accent)" }} /></IconBubble>
          <div className="heading-lg" style={{ marginBottom: "0.5rem" }}>Two-Factor Verification</div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.55 }}>
            Open your authenticator app and enter the current 6-digit code.
          </div>
        </div>
        <form onSubmit={handleVerifyTotp}>
          <input
            className="input-field"
            type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
            value={totpCode}
            onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            style={{ fontFamily: "var(--font-mono)", fontSize: "1.375rem", letterSpacing: "0.2em", textAlign: "center", marginBottom: "0.75rem" }}
            autoFocus
          />
          {totpError && <ErrText>{totpError}</ErrText>}
          <button type="submit" className="btn btn-accent" style={{ width: "100%", marginTop: "0.75rem" }} disabled={loading}>
            {loading ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Verifying…</> : "Verify & Continue"}
          </button>
        </form>
        <button
          onClick={() => { setTotpStage(false); setTotpCode(""); setTotpError(""); }}
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: "0.75rem", justifyContent: "center" }}
        >
          ← Back to sign in
        </button>
      </>
    );
  }

  /* ── Email-confirmation Stage UI ───────────────────────── */
  if (confirmStage) {
    return shell(
      <>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <IconBubble><MailCheck size={24} style={{ color: "var(--accent)" }} /></IconBubble>
          <div className="heading-lg" style={{ marginBottom: "0.5rem" }}>Check your inbox</div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.55 }}>
            We sent a confirmation link to <b style={{ color: "var(--text-1)" }}>{confirmEmail}</b>.
            Click it, then come back and sign in.
          </div>
        </div>
        <button onClick={handleResend} className="btn btn-accent" style={{ width: "100%", justifyContent: "center" }}>
          Resend confirmation email
        </button>
        {resendMsg && <div style={{ fontSize: "0.8rem", color: "var(--text-3)", textAlign: "center", marginTop: "0.625rem" }}>{resendMsg}</div>}
        <button
          onClick={() => { setConfirmStage(false); switchMode("login"); }}
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: "0.75rem", justifyContent: "center" }}
        >
          ← Back to sign in
        </button>
      </>
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
        <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ marginBottom: "1.5rem" }}>
          <ArrowLeft size={14} /> Back to home
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "2rem" }}>
          <ArchXLogo size={28} className="text-[color:var(--accent)]" />
          <span style={{ fontWeight: 800, fontSize: "1.0625rem", letterSpacing: "-0.02em" }}>ARCH-X</span>
        </div>

        <div className="glass" style={{ padding: "2rem" }}>
          {/* Mode toggle */}
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
                  background: mode === m ? "rgba(200,204,210,0.15)" : "transparent",
                  color: mode === m ? "var(--accent)" : "var(--text-3)",
                  fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                  fontFamily: "var(--font-sans)", transition: "all 0.18s",
                }}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === "register" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "register" ? -20 : 20 }}
              transition={{ duration: 0.22 }}
              onSubmit={mode === "login" ? handleLogin : handleRegister}
              style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
            >
              {mode === "login" ? (
                /* Flexible identifier */
                <Field label="Email, username, or phone" id="auth-identifier">
                  <input
                    id="auth-identifier" className="input-field" type="text"
                    autoComplete="username"
                    value={identifier} onChange={e => setIdentifier(e.target.value)}
                    placeholder="you@example.com · operator_handle · +1…"
                  />
                </Field>
              ) : (
                <>
                  <Field label="Username" id="auth-username">
                    <input
                      id="auth-username" className="input-field" type="text" autoComplete="username"
                      value={username} onChange={e => setUsername(e.target.value)}
                      placeholder="operator_handle"
                    />
                  </Field>
                  <Field label="Email" id="auth-email">
                    <input
                      id="auth-email" className="input-field" type="email" autoComplete="email"
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Phone (optional — alternate login)" id="auth-phone">
                    <input
                      id="auth-phone" className="input-field" type="tel" autoComplete="tel"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+1 555 012 3456"
                    />
                  </Field>
                </>
              )}

              {/* Password */}
              <Field label="Password" id="auth-password">
                <div style={{ position: "relative" }}>
                  <input
                    id="auth-password" className="input-field"
                    type={showPw ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"}
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button" onClick={() => setShowPw(v => !v)}
                    style={{
                      position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "var(--text-3)",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>

              {mode === "register" && (
                <Field label="Confirm Password" id="auth-confirm">
                  <input
                    id="auth-confirm" className="input-field"
                    type={showPw ? "text" : "password"} autoComplete="new-password"
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Re-enter password"
                  />
                </Field>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setForgotStage(true); setResetEmail(identifier.includes("@") ? identifier : ""); }}
                  style={{
                    alignSelf: "flex-end", background: "none", border: "none", cursor: "pointer",
                    color: "var(--accent)", fontSize: "0.78rem", padding: 0, marginTop: "-0.25rem",
                  }}
                >
                  Forgot password?
                </button>
              )}

              {error && <ErrBox>{error}</ErrBox>}

              <button
                type="submit" className="btn btn-accent"
                style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}
                disabled={loading}
              >
                {loading
                  ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
                  : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Security note */}
          <div style={{
            marginTop: "1.25rem", paddingTop: "1.25rem",
            borderTop: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <KeyRound size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-3)", lineHeight: 1.4 }}>
              Secured by Supabase Auth. Confirm your email, then enable authenticator 2FA from your profile.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Small presentational helpers ──────────────────────────── */
function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} style={{ fontSize: "0.8125rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: "0.625rem 0.875rem",
      background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
      borderRadius: "var(--radius-sm)", fontSize: "0.8125rem", color: "#f87171",
    }}>{children}</div>
  );
}

function ErrText({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "0.8rem", color: "#f87171", marginTop: "0.375rem" }}>{children}</div>;
}

function IconBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: "52px", height: "52px", borderRadius: "50%",
      background: "var(--accent-dim)", border: "1px solid rgba(200,204,210,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 1.125rem",
    }}>{children}</div>
  );
}
