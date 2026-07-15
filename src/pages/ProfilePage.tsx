import { useState } from "react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";
import { COURSES, MOCK_LEADERBOARD, OSINT_CHALLENGES } from "../data/courses";
import type { UserProfile } from "../types";
import { ACCENT_COLORS } from "../types";
import CertificateModal from "../components/CertificateModal";
import {
  User, Shield, Trophy, Zap, BookOpen, Search,
  Edit2, Check, AlertTriangle, Trash2, Activity, Award,
} from "lucide-react";

interface ProfilePageProps {
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onAddXp: (amount: number, message: string) => void;
  onNotify: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  onClearAndLogout: () => void;
}

export default function ProfilePage({ userProfile, onUpdateProfile, onAddXp, onNotify, onClearAndLogout }: ProfilePageProps) {
  const [editingCallsign, setEditingCallsign] = useState(false);
  const [callsignDraft, setCallsignDraft] = useState(userProfile.callsign);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(userProfile.bio || "");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [diagnosticsMsg, setDiagnosticsMsg] = useState<string | null>(null);
  const [certCourseId, setCertCourseId] = useState<string | null>(null);

  const earnedCerts = COURSES.filter(c => userProfile.completedCourses.includes(c.id));
  const certCourse = earnedCerts.find(c => c.id === certCourseId) || null;

  const xpInLevel = userProfile.xp % 1000;
  const xpPct = (xpInLevel / 1000) * 100;
  const totalProgress = Math.round((userProfile.completedCourses.length / COURSES.length) * 100);

  /* ── Diagnostics (anti-farm: once per 24h) ─────────────── */
  const handleDiagnostics = () => {
    const now = Date.now();
    const last = userProfile.lastDiagnosticsRun || 0;
    const hoursAgo = (now - last) / 1000 / 3600;

    if (hoursAgo < 24) {
      const nextIn = Math.ceil(24 - hoursAgo);
      setDiagnosticsMsg(`Already run today. Next diagnostic available in ${nextIn}h.`);
      return;
    }
    onUpdateProfile({ lastDiagnosticsRun: now });
    onAddXp(50, "System diagnostic complete");
    setDiagnosticsMsg("Diagnostic passed. XP awarded.");
  };

  /* ── Accent color (updates CSS variable immediately) ───── */
  const handleAccentChange = (color: UserProfile["accentColor"]) => {
    const hex = ACCENT_COLORS[color].hex;
    document.documentElement.style.setProperty("--accent", hex);
    document.documentElement.style.setProperty("--accent-glow", `${hex}33`);
    document.documentElement.style.setProperty("--accent-dim", `${hex}14`);
    onUpdateProfile({ accentColor: color });
    onNotify(`Accent updated to ${ACCENT_COLORS[color].label}`, "success");
  };

  /* ── Save callsign ─────────────────────────────────────── */
  const saveCallsign = async () => {
    const cs = callsignDraft.trim() || "Security Operator";
    onUpdateProfile({ callsign: cs });
    try {
      await supabase.from("profiles").update({ callsign: cs }).eq("username", userProfile.username);
    } catch { /* local fallback handled by onUpdateProfile */ }
    setEditingCallsign(false);
  };

  /* ── Save bio ──────────────────────────────────────────── */
  const saveBio = () => {
    onUpdateProfile({ bio: bioDraft.trim() });
    setEditingBio(false);
  };

  /* ── Clear all data ────────────────────────────────────── */
  const handleClear = async () => {
    try {
      await supabase.from("profiles").delete().eq("username", userProfile.username);
      await supabase.from("user_vms").delete().eq("username", userProfile.username);
    } catch { /* ignore */ }
    onClearAndLogout();
  };

  /* ── Leaderboard: inject current user ──────────────────── */
  const board = [...MOCK_LEADERBOARD];
  const userEntry = {
    rank: board.length + 1,
    name: userProfile.username,
    track: "Trainee",
    xp: userProfile.xp,
    completedCount: userProfile.completedCourses.length,
    badge: `Level ${userProfile.level}`,
  };
  // Insert at correct rank by XP
  const insertIdx = board.findIndex(e => e.xp < userProfile.xp);
  const finalBoard = insertIdx === -1
    ? [...board, { ...userEntry, rank: board.length + 1 }]
    : [
        ...board.slice(0, insertIdx).map((e, i) => ({ ...e, rank: i + 1 })),
        { ...userEntry, rank: insertIdx + 1, isSelf: true },
        ...board.slice(insertIdx).map((e, i) => ({ ...e, rank: insertIdx + i + 2 })),
      ];

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="label-mono" style={{ marginBottom: "0.625rem" }}>◈ OPERATOR PROFILE</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.25rem", alignItems: "start" }}>
        {/* ── Left: Identity Card ─────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Avatar + name */}
          <div className="glass" style={{ padding: "1.75rem", textAlign: "center" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "var(--accent-dim)", border: "2px solid rgba(34,211,238,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1rem",
              fontSize: "1.5rem",
            }}>
              {userProfile.avatar || <User size={32} style={{ color: "var(--accent)" }} />}
            </div>

            <div style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.25rem" }}>
              {userProfile.username}
            </div>

            {/* Callsign edit */}
            {editingCallsign ? (
              <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.625rem" }}>
                <input
                  className="input-field"
                  value={callsignDraft}
                  onChange={e => setCallsignDraft(e.target.value)}
                  maxLength={40}
                  autoFocus
                  style={{ fontSize: "0.8rem", textAlign: "center" }}
                />
                <button className="btn btn-accent btn-sm" onClick={saveCallsign}><Check size={12} /></button>
              </div>
            ) : (
              <button
                onClick={() => setEditingCallsign(true)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-2)", fontSize: "0.875rem",
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  margin: "0 auto 0.875rem",
                }}
              >
                {userProfile.callsign} <Edit2 size={11} />
              </button>
            )}

            {/* Level badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              padding: "0.375rem 0.875rem",
              background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.2)",
              borderRadius: "999px", marginBottom: "1rem",
            }}>
              <Zap size={12} style={{ color: "var(--accent)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 700, color: "var(--accent)" }}>
                Level {userProfile.level}
              </span>
            </div>

            {/* XP bar */}
            <div style={{ textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>XP Progress</span>
                <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                  {userProfile.xp.toLocaleString()} total
                </span>
              </div>
              <div className="xp-bar-track">
                <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-3)", marginTop: "0.25rem", textAlign: "right" }}>
                {xpInLevel}/1000 to Level {userProfile.level + 1}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="glass" style={{ padding: "1.25rem" }}>
            <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem" }}>MISSION STATS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              {[
                { icon: <BookOpen size={14} />, value: userProfile.completedCourses.length, label: "Courses", color: "var(--accent)" },
                { icon: <Search size={14} />, value: (userProfile.completedOsint || []).length, label: "OSINT Ops", color: "var(--purple)" },
                { icon: <Trophy size={14} />, value: `${totalProgress}%`, label: "Complete", color: "#facc15" },
                { icon: <Shield size={14} />, value: userProfile.level, label: "Level", color: "#4ade80" },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "0.875rem", borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                  textAlign: "center",
                }}>
                  <div style={{ color: s.color, marginBottom: "0.375rem" }}>{s.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: "1.125rem", fontFamily: "var(--font-mono)", color: "var(--text-1)" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostics */}
          <div className="glass" style={{ padding: "1.125rem" }}>
            <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.5rem" }}>SYSTEM DIAGNOSTICS</div>
            <button className="btn btn-outline btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={handleDiagnostics}>
              <Activity size={13} /> Run Diagnostic (+50 XP)
            </button>
            {diagnosticsMsg && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.5rem", textAlign: "center" }}>
                {diagnosticsMsg}
              </div>
            )}
            <div style={{ fontSize: "0.7rem", color: "var(--text-3)", marginTop: "0.375rem", textAlign: "center" }}>
              Once per 24 hours
            </div>
          </div>
        </div>

        {/* ── Right: Settings + Leaderboard ───────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Bio */}
          <div className="glass" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <div className="label-mono" style={{ fontSize: "0.65rem" }}>OPERATOR BIO</div>
              {!editingBio
                ? <button className="btn btn-ghost btn-sm" onClick={() => setEditingBio(true)}><Edit2 size={12} /> Edit</button>
                : <button className="btn btn-accent btn-sm" onClick={saveBio}><Check size={12} /> Save</button>
              }
            </div>
            {editingBio
              ? <textarea className="input-field" rows={3} value={bioDraft} onChange={e => setBioDraft(e.target.value)} maxLength={300} placeholder="Tell the community about yourself…" style={{ resize: "vertical", fontFamily: "var(--font-sans)" }} autoFocus />
              : <p style={{ color: "var(--text-2)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                  {userProfile.bio || <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>No bio yet. Click Edit to add one.</span>}
                </p>
            }
          </div>

          {/* Accent color */}
          <div className="glass" style={{ padding: "1.25rem" }}>
            <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem" }}>INTERFACE ACCENT</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {(Object.entries(ACCENT_COLORS) as [UserProfile["accentColor"], { css: string; label: string; hex: string }][]).map(([key, val]) => (
                <button
                  key={key}
                  title={val.label}
                  onClick={() => handleAccentChange(key)}
                  style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: val.hex, border: `3px solid ${userProfile.accentColor === key ? val.hex : "transparent"}`,
                    outline: userProfile.accentColor === key ? `2px solid ${val.hex}` : "2px solid transparent",
                    outlineOffset: "2px",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.625rem" }}>
              Current: <span style={{ color: "var(--accent)" }}>{ACCENT_COLORS[userProfile.accentColor]?.label}</span>
            </div>
          </div>

          {/* Security lives in Settings now */}
          <div className="glass" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Shield size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: "0.8125rem", color: "var(--text-2)" }}>
              Manage email, phone, 2FA, and password in <b style={{ color: "var(--text-1)" }}>Settings</b>.
            </div>
          </div>

          {/* Certificates */}
          <div className="glass" style={{ padding: "1.25rem" }}>
            <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Award size={12} /> ◈ CERTIFICATES
            </div>
            {earnedCerts.length === 0 ? (
              <div style={{ fontSize: "0.8125rem", color: "var(--text-3)" }}>
                Complete a course (pass the exam + solve the lab) to earn a downloadable certificate.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {earnedCerts.map(c => (
                  <div key={c.id} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.625rem 0.75rem", borderRadius: "8px",
                    background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                  }}>
                    <Award size={15} style={{ color: "#facc15", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600 }}>{c.title}</span>
                    <button className="btn btn-accent btn-sm" onClick={() => setCertCourseId(c.id)} style={{ gap: "0.35rem" }}>
                      <Award size={12} /> View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Global Leaderboard */}
          <div className="glass" style={{ padding: "1.25rem" }}>
            <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem" }}>◈ GLOBAL LEADERBOARD</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {(finalBoard as Array<typeof finalBoard[number] & { isSelf?: boolean }>).slice(0, 8).map((e) => {
                const isSelf = e.name === userProfile.username;
                return (
                  <div
                    key={e.rank}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.625rem 0.75rem", borderRadius: "8px",
                      background: isSelf ? "var(--accent-dim)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isSelf ? "rgba(34,211,238,0.2)" : "var(--border)"}`,
                    }}
                  >
                    <div style={{
                      width: "22px", textAlign: "center",
                      fontFamily: "var(--font-mono)", fontSize: "0.75rem",
                      color: e.rank <= 3 ? ["#facc15", "#9ca3af", "#cd7c5b"][e.rank - 1] : "var(--text-3)",
                      fontWeight: 700, flexShrink: 0,
                    }}>
                      {e.rank <= 3 ? ["🥇","🥈","🥉"][e.rank-1] : `#${e.rank}`}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: isSelf ? "var(--accent)" : "var(--text-1)" }}>
                        {e.name} {isSelf && <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>(you)</span>}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>{e.badge}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: isSelf ? "var(--accent)" : "var(--text-2)", fontWeight: 600 }}>
                        {e.xp.toLocaleString()} XP
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>
                        {e.completedCount} courses
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger zone */}
          <div style={{
            padding: "1.25rem",
            border: "1px solid rgba(248,113,113,0.15)",
            borderRadius: "var(--radius)",
            background: "rgba(248,113,113,0.03)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <AlertTriangle size={14} style={{ color: "#f87171" }} />
              <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#f87171" }}>Danger Zone</span>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-3)", marginBottom: "0.875rem", lineHeight: 1.5 }}>
              Permanently delete your profile, progress, and all VM records. This cannot be undone.
            </p>
            {!showClearConfirm ? (
              <button className="btn btn-danger btn-sm" onClick={() => setShowClearConfirm(true)}>
                <Trash2 size={13} /> Clear All Data
              </button>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "#f87171" }}>Are you absolutely sure?</span>
                <button className="btn btn-danger btn-sm" onClick={handleClear}>Yes, delete everything</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowClearConfirm(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CertificateModal
        open={!!certCourse}
        onClose={() => setCertCourseId(null)}
        operatorName={userProfile.callsign || userProfile.username}
        username={userProfile.username}
        courseTitle={certCourse?.title || ""}
        courseId={certCourse?.id || ""}
        level={userProfile.level}
        xp={userProfile.xp}
      />
    </div>
  );
}
