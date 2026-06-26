import { useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArchXLogo } from "../components/ArchXLogo";
import { hashPassword, verifyPassword, generateOtp, UserStore, Session } from "../lib/auth";
import { Eye, EyeOff, Loader, ArrowLeft, ShieldCheck, Mail } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: (username: string) => void;
  onBack: () => void;
}

type AuthMode = "login" | "register";

export default function AuthPage({ onAuthSuccess, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [email, setEmail] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP flow
  const [otpStage, setOtpStage] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [pendingUser, setPendingUser] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");

  const reset = () => {
    setError(""); setOtpError(""); setLoading(false);
  };

  const switchMode = (m: AuthMode) => {
    setMode(m); reset();
    setUsername(""); setPassword(""); setConfirmPw(""); setEmail("");
  };

  /* ── Login ─────────────────────────────────────────────── */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    if (!username.trim() || !password) { setError("Fill in all fields."); return; }

    setLoading(true);
    try {
      const stored = UserStore.find(username.trim());
      if (!stored) { setError("No account found with that username."); return; }

      const valid = await verifyPassword(password, stored.passwordHash);
      if (!valid) { setError("Incorrect password."); return; }

      if (stored.mfaEnabled) {
        const otp = generateOtp();
        setGeneratedOtp(otp);
        setPendingUser(stored.username);
        setOtpStage(true);
      } else {
        Session.set(stored.username);
        onAuthSuccess(stored.username);
      }
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
    if (!u || !password || !email) { setError("Fill in all fields."); return; }
    if (u.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(u)) { setError("Username: letters, numbers, _ and - only."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (UserStore.find(u)) { setError("That username is already taken."); return; }

    setLoading(true);
    try {
      const hash = await hashPassword(password);
      UserStore.add({ username: u, passwordHash: hash, email, mfaEnabled: false, createdAt: Date.now() });
      Session.set(u);
      onAuthSuccess(u);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── OTP Verification ──────────────────────────────────── */
  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();
    setOtpError("");
    if (otpInput.trim() === generatedOtp) {
      Session.set(pendingUser);
      onAuthSuccess(pendingUser);
    } else {
      setOtpError("Incorrect code — check the box above.");
    }
  };

  /* ── OTP Stage UI ──────────────────────────────────────── */
  if (otpStage) {
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
              Enter the 6-digit code to continue.
            </div>
          </div>

          {/* Demo-mode OTP display — transparent about demo nature */}
          <div style={{
            background: "rgba(250,204,21,0.06)",
            border: "1px solid rgba(250,204,21,0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "1rem",
            marginBottom: "1.5rem",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              marginBottom: "0.625rem",
            }}>
              <Mail size={13} style={{ color: "#facc15" }} />
              <span style={{ fontSize: "0.75rem", color: "#facc15", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                DEMO MODE — NO EMAIL CONFIGURED
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-2)", marginBottom: "0.625rem" }}>
              In production this code would be emailed to you. Your code for this session:
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 700,
              letterSpacing: "0.2em", color: "#facc15", textAlign: "center",
              padding: "0.5rem", background: "rgba(250,204,21,0.08)", borderRadius: "6px",
            }}>
              {generatedOtp}
            </div>
          </div>

          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="otp-input" style={{ fontSize: "0.8125rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" }}>
                Verification Code
              </label>
              <input
                id="otp-input"
                className="input-field"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                style={{ fontFamily: "var(--font-mono)", fontSize: "1.375rem", letterSpacing: "0.2em", textAlign: "center" }}
                autoFocus
              />
              {otpError && (
                <div style={{ fontSize: "0.8rem", color: "#f87171", marginTop: "0.375rem" }}>{otpError}</div>
              )}
            </div>
            <button type="submit" className="btn btn-accent" style={{ width: "100%" }}>
              Verify & Continue
            </button>
          </form>

          <button
            onClick={() => { setOtpStage(false); setOtpInput(""); setOtpError(""); setGeneratedOtp(""); }}
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
                  background: mode === m ? "rgba(34,211,238,0.15)" : "transparent",
                  color: mode === m ? "var(--accent)" : "var(--text-3)",
                  fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                  fontFamily: "var(--font-sans)", transition: "all 0.18s",
                  borderColor: mode === m ? "rgba(34,211,238,0.2)" : "transparent",
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
              {/* Username */}
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

              {/* Email (register only) */}
              {mode === "register" && (
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
              )}

              {/* Password */}
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
                    placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"}
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
                  : mode === "login" ? "Sign In" : "Create Account"
                }
              </button>
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
              Passwords are SHA-256 hashed in your browser before storage. No plaintext is saved.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
