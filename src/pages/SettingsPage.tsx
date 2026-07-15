import { useEffect, useState } from "react";
import { motion } from "motion/react";
import SecurityCard from "../components/SecurityCard";
import { getAuthUser, updateEmail, updatePassword } from "../lib/auth";
import {
  Settings as SettingsIcon, User, Mail, KeyRound, ShieldCheck,
  Info, HelpCircle, FileText, ChevronDown, Check, Loader, LogOut,
} from "lucide-react";

interface SettingsPageProps {
  username: string;
  onNotify: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  onLogout: () => void;
}

export default function SettingsPage({ username, onNotify, onLogout }: SettingsPageProps) {
  const [email, setEmail] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  // Change email
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);

  // Change password
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErr, setPwErr] = useState("");

  useEffect(() => {
    (async () => {
      const u = await getAuthUser();
      setEmail(u?.email || "");
      setEmailConfirmed(!!u?.email_confirmed_at);
    })();
  }, []);

  const changeEmail = async () => {
    const e = newEmail.trim();
    if (!e.includes("@")) { onNotify("Enter a valid email address.", "error"); return; }
    setEmailBusy(true);
    const res = await updateEmail(e);
    setEmailBusy(false);
    if (res.ok) { onNotify("Confirmation sent to your new email. Click it to finish.", "success"); setNewEmail(""); }
    else onNotify(res.error || "Could not change email.", "error");
  };

  const changePassword = async () => {
    setPwErr("");
    if (pw.length < 6) { setPwErr("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { setPwErr("Passwords do not match."); return; }
    setPwBusy(true);
    const res = await updatePassword(pw);
    setPwBusy(false);
    if (res.ok) { onNotify("Password updated.", "success"); setPw(""); setPw2(""); }
    else setPwErr(res.error || "Could not update password.");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "760px", margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="label-mono" style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <SettingsIcon size={13} /> ◈ SETTINGS
        </div>
        <h1 className="heading-xl" style={{ marginBottom: "0.375rem" }}>Account & Security</h1>
        <p style={{ color: "var(--text-2)", fontSize: "0.9rem", marginBottom: "2rem" }}>
          Manage your identity, sign-in security, and platform info.
        </p>
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Account */}
        <Section icon={<User size={16} />} title="Account">
          <FieldRow label="Username" value={username} mono />
          <FieldRow
            label="Email"
            value={email || "—"}
            badge={emailConfirmed ? "Confirmed" : "Unconfirmed"}
            badgeGood={emailConfirmed}
          />
          <div style={{ marginTop: "0.875rem" }}>
            <label style={fLabel}>Change email</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="input-field" type="email" placeholder="new@example.com"
                value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ flex: 1 }}
              />
              <button className="btn btn-accent btn-sm" onClick={changeEmail} disabled={emailBusy}>
                {emailBusy ? <Loader size={13} style={spin} /> : <><Mail size={13} /> Update</>}
              </button>
            </div>
          </div>
        </Section>

        {/* Security (reuses the SecurityCard panel: email confirm, phone, TOTP 2FA) */}
        <Section icon={<ShieldCheck size={16} />} title="Sign-in security">
          <SecurityCard username={username} variant="panel" />
        </Section>

        {/* Password */}
        <Section icon={<KeyRound size={16} />} title="Change password">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={fLabel}>New password</label>
              <input className="input-field" type="password" autoComplete="new-password"
                value={pw} onChange={e => setPw(e.target.value)} placeholder="Min. 6 characters" />
            </div>
            <div>
              <label style={fLabel}>Confirm new password</label>
              <input className="input-field" type="password" autoComplete="new-password"
                value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Re-enter password" />
            </div>
            {pwErr && <div style={{ fontSize: "0.8rem", color: "#f87171" }}>{pwErr}</div>}
            <button className="btn btn-accent btn-sm" onClick={changePassword} disabled={pwBusy} style={{ alignSelf: "flex-start" }}>
              {pwBusy ? <Loader size={13} style={spin} /> : <><Check size={13} /> Update password</>}
            </button>
          </div>
        </Section>

        {/* About / Help / Privacy */}
        <Accordion icon={<Info size={16} />} title="About ARCH-X">
          <p style={pText}>
            ARCH-X is a hands-on cybersecurity training platform — 16 guided course tracks,
            solvable sandbox labs with live containers, and OSINT operations. Progress, XP,
            and completions sync to your account. Built with React, Vite, three.js, and Supabase.
          </p>
        </Accordion>

        <Accordion icon={<HelpCircle size={16} />} title="Help & support">
          <ul style={{ ...pText, paddingLeft: "1.1rem", lineHeight: 1.7 }}>
            <li><b>Labs:</b> select a course, start the container, then use the terminal — type <code>help</code>, <code>objective</code>, or <code>hint</code>.</li>
            <li><b>Exams:</b> pass the course exam to unlock its practice lab.</li>
            <li><b>2FA:</b> enable authenticator 2FA above for account protection.</li>
            <li><b>Stuck signing in?</b> use “Forgot password?” on the sign-in screen.</li>
          </ul>
        </Accordion>

        <Accordion icon={<FileText size={16} />} title="Privacy & data">
          <p style={pText}>
            Authentication is handled by Supabase Auth; passwords are never stored in plaintext.
            We store your username, email, optional phone (as an alternate login identifier only —
            never used for SMS), and learning progress. You can change your email/password above,
            or clear all progress from the Profile page. No data is sold or shared with third parties.
          </p>
        </Accordion>

        {/* Sign out */}
        <button className="btn btn-outline" onClick={onLogout} style={{ alignSelf: "flex-start", gap: "0.5rem" }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}

/* ── Presentational helpers ─────────────────────────────────── */
const fLabel: React.CSSProperties = { fontSize: "0.8125rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" };
const pText: React.CSSProperties = { fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.6, margin: 0 };
const spin: React.CSSProperties = { animation: "spin 1s linear infinite" };

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.1rem" }}>
        <span style={{ color: "var(--accent)" }}>{icon}</span>
        <span style={{ fontWeight: 700 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, value, badge, badgeGood, mono }: {
  label: string; value: string; badge?: string; badgeGood?: boolean; mono?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0.5rem 0", gap: "0.75rem",
    }}>
      <span style={{ fontSize: "0.8125rem", color: "var(--text-3)" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.875rem", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", color: "var(--text-1)" }}>{value}</span>
        {badge && (
          <span style={{
            fontSize: "0.65rem", fontFamily: "var(--font-mono)", padding: "0.15rem 0.45rem", borderRadius: "5px",
            color: badgeGood ? "#4ade80" : "#facc15",
            background: badgeGood ? "rgba(74,222,128,0.1)" : "rgba(250,204,21,0.1)",
            border: `1px solid ${badgeGood ? "rgba(74,222,128,0.25)" : "rgba(250,204,21,0.25)"}`,
          }}>{badge}</span>
        )}
      </span>
    </div>
  );
}

function Accordion({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass" style={{ padding: "0 1.5rem" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "1.1rem 0", background: "none", border: "none", cursor: "pointer",
          color: "var(--text-1)", fontSize: "0.9375rem", fontWeight: 600,
        }}
      >
        <span style={{ color: "var(--accent)" }}>{icon}</span>
        {title}
        <ChevronDown size={16} style={{ marginLeft: "auto", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", opacity: 0.6 }} />
      </button>
      {open && <div style={{ paddingBottom: "1.25rem" }}>{children}</div>}
    </div>
  );
}
