import { useRef, Fragment } from "react";
import type { ReactNode } from "react";
import { motion, useInView } from "motion/react";
import HeroScene from "../components/3d/HeroScene";
import { ArchXLogo } from "../components/ArchXLogo";
import { COURSES } from "../data/courses";
import {
  Shield, Terminal, Search, Users, ArrowRight,
  Zap, BookOpen, Trophy, ChevronDown,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

function FadeSection({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: <Terminal size={20} />,
    title: "Live Terminal",
    desc: "Provision real containers, execute attack chains, submit CTF flags. Hands-on from minute one.",
  },
  {
    icon: <Search size={20} />,
    title: "OSINT Missions",
    desc: "12 geo-intelligence operations. Trace operatives, analyze metadata, identify locations.",
  },
  {
    icon: <Shield size={20} />,
    title: "MITRE ATT&CK",
    desc: "Every course maps to real tactics and techniques. Build skills that matter in interviews.",
  },
  {
    icon: <Users size={20} />,
    title: "Community Intel",
    desc: "Vote on features, submit ideas, collaborate with operators on what to build next.",
  },
  {
    icon: <Trophy size={20} />,
    title: "XP & Ranking",
    desc: "Earn points, level up, climb the leaderboard. Persistent progress across all devices.",
  },
  {
    icon: <BookOpen size={20} />,
    title: "Deep Guidebooks",
    desc: "Structured SOPs, interview prep, real-world attack loopholes — not textbook theory.",
  },
];

const STATS = [
  { value: String(COURSES.length), label: "Training Tracks" },
  { value: "12",    label: "OSINT Missions" },
  { value: "100%",  label: "Free Forever" },
  { value: "∞",     label: "Replayable" },
];

const DIFF_COLORS: Record<string, string> = {
  Beginner:     "#4ade80",
  Intermediate: "#facc15",
  Advanced:     "#f87171",
};

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)", overflow: "hidden" }}>
      <div className="bg-mesh" />

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(4,4,13,0.7)",
        backdropFilter: "blur(16px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <ArchXLogo size={26} className="text-[color:var(--accent)]" />
          <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>ARCH-X</span>
        </div>
        <button className="btn btn-accent btn-sm" onClick={onGetStarted}>
          Sign In <ArrowRight size={13} />
        </button>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        alignItems: "center",
        gap: "2rem",
        padding: "6rem 2rem 4rem",
        maxWidth: "1400px",
        margin: "0 auto",
        position: "relative",
      }}>
        {/* Left: Text */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: "1.25rem" }}
          >
            <span className="label-mono" style={{ fontSize: "0.7rem" }}>
              ◈ CYBERSECURITY TRAINING PLATFORM
            </span>
          </motion.div>

          <motion.h1
            className="heading-display"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ lineHeight: 0.92, marginBottom: "1.75rem" }}
          >
            TRAIN
            <br />
            <span style={{ color: "var(--accent)", textShadow: "0 0 60px var(--accent-glow)" }}>
              LIKE AN
            </span>
            <br />
            OPERATOR
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "1.0625rem", color: "var(--text-2)", lineHeight: 1.65,
              maxWidth: "440px", marginBottom: "2.25rem",
            }}
          >
            The cybersecurity learning platform that treats you like a professional
            from day one. Real terminals. Real labs. Real skills.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
            style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", marginBottom: "2.5rem" }}
          >
            <button className="btn btn-accent btn-lg" onClick={onGetStarted}>
              Start Training Free <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => document.getElementById("courses-preview")?.scrollIntoView({ behavior: "smooth" })}
            >
              Browse Courses
            </button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}
          >
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{
                  fontSize: "1.375rem", fontWeight: 800,
                  color: "var(--text-1)", letterSpacing: "-0.03em",
                  fontFamily: "var(--font-mono)",
                }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: 3D Scene */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", height: "560px" }}
        >
          <HeroScene className="" />
          {/* Ambient glow behind scene */}
          <div style={{
            position: "absolute", inset: "10%",
            background: "radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(40px)",
            pointerEvents: "none",
            zIndex: -1,
          }} />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{
            position: "absolute", bottom: "2rem", left: "50%",
            transform: "translateX(-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem",
            color: "var(--text-3)", fontSize: "0.6875rem", letterSpacing: "0.1em",
            fontFamily: "var(--font-mono)", cursor: "pointer",
          }}
          onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
        >
          SCROLL
          <ChevronDown size={14} style={{ animation: "float-y 2s ease-in-out infinite" }} />
        </motion.div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" style={{ padding: "6rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <FadeSection>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div className="label-mono" style={{ marginBottom: "0.875rem" }}>◈ CAPABILITIES</div>
            <h2 className="heading-xl" style={{ marginBottom: "1rem" }}>Your Weapons</h2>
            <p style={{ color: "var(--text-2)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
              Everything you need to go from curious to dangerous.
            </p>
          </div>
        </FadeSection>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}>
          {FEATURES.map((f, i) => (
            <Fragment key={f.title}><FadeSection delay={i * 0.07}>
              <div style={{
                padding: "2rem",
                background: "var(--surface)",
                height: "100%",
                borderRight: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                transition: "background 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(34,211,238,0.03)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--surface)")}
              >
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--accent)", marginBottom: "1.125rem",
                }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9375rem" }}>{f.title}</div>
                <div style={{ color: "var(--text-2)", fontSize: "0.875rem", lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            </FadeSection></Fragment>
          ))}
        </div>
      </section>

      {/* ── Course Preview ─────────────────────────────────────── */}
      <section id="courses-preview" style={{ padding: "6rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <FadeSection>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="label-mono" style={{ marginBottom: "0.875rem" }}>◈ TRAINING TRACKS</div>
              <h2 className="heading-xl">
                {COURSES.length} Courses.<br />
                <span style={{ color: "var(--text-2)", fontWeight: 400 }}>Zero fluff.</span>
              </h2>
            </div>
            <button className="btn btn-outline" onClick={onGetStarted}>
              View All Courses <ArrowRight size={14} />
            </button>
          </div>
        </FadeSection>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "0.875rem",
        }}>
          {COURSES.slice(0, 6).map((course, i) => (
            <Fragment key={course.id}><FadeSection delay={i * 0.06}>
              <div
                className="course-card"
                onClick={onGetStarted}
                style={{ cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginBottom: "0.4rem", fontFamily: "var(--font-mono)" }}>
                      {course.estimatedTime}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.35, color: "var(--text-1)" }}>
                      {course.title}
                    </div>
                  </div>
                  <span
                    className={`badge badge-${course.difficulty.toLowerCase()}`}
                    style={{ flexShrink: 0, fontSize: "0.6rem" }}
                  >
                    {course.difficulty}
                  </span>
                </div>

                <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", lineHeight: 1.55 }}>
                  {course.shortDesc}
                </p>

                {/* MITRE bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {course.mitreCoverage.slice(0, 2).map(m => (
                    <div key={m.tactic}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                        <span style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>{m.tactic}</span>
                        <span style={{ fontSize: "0.65rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{m.percentage}%</span>
                      </div>
                      <div className="xp-bar-track">
                        <div
                          className="xp-bar-fill"
                          style={{ width: `${m.percentage}%`, background: DIFF_COLORS[course.difficulty] || "var(--accent)" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Zap size={12} style={{ color: "var(--accent)" }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      +{course.lessons.reduce((s, l) => s + l.quizzes.length, 0) * 80 + 400} XP
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent)" }}>
                    Launch →
                  </span>
                </div>
              </div>
            </FadeSection></Fragment>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: "6rem 2rem 8rem", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <FadeSection>
          <div className="label-mono" style={{ marginBottom: "1.25rem" }}>◈ READY TO OPERATE?</div>
          <h2 className="heading-xl" style={{ marginBottom: "1.25rem" }}>
            Zero prerequisites.
            <br />
            <span style={{ color: "var(--accent)" }}>Infinite ceiling.</span>
          </h2>
          <p style={{ color: "var(--text-2)", marginBottom: "2.5rem", lineHeight: 1.65, fontSize: "1.0625rem" }}>
            Whether you've never touched a terminal or you're prepping for a red-team engagement —
            ARCH-X meets you where you are.
          </p>
          <button className="btn btn-accent btn-lg" onClick={onGetStarted} style={{ margin: "0 auto" }}>
            Create Free Account <ArrowRight size={16} />
          </button>
        </FadeSection>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "2rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        maxWidth: "1400px", margin: "0 auto", flexWrap: "wrap", gap: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ArchXLogo size={18} className="text-[color:var(--text-3)]" />
          <span style={{ fontSize: "0.8125rem", color: "var(--text-3)" }}>
            ARCH-X — Cybersecurity Training Platform
          </span>
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
          Free forever. No paywall. No compromise.
        </div>
      </footer>
    </div>
  );
}
