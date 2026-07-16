import { useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OSINT_CHALLENGES } from "../data/courses";
import type { UserProfile } from "../types";
import { Search, ChevronRight, Lock, Unlock, CheckCircle, Zap, Eye, AlertTriangle } from "lucide-react";

interface OsintPageProps {
  userProfile: UserProfile;
  onAddXp: (amount: number, message: string) => void;
  onCompleteOsint: (id: string) => void;
}

type OsintChallenge = (typeof OSINT_CHALLENGES)[number];

export default function OsintPage({ userProfile, onAddXp, onCompleteOsint }: OsintPageProps) {
  const [selected, setSelected] = useState<OsintChallenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");

  const completed = userProfile.completedOsint || [];
  const isCompleted = (id: string) => completed.includes(id);

  const filtered = OSINT_CHALLENGES.filter(c => {
    if (filter === "completed") return isCompleted(c.id);
    if (filter === "pending")   return !isCompleted(c.id);
    return true;
  });

  const handleSelect = (c: OsintChallenge) => {
    setSelected(c);
    setAnswer("");
    setHintsRevealed(0);
    setFeedback(null);
  };

  const handleRevealHint = () => {
    if (!selected) return;
    const maxHints = selected.hints?.length ?? 0;
    if (hintsRevealed < maxHints) {
      setHintsRevealed(h => h + 1);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !answer.trim()) return;
    if (isCompleted(selected.id)) return;

    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const userClean = clean(answer.trim());
    const answerClean = clean(selected.correctAnswer);

    const correct =
      userClean === answerClean ||
      userClean.includes(answerClean) ||
      answerClean.includes(userClean);

    if (correct) {
      setFeedback("correct");
      // XP = base points minus hint penalty (50 per hint used)
      const hintPenalty = hintsRevealed * 50;
      const earned = Math.max((selected.points ?? 100) - hintPenalty, 50);
      onCompleteOsint(selected.id);
      onAddXp(earned, `OSINT Mission solved: ${selected.title}`);
    } else {
      setFeedback("wrong");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* ── Left: Mission List ──────────────────────────────── */}
      <div style={{
        width: "320px", flexShrink: 0,
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        background: "rgba(255,255,255,0.01)",
        overflow: "hidden",
      }}>
        <div style={{ padding: "1.5rem 1.25rem 0.875rem", borderBottom: "1px solid var(--border)" }}>
          <div className="label-mono" style={{ marginBottom: "0.375rem" }}>◈ OSINT OPERATIONS</div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Intelligence Missions</h1>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-3)", marginTop: "0.375rem" }}>
            {completed.length} / {OSINT_CHALLENGES.length} completed
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.875rem" }}>
            {(["all", "pending", "completed"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flex: 1, padding: "0.3rem", borderRadius: "6px", border: "none",
                  background: filter === f ? "var(--accent-dim)" : "transparent",
                  color: filter === f ? "var(--accent)" : "var(--text-3)",
                  fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                  fontFamily: "var(--font-sans)", textTransform: "capitalize",
                  transition: "all 0.15s",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0.625rem" }}>
          {filtered.map((c) => {
            const done = isCompleted(c.id);
            const active = selected?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                style={{
                  width: "100%", padding: "0.875rem 0.875rem",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${active ? "var(--accent)" : "transparent"}`,
                  background: active ? "var(--accent-dim)" : "transparent",
                  cursor: "pointer", textAlign: "left", marginBottom: "2px",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "flex-start", gap: "0.625rem",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ flexShrink: 0, marginTop: "2px" }}>
                  {done
                    ? <CheckCircle size={14} style={{ color: "#4ade80" }} />
                    : <Lock size={14} style={{ color: "var(--text-3)" }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-3)",
                    marginBottom: "0.2rem", letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    {c.category}
                  </div>
                  <div style={{
                    fontSize: "0.8125rem", fontWeight: 600,
                    color: active ? "var(--accent)" : done ? "#4ade80" : "var(--text-1)",
                    lineHeight: 1.3, fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {c.title}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.375rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                      {c.points ?? 100} pts
                    </span>
                    {done && (
                      <>
                        <span style={{ color: "var(--text-3)", fontSize: "0.6rem" }}>·</span>
                        <span style={{ fontSize: "0.65rem", color: "#4ade80" }}>solved</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={12} style={{ color: "var(--text-3)", flexShrink: 0, marginTop: "4px" }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Active Mission ───────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ maxWidth: "760px" }}
            >
              {/* Header */}
              <div style={{ marginBottom: "1.75rem" }}>
                <div className="label-mono" style={{ marginBottom: "0.625rem", fontSize: "0.68rem" }}>
                  ◈ {selected.category.toUpperCase()} · {selected.points ?? 100} POINTS
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <h2 className="heading-lg">{selected.title}</h2>
                  {isCompleted(selected.id) && (
                    <span style={{
                      display: "flex", alignItems: "center", gap: "0.375rem",
                      padding: "0.375rem 0.75rem", borderRadius: "999px",
                      background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
                      color: "#4ade80", fontSize: "0.75rem", fontWeight: 600, flexShrink: 0,
                    }}>
                      <CheckCircle size={12} /> Solved
                    </span>
                  )}
                </div>
              </div>

              {/* Image */}
              {selected.imageUrl && (
                <div style={{
                  borderRadius: "var(--radius)", overflow: "hidden",
                  border: "1px solid var(--border)", marginBottom: "1.5rem",
                  position: "relative", maxHeight: "340px",
                }}>
                  <img
                    src={selected.imageUrl}
                    alt={`Intelligence target for ${selected.title}`}
                    style={{ width: "100%", height: "340px", objectFit: "cover", display: "block" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(4,4,13,0.8) 0%, transparent 50%)",
                    pointerEvents: "none",
                  }} />
                </div>
              )}

              {/* Mission Brief */}
              <div className="glass" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
                <div className="label-mono" style={{ marginBottom: "0.625rem", fontSize: "0.68rem" }}>MISSION BRIEF</div>
                <p style={{ color: "var(--text-2)", lineHeight: 1.65, fontSize: "0.9375rem" }}>
                  {selected.description}
                </p>
              </div>

              {/* Investigative Objectives (questionnaire) */}
              {selected.objectives && selected.objectives.length > 0 && (
                <div className="glass" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
                  <div className="label-mono" style={{ marginBottom: "0.875rem", fontSize: "0.68rem" }}>
                    INVESTIGATIVE OBJECTIVES
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {selected.objectives.map((obj, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                        <div style={{
                          width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                          background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.25)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700,
                          color: "var(--accent)", marginTop: "1px",
                        }}>
                          {i + 1}
                        </div>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.55 }}>{obj}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progressive Hints */}
              <div className="glass" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                  <div className="label-mono" style={{ fontSize: "0.68rem" }}>
                    INTELLIGENCE AIDS ({hintsRevealed}/{selected.hints?.length ?? 0} USED)
                  </div>
                  {hintsRevealed < (selected.hints?.length ?? 0) && !isCompleted(selected.id) && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleRevealHint}
                      style={{ fontSize: "0.75rem", gap: "0.375rem" }}
                    >
                      <Eye size={12} />
                      Request Hint (−50 pts)
                    </button>
                  )}
                </div>

                {hintsRevealed === 0 ? (
                  <div style={{ color: "var(--text-3)", fontSize: "0.8125rem", fontStyle: "italic" }}>
                    No intelligence aids used yet. Use hints only when needed — each costs 50 points.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {selected.hints?.slice(0, hintsRevealed).map((hint, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                          padding: "0.625rem 0.875rem",
                          background: "var(--accent-dim)",
                          border: "1px solid rgba(34,211,238,0.12)",
                          borderLeft: "3px solid var(--accent)",
                          borderRadius: "0 6px 6px 0",
                          fontSize: "0.875rem", color: "var(--text-2)",
                        }}
                      >
                        <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", marginRight: "0.5rem" }}>
                          [{i + 1}]
                        </span>
                        {hint}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tools */}
              {selected.tools && selected.tools.length > 0 && (
                <div style={{ marginBottom: "1.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-3)", alignSelf: "center", marginRight: "0.25rem" }}>Suggested tools:</span>
                  {selected.tools.map(t => (
                    <span key={t} className="badge badge-accent" style={{ fontSize: "0.65rem" }}>{t}</span>
                  ))}
                </div>
              )}

              {/* Answer Form */}
              {!isCompleted(selected.id) ? (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label
                      htmlFor="osint-answer"
                      style={{ fontSize: "0.8125rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" }}
                    >
                      Your Answer
                    </label>
                    <input
                      id="osint-answer"
                      className="input-field"
                      type="text"
                      value={answer}
                      onChange={e => { setAnswer(e.target.value); setFeedback(null); }}
                      placeholder="Enter your intelligence assessment…"
                    />
                  </div>

                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "0.75rem",
                        background: feedback === "correct" ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
                        border: `1px solid ${feedback === "correct" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                        color: feedback === "correct" ? "#4ade80" : "#f87171",
                        fontSize: "0.875rem",
                        display: "flex", alignItems: "center", gap: "0.5rem",
                      }}
                    >
                      {feedback === "correct"
                        ? <><CheckCircle size={14} /> Correct! Mission complete. XP has been awarded.</>
                        : <><AlertTriangle size={14} /> Incorrect. Review your intelligence and try again.</>
                      }
                    </motion.div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <button type="submit" className="btn btn-accent" disabled={!answer.trim()}>
                      <Search size={14} /> Submit Intelligence
                    </button>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <Zap size={11} style={{ color: "var(--accent)" }} />
                      Earn up to {(selected.points ?? 100) - hintsRevealed * 50} XP
                    </div>
                  </div>
                </form>
              ) : (
                <div style={{
                  padding: "1.25rem",
                  background: "rgba(74,222,128,0.06)",
                  border: "1px solid rgba(74,222,128,0.15)",
                  borderRadius: "var(--radius-sm)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Unlock size={14} style={{ color: "#4ade80" }} />
                    <span style={{ fontWeight: 600, color: "#4ade80", fontSize: "0.875rem" }}>Mission Debriefed</span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.55 }}>
                    {selected.explanation}
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                height: "100%", minHeight: "60vh", textAlign: "center",
              }}
            >
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1.25rem",
              }}>
                <Search size={28} style={{ color: "var(--accent)" }} />
              </div>
              <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Select a Mission</h2>
              <p style={{ color: "var(--text-3)", fontSize: "0.875rem", maxWidth: "300px" }}>
                Choose an OSINT operation from the left to begin intelligence gathering.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
