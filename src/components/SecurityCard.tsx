import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";
import {
  enrollTotp, activateTotp, unenrollTotp, activeTotpFactorId,
  isEmailConfirmed, resendConfirmation,
} from "../lib/auth";
import type { TotpEnrollment } from "../lib/auth";
import { ShieldCheck, MailCheck, MailWarning, Phone, X, Loader, Check } from "lucide-react";

interface SecurityCardProps {
  username: string;
  /** "card" = dismissible post-login nudge; "panel" = embedded (profile/settings). */
  variant?: "card" | "panel";
  onDismiss?: () => void;
}

interface SecState {
  email: string;
  emailConfirmed: boolean;
  phone: string;
  totpFactorId: string | null;
}

/** Returns whether the nudge is worth showing (unconfirmed email / no phone / no 2FA). */
export function useSecurityGaps(username: string): boolean {
  const [gaps, setGaps] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      const phone = (u?.user_metadata?.phone as string) || "";
      const factor = await activeTotpFactorId();
      if (alive) setGaps(!isEmailConfirmed(u) || !phone || !factor);
    })();
    return () => { alive = false; };
  }, [username]);
  return gaps;
}

export default function SecurityCard({ username, variant = "card", onDismiss }: SecurityCardProps) {
  const [state, setState] = useState<SecState | null>(null);
  const [msg, setMsg] = useState("");

  // phone
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  // 2FA enrollment
  const [enroll, setEnroll] = useState<TotpEnrollment | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpBusy, setTotpBusy] = useState(false);
  const [totpErr, setTotpErr] = useState("");

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    setState({
      email: u?.email || "",
      emailConfirmed: isEmailConfirmed(u),
      phone: (u?.user_metadata?.phone as string) || "",
      totpFactorId: await activeTotpFactorId(),
    });
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  /* ── Email ── */
  const doResend = async () => {
    if (!state) return;
    setMsg("Sending…");
    const res = await resendConfirmation(state.email);
    setMsg(res.ok ? "Confirmation email sent — check your inbox." : (res.error || "Could not resend."));
  };

  /* ── Phone ── */
  const savePhone = async () => {
    const p = phoneInput.trim();
    if (!/^[+\d][\d\s-]{5,}$/.test(p)) { setMsg("Enter a valid phone number."); return; }
    setSavingPhone(true); setMsg("");
    const { error } = await supabase.auth.updateUser({ data: { phone: p } });
    if (!error) {
      const { error: pErr } = await supabase.from("profiles").update({ phone: p }).eq("username", username);
      if (pErr && /duplicate|unique/i.test(pErr.message)) setMsg("That phone number is already registered.");
      else { setMsg("Phone added."); setPhoneInput(""); await refresh(); }
    } else {
      setMsg(error.message);
    }
    setSavingPhone(false);
  };

  /* ── 2FA ── */
  const startEnroll = async () => {
    setTotpErr(""); setTotpBusy(true);
    const res = await enrollTotp();
    setTotpBusy(false);
    if (res.ok && res.data) setEnroll(res.data);
    else setTotpErr(res.error || "Could not start 2FA setup.");
  };

  const finishEnroll = async () => {
    if (!enroll) return;
    setTotpErr(""); setTotpBusy(true);
    const res = await activateTotp(enroll.factorId, totpCode);
    setTotpBusy(false);
    if (res.ok) { setEnroll(null); setTotpCode(""); setMsg("Two-factor authentication enabled."); await refresh(); }
    else setTotpErr(res.error || "Verification failed.");
  };

  const disable2fa = async () => {
    if (!state?.totpFactorId) return;
    setTotpBusy(true);
    await unenrollTotp(state.totpFactorId);
    setTotpBusy(false);
    setMsg("Two-factor authentication disabled.");
    await refresh();
  };

  if (!state) return null;

  const isCard = variant === "card";

  return (
    <motion.div
      initial={isCard ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{ padding: "1.5rem", position: "relative", borderRadius: "var(--radius)" }}
    >
      {isCard && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            position: "absolute", top: "0.875rem", right: "0.875rem",
            background: "none", border: "none", cursor: "pointer", color: "var(--text-3)",
          }}
        ><X size={16} /></button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
        <ShieldCheck size={18} style={{ color: "var(--accent)" }} />
        <span className="heading-md" style={{ fontWeight: 700 }}>
          {isCard ? "Secure your account" : "Account security"}
        </span>
      </div>

      {/* Email */}
      <Row
        icon={state.emailConfirmed
          ? <MailCheck size={16} style={{ color: "#4ade80" }} />
          : <MailWarning size={16} style={{ color: "#facc15" }} />}
        title="Email"
        status={state.emailConfirmed ? "Confirmed" : "Not confirmed"}
        good={state.emailConfirmed}
      >
        {!state.emailConfirmed && (
          <button className="btn btn-ghost btn-sm" onClick={doResend}>Resend confirmation</button>
        )}
      </Row>

      {/* Phone */}
      <Row
        icon={<Phone size={16} style={{ color: state.phone ? "#4ade80" : "var(--text-3)" }} />}
        title="Phone (alternate login)"
        status={state.phone || "Not set"}
        good={!!state.phone}
      >
        {!state.phone && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", width: "100%" }}>
            <input
              className="input-field" type="tel" placeholder="+1 555 012 3456"
              value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-accent btn-sm" onClick={savePhone} disabled={savingPhone}>
              {savingPhone ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : "Add"}
            </button>
          </div>
        )}
      </Row>

      {/* 2FA */}
      <Row
        icon={<ShieldCheck size={16} style={{ color: state.totpFactorId ? "#4ade80" : "var(--text-3)" }} />}
        title="Authenticator 2FA"
        status={state.totpFactorId ? "Enabled" : "Disabled"}
        good={!!state.totpFactorId}
        last
      >
        {state.totpFactorId ? (
          <button className="btn btn-ghost btn-sm" onClick={disable2fa} disabled={totpBusy}>Disable</button>
        ) : enroll ? (
          <div style={{ width: "100%", marginTop: "0.75rem" }}>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-2)", marginBottom: "0.625rem" }}>
              Scan in your authenticator app (Google Authenticator, Authy…), then enter the code:
            </div>
            <div
              style={{
                width: 160, height: 160, margin: "0 auto 0.75rem", background: "#fff",
                borderRadius: 8, padding: 8, display: "flex", alignItems: "center", justifyContent: "center",
              }}
              dangerouslySetInnerHTML={{ __html: enroll.qrSvg }}
            />
            <div style={{
              fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--text-3)",
              textAlign: "center", marginBottom: "0.75rem", wordBreak: "break-all",
            }}>
              Manual key: {enroll.secret}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="input-field" inputMode="numeric" maxLength={6} placeholder="000000"
                value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
                style={{ flex: 1, fontFamily: "var(--font-mono)", letterSpacing: "0.15em", textAlign: "center" }}
              />
              <button className="btn btn-accent btn-sm" onClick={finishEnroll} disabled={totpBusy}>
                {totpBusy ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : <><Check size={13} /> Verify</>}
              </button>
            </div>
            {totpErr && <div style={{ fontSize: "0.78rem", color: "#f87171", marginTop: "0.5rem" }}>{totpErr}</div>}
          </div>
        ) : (
          <button className="btn btn-accent btn-sm" onClick={startEnroll} disabled={totpBusy}>
            {totpBusy ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : "Enable 2FA"}
          </button>
        )}
      </Row>

      {msg && (
        <div style={{ fontSize: "0.8rem", color: "var(--text-2)", marginTop: "1rem" }}>{msg}</div>
      )}
    </motion.div>
  );
}

function Row({
  icon, title, status, good, last, children,
}: {
  icon: React.ReactNode; title: string; status: string; good: boolean; last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem",
      padding: "0.875rem 0",
      borderBottom: last ? "none" : "1px solid var(--border)",
    }}>
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: "0.78rem", color: good ? "#4ade80" : "var(--text-3)" }}>{status}</div>
      </div>
      {children}
    </div>
  );
}
