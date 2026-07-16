import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArchXLogo } from "./ArchXLogo";
import { ArrowRight } from "lucide-react";

interface FloatingMenuProps {
  onGetStarted: (mode?: "login" | "register") => void;
  onNavigate: (selector: string) => void;
}

const LINKS: { label: string; sel: string }[] = [
  { label: "Capabilities", sel: "#features" },
  { label: "Courses", sel: "#courses-preview" },
];

/** Floating pill nav that appears once the hero is scrolled past. */
export default function FloatingMenu({ onGetStarted, onNavigate }: FloatingMenuProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed", top: "1rem", left: "50%", transform: "translateX(-50%)",
            zIndex: 120, display: "flex", alignItems: "center", gap: "0.25rem",
            padding: "0.4rem 0.4rem 0.4rem 0.9rem", borderRadius: "999px",
            background: "rgba(10,10,22,0.72)", backdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <button
            onClick={() => onNavigate("#top")}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", paddingRight: "0.5rem" }}
          >
            <ArchXLogo size={20} />
            <span style={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: "-0.02em", color: "var(--text-1)" }}>ARCH-X</span>
          </button>

          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)", margin: "0 0.35rem" }} />

          {LINKS.map(l => (
            <button
              key={l.sel}
              onClick={() => onNavigate(l.sel)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-2)", fontSize: "0.8rem", fontWeight: 500,
                padding: "0.4rem 0.7rem", borderRadius: "999px", transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-1)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-2)")}
            >
              {l.label}
            </button>
          ))}

          <button
            onClick={() => onGetStarted("login")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-2)", fontSize: "0.8rem", fontWeight: 500,
              padding: "0.4rem 0.7rem", borderRadius: "999px", transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-1)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-2)")}
          >
            Log In
          </button>
          <button className="btn btn-accent btn-sm" onClick={() => onGetStarted("register")} style={{ borderRadius: "999px", marginLeft: "0.15rem" }}>
            Sign Up <ArrowRight size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
