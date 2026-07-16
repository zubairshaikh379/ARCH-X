import { useState } from "react";
import { motion } from "framer-motion";
import { updatePassword } from "../lib/auth";
import { KeyRound, Loader, Check } from "lucide-react";

interface Props {
  onDone: () => void;
}

/** Shown when a Supabase password-reset link opens the app (PASSWORD_RECOVERY).
 *  The recovery session lets the user set a new password immediately. */
export default function PasswordRecoveryModal({ onDone }: Props) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { setErr("Passwords do not match."); return; }
    setBusy(true);
    const res = await updatePassword(pw);
    setBusy(false);
    if (res.ok) onDone();
    else setErr(res.error || "Could not set password.");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass"
        style={{ width: "100%", maxWidth: "400px", padding: "2.25rem" }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
          }}>
            <KeyRound size={22} style={{ color: "var(--accent)" }} />
          </div>
          <div className="heading-lg" style={{ marginBottom: "0.4rem" }}>Set a new password</div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
            Choose a new password for your account.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input
            className="input-field" type="password" autoComplete="new-password"
            placeholder="New password" value={pw} onChange={e => setPw(e.target.value)} autoFocus
          />
          <input
            className="input-field" type="password" autoComplete="new-password"
            placeholder="Confirm new password" value={pw2} onChange={e => setPw2(e.target.value)}
          />
          {err && <div style={{ fontSize: "0.8rem", color: "#f87171" }}>{err}</div>}
          <button className="btn btn-accent" style={{ width: "100%", justifyContent: "center" }} onClick={submit} disabled={busy}>
            {busy ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><Check size={14} /> Save password</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
