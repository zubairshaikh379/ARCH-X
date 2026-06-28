import { useState, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import type { CommunityIdea, UserProfile } from "../types";
import { Users, ThumbsUp, Plus, Loader, AlertTriangle, Check } from "lucide-react";

interface CommunityPageProps {
  userProfile: UserProfile;
  onNotify: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

const LOCAL_KEY = "archx_community_ideas";
const VOTED_KEY = (u: string) => `archx_voted_${u}`;
const CATS = ["Feature", "Challenge", "Bug", "Content", "Other"] as const;

function loadLocalIdeas(): CommunityIdea[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); }
  catch { return []; }
}
function saveLocalIdeas(ideas: CommunityIdea[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ideas));
}
function loadVotedIds(username: string): string[] {
  try { return JSON.parse(localStorage.getItem(VOTED_KEY(username)) || "[]"); }
  catch { return []; }
}
function saveVotedIds(username: string, ids: string[]) {
  localStorage.setItem(VOTED_KEY(username), JSON.stringify(ids));
}

export default function CommunityPage({ userProfile, onNotify }: CommunityPageProps) {
  const [ideas, setIdeas] = useState<CommunityIdea[]>([]);
  const [voted, setVoted]  = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseAvail, setSupabaseAvail] = useState(false);
  const [filterCat, setFilterCat] = useState<"All" | CommunityIdea["category"]>("All");
  const [sortBy, setSortBy] = useState<"votes" | "newest">("votes");

  // Form state
  const [title, setTitle] = useState("");
  const [desc, setDesc]   = useState("");
  const [cat, setCat]     = useState<CommunityIdea["category"]>("Feature");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const username = userProfile.username;

  /* ── Load ideas ──────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    setVoted(loadVotedIds(username));
    try {
      const { data, error } = await supabase
        .from("community_ideas")
        .select("*")
        .order("votes", { ascending: false });

      if (!error && data) {
        setIdeas(data as CommunityIdea[]);
        setSupabaseAvail(true);
      } else {
        setIdeas(loadLocalIdeas());
        setSupabaseAvail(false);
      }
    } catch {
      setIdeas(loadLocalIdeas());
      setSupabaseAvail(false);
    }
    setLoading(false);
  }, [username]);

  useEffect(() => { load(); }, [load]);

  /* ── Submit idea ─────────────────────────────────────── */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    const idea: CommunityIdea = {
      id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: userProfile.id,
      title: title.trim(),
      desc: desc.trim(),
      category: cat,
      votes: 1,
      author: username,
      timestamp: Date.now(),
    };

    try {
      if (supabaseAvail) {
        const { error } = await supabase.from("community_ideas").insert([idea]);
        if (error) throw error;
      } else {
        const local = loadLocalIdeas();
        saveLocalIdeas([idea, ...local]);
      }
      setIdeas(prev => [idea, ...prev]);
      setTitle(""); setDesc(""); setCat("Feature"); setShowForm(false);
      onNotify("Idea submitted — the community will see it!", "success");
    } catch {
      onNotify("Could not submit. Try again.", "error");
    }
    setSubmitting(false);
  };

  /* ── Vote ────────────────────────────────────────────── */
  const handleVote = async (id: string) => {
    const hasVoted = voted.includes(id);
    const delta = hasVoted ? -1 : 1;
    const newVoted = hasVoted ? voted.filter(v => v !== id) : [...voted, id];

    setVoted(newVoted);
    saveVotedIds(username, newVoted);
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, votes: i.votes + delta } : i));

    try {
      if (supabaseAvail) {
        const current = ideas.find(i => i.id === id);
        if (current) {
          await supabase
            .from("community_ideas")
            .update({ votes: current.votes + delta })
            .eq("id", id);
        }
      } else {
        const local = loadLocalIdeas().map(i =>
          i.id === id ? { ...i, votes: i.votes + delta } : i
        );
        saveLocalIdeas(local);
      }
    } catch { /* silent */ }
  };

  /* ── Filtered + sorted ───────────────────────────────── */
  const displayed = ideas
    .filter(i => filterCat === "All" || i.category === filterCat)
    .sort((a, b) => sortBy === "votes"
      ? b.votes - a.votes
      : b.timestamp - a.timestamp
    );

  const catColors: Record<string, string> = {
    Feature: "var(--accent)", Challenge: "var(--purple)",
    Bug: "#f87171", Content: "#facc15", Other: "var(--text-2)",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="label-mono" style={{ marginBottom: "0.625rem" }}>◈ COMMUNITY INTEL</div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 className="heading-lg" style={{ marginBottom: "0.375rem" }}>Operator Board</h1>
            <p style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>
              Vote on ideas and features. Highest-voted get built next.
            </p>
          </div>
          <button
            className="btn btn-accent btn-sm"
            onClick={() => setShowForm(v => !v)}
            style={{ flexShrink: 0 }}
          >
            <Plus size={14} /> Submit Idea
          </button>
        </div>

        {/* Supabase availability note */}
        {!supabaseAvail && !loading && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.625rem 0.875rem", marginTop: "0.875rem",
            background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.15)",
            borderRadius: "var(--radius-sm)", fontSize: "0.8rem", color: "#facc15",
          }}>
            <AlertTriangle size={13} />
            Ideas stored locally — create a <code style={{ background: "rgba(250,204,21,0.1)", padding: "0 4px", borderRadius: "3px" }}>community_ideas</code> table
            in Supabase for cross-user sharing.
          </div>
        )}
      </div>

      {/* Submit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="glass"
            style={{ padding: "1.5rem", marginBottom: "1.5rem", overflow: "hidden" }}
          >
            <div className="label-mono" style={{ marginBottom: "1rem", fontSize: "0.68rem" }}>◈ NEW SUBMISSION</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <label htmlFor="idea-title" style={{ fontSize: "0.8rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" }}>
                  Title *
                </label>
                <input
                  id="idea-title"
                  className="input-field"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="One clear, specific idea…"
                  required
                  maxLength={120}
                />
              </div>
              <div>
                <label htmlFor="idea-cat" style={{ fontSize: "0.8rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" }}>
                  Category
                </label>
                <select
                  id="idea-cat"
                  className="input-field"
                  value={cat}
                  onChange={e => setCat(e.target.value as CommunityIdea["category"])}
                  style={{ width: "130px" }}
                >
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label htmlFor="idea-desc" style={{ fontSize: "0.8rem", color: "var(--text-2)", display: "block", marginBottom: "0.375rem" }}>
                Description (optional)
              </label>
              <textarea
                id="idea-desc"
                className="input-field"
                rows={3}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="More context, use cases, or why this matters…"
                style={{ resize: "vertical", fontFamily: "var(--font-sans)" }}
                maxLength={500}
              />
            </div>
            <div style={{ display: "flex", gap: "0.625rem" }}>
              <button type="submit" className="btn btn-accent btn-sm" disabled={submitting || !title.trim()}>
                {submitting ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
                {submitting ? "Submitting…" : "Submit"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {(["All", ...CATS] as const).map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              style={{
                padding: "0.3rem 0.625rem", borderRadius: "999px",
                border: `1px solid ${filterCat === c ? "var(--accent)" : "var(--border)"}`,
                background: filterCat === c ? "var(--accent-dim)" : "transparent",
                color: filterCat === c ? "var(--accent)" : "var(--text-3)",
                fontSize: "0.7rem", fontWeight: 500, cursor: "pointer",
                fontFamily: "var(--font-sans)", transition: "all 0.15s",
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.375rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-3)", alignSelf: "center" }}>Sort:</span>
          {(["votes", "newest"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: "0.25rem 0.625rem", borderRadius: "6px",
                background: sortBy === s ? "rgba(255,255,255,0.07)" : "transparent",
                border: "1px solid var(--border)",
                color: sortBy === s ? "var(--text-1)" : "var(--text-3)",
                fontSize: "0.7rem", cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s",
              }}
            >
              {s === "votes" ? "Top Voted" : "Newest"}
            </button>
          ))}
        </div>
      </div>

      {/* Ideas List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-3)" }}>
          <Loader size={24} style={{ animation: "spin 1s linear infinite", marginBottom: "0.5rem" }} />
          <div>Loading community board…</div>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-3)" }}>
          <Users size={32} style={{ marginBottom: "0.875rem", opacity: 0.4 }} />
          <div style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.375rem" }}>No ideas yet</div>
          <div style={{ fontSize: "0.875rem" }}>Be the first to submit one.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {displayed.map((idea, idx) => {
            const hasVoted = voted.includes(idea.id);
            return (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                className="glass"
                style={{ padding: "1.125rem 1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}
              >
                {/* Vote button */}
                <button
                  onClick={() => handleVote(idea.id)}
                  title={hasVoted ? "Remove vote" : "Upvote"}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem",
                    padding: "0.5rem 0.625rem", borderRadius: "8px",
                    background: hasVoted ? "var(--accent-dim)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${hasVoted ? "rgba(34,211,238,0.25)" : "var(--border)"}`,
                    cursor: "pointer", transition: "all 0.18s", flexShrink: 0,
                  }}
                >
                  <ThumbsUp size={13} style={{ color: hasVoted ? "var(--accent)" : "var(--text-3)" }} />
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700,
                    color: hasVoted ? "var(--accent)" : "var(--text-2)",
                  }}>
                    {idea.votes}
                  </span>
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-1)" }}>
                      {idea.title}
                    </span>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 600, padding: "0.15rem 0.5rem",
                      borderRadius: "999px", border: "1px solid",
                      color: catColors[idea.category] || "var(--text-3)",
                      borderColor: catColors[idea.category] + "33" || "var(--border)",
                      background: catColors[idea.category] + "11" || "transparent",
                    }}>
                      {idea.category}
                    </span>
                  </div>
                  {idea.desc && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", lineHeight: 1.55, marginBottom: "0.5rem" }}>
                      {idea.desc}
                    </p>
                  )}
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>
                    by <span style={{ color: "var(--text-2)" }}>{idea.author}</span>
                    {idea.timestamp && ` · ${new Date(idea.timestamp).toLocaleDateString()}`}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
