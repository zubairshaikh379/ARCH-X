import { useRef, Fragment } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import HeroScene from "../components/3d/HeroScene";
import Starfield from "../components/3d/Starfield";
import FloatingMenu from "../components/FloatingMenu";
import Reveal from "../components/Reveal";
import MagneticButton from "../components/MagneticButton";
import { useLenis } from "../hooks/useLenis";
import { ArchXLogo } from "../components/ArchXLogo";
import { COURSES } from "../data/courses";
import {
  Shield, Terminal, Search, Users, ArrowRight,
  Zap, BookOpen, Trophy, ChevronDown,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: (mode?: "login" | "register") => void;
}

// Tech/tactic ticker shown as an infinite marquee under the hero.
const MARQUEE = [
  "MITRE ATT&CK", "Nmap", "Wireshark", "Burp Suite", "Metasploit",
  "OSINT", "Reverse Engineering", "Privilege Escalation", "SOC Analysis",
  "Digital Forensics", "Red Team", "Blue Team", "CTF", "Threat Hunting",
];

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
  const { scrollTo } = useLenis();

  // Page scroll → progress bar width (spring-smoothed).
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  // Hero parallax: the full-bleed chrome blob drifts + fades as you scroll past.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroP } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const blobY = useTransform(heroP, [0, 1], [0, -120]);
  const blobScale = useTransform(heroP, [0, 1], [1, 1.18]);
  const blobFade = useTransform(heroP, [0, 0.85], [1, 0]);
  const textY = useTransform(heroP, [0, 1], [0, 70]);
  const heroFade = useTransform(heroP, [0, 0.7], [1, 0]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)" }}>
      <div className="bg-mesh" />

      {/* Galaxy backdrop — fixed starfield + nebula haze behind the globe */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <Starfield />
      </div>

      {/* Full-bleed chrome blob — immersive background for the hero stage */}
      <motion.div
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          y: blobY, scale: blobScale, opacity: blobFade,
        }}
      >
        <HeroScene className="" />
        {/* vignette so lower content stays legible */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 60% 55% at 50% 42%, transparent 40%, rgba(6,6,8,0.55) 100%)",
        }} />
      </motion.div>

      <motion.div className="scroll-progress" style={{ scaleX: progress }} />

      <FloatingMenu
        onGetStarted={onGetStarted}
        onNavigate={(sel) => scrollTo(sel, -80)}
      />

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
          <ArchXLogo size={26} />
          <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>ARCH-X</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onGetStarted("login")}>
            Log In
          </button>
          <button className="btn btn-accent btn-sm" onClick={() => onGetStarted("register")}>
            Sign Up <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* ── Hero — immersive centered stage over the chrome blob ── */}
      <section ref={heroRef} id="top" style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "0",
        padding: "7rem 1.5rem 4rem",
        position: "relative",
      }}>
        <motion.div
          style={{ position: "relative", zIndex: 2, y: textY, opacity: heroFade, maxWidth: "900px" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: "1.75rem" }}
          >
            <span className="label-mono" style={{ fontSize: "0.72rem" }}>
              ◈ CYBERSECURITY TRAINING PLATFORM
            </span>
          </motion.div>

          <motion.h1
            className="heading-display"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ lineHeight: 0.9, marginBottom: "2rem" }}
          >
            TRAIN{" "}
            <span className="text-gradient-sweep" style={{ textShadow: "0 0 80px var(--accent-glow)" }}>
              LIKE
            </span>
            <br />
            AN OPERATOR
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "1.125rem", color: "var(--text-2)", lineHeight: 1.65,
              maxWidth: "520px", margin: "0 auto 2.75rem",
            }}
          >
            The cybersecurity platform that treats you like a professional from day one.
            Real terminals. Real labs. Real skills.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
            style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "3.5rem" }}
          >
            <MagneticButton className="btn btn-accent btn-lg" onClick={() => onGetStarted("register")}>
              Start Training Free <ArrowRight size={16} />
            </MagneticButton>
            <MagneticButton
              className="btn btn-outline btn-lg"
              onClick={() => scrollTo("#courses-preview", -80)}
            >
              Browse Courses
            </MagneticButton>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", justifyContent: "center" }}
          >
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{
                  fontSize: "1.5rem", fontWeight: 800,
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
          onClick={() => scrollTo("#features", -80)}
        >
          SCROLL
          <ChevronDown size={14} style={{ animation: "float-y 2s ease-in-out infinite" }} />
        </motion.div>
      </section>

      {/* ── Tech marquee ──────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "1.1rem 0",
        background: "rgba(255,255,255,0.012)",
      }}>
        <div className="marquee">
          {[0, 1].map(dup => (
            <div className="marquee__track" key={dup} aria-hidden={dup === 1}>
              {MARQUEE.map(item => (
                <span key={item} style={{
                  display: "inline-flex", alignItems: "center", gap: "0.6rem",
                  fontFamily: "var(--font-mono)", fontSize: "0.8rem",
                  color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em",
                  whiteSpace: "nowrap",
                }}>
                  <span style={{ color: "var(--accent)" }}>◈</span>{item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" style={{ padding: "6rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <Reveal from="scale">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div className="label-mono" style={{ marginBottom: "0.875rem" }}>◈ CAPABILITIES</div>
            <h2 className="heading-xl" style={{ marginBottom: "1rem" }}>Your Weapons</h2>
            <p style={{ color: "var(--text-2)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
              Everything you need to go from curious to dangerous.
            </p>
          </div>
        </Reveal>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}>
          {FEATURES.map((f, i) => (
            <Fragment key={f.title}><Reveal from={i % 2 === 0 ? "up" : "down"} delay={(i % 3) * 0.08}>
              <div style={{
                padding: "2rem",
                background: "var(--surface)",
                height: "100%",
                borderRight: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                transition: "background 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(200,204,210,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--surface)")}
              >
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: "var(--accent-dim)", border: "1px solid rgba(200,204,210,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--accent)", marginBottom: "1.125rem",
                }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9375rem" }}>{f.title}</div>
                <div style={{ color: "var(--text-2)", fontSize: "0.875rem", lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            </Reveal></Fragment>
          ))}
        </div>
      </section>

      {/* ── Course Preview ─────────────────────────────────────── */}
      <section id="courses-preview" style={{ padding: "6rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <Reveal from="left">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="label-mono" style={{ marginBottom: "0.875rem" }}>◈ TRAINING TRACKS</div>
              <h2 className="heading-xl">
                {COURSES.length} Courses.<br />
                <span style={{ color: "var(--text-2)", fontWeight: 400 }}>Zero fluff.</span>
              </h2>
            </div>
            <MagneticButton className="btn btn-outline" onClick={() => onGetStarted("register")}>
              View All Courses <ArrowRight size={14} />
            </MagneticButton>
          </div>
        </Reveal>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "0.875rem",
        }}>
          {COURSES.slice(0, 6).map((course, i) => (
            <Fragment key={course.id}><Reveal from="up" delay={(i % 3) * 0.08}>
              <div
                className="course-card"
                onClick={() => onGetStarted("register")}
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
            </Reveal></Fragment>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: "6rem 2rem 8rem", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <Reveal from="scale">
          <div className="label-mono" style={{ marginBottom: "1.25rem" }}>◈ READY TO OPERATE?</div>
          <h2 className="heading-xl" style={{ marginBottom: "1.25rem" }}>
            Zero prerequisites.
            <br />
            <span className="text-gradient-sweep">Infinite ceiling.</span>
          </h2>
          <p style={{ color: "var(--text-2)", marginBottom: "2.5rem", lineHeight: 1.65, fontSize: "1.0625rem" }}>
            Whether you've never touched a terminal or you're prepping for a red-team engagement —
            ARCH-X meets you where you are.
          </p>
          <MagneticButton className="btn btn-accent btn-lg" onClick={() => onGetStarted("register")} style={{ margin: "0 auto" }}>
            Create Free Account <ArrowRight size={16} />
          </MagneticButton>
        </Reveal>
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
