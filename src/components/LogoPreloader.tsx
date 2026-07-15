import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { playBootSequence } from "../lib/bootSound";

/**
 * ARCH-X — "Cyber Security System Initialization" entry sequence.
 *
 * A three-act boot narrative, each act a distinct metaphor for "the system is
 * coming online," fused into one continuous story instead of three separate
 * screens:
 *
 *   ACT I   TERMINAL BOOT     — a real-looking diagnostic log scrolls while
 *                               the kernel comes up in the dark.
 *   ACT II  SIGNATURE SCAN    — a radar sweep locks onto the ARCH-X mark,
 *                               sharpening across passes until "LOCKED".
 *   ACT III DECRYPT           — the locked mark is briefly corrupted
 *                               (RGB-split / static) then a visible
 *                               decryption stabilizes it into the clean,
 *                               final brand mark. Wordmark + bloom follow,
 *                               then the whole scene dissolves into the app.
 *
 * The shipped logo (public/ARCH-X LOGO.svg) is a flattened raster trace with
 * no separable layers, so "construction" here is expressed through motion
 * (blur/opacity/corruption/resolve) applied to the real asset rather than
 * hand-drawn stroke paths.
 *
 * Stack note: repo is Vite + React (not Next.js); Motion v12 `motion/react`
 * is the same API. Honors prefers-reduced-motion.
 */

// ── Timeline (ms from mount) ─────────────────────────────────────────
// 1 terminal  2 radar-emerge  3 radar-lock  4 decrypt  5 reveal  6 dissolve
const T = {
  boot: 0,
  radarEmerge: 14500,
  radarLock: 23000,
  decrypt: 37500,
  reveal: 45500,
  dissolve: 55000,
  done: 63000,
};

const LOGS = [
  "> INIT ARCH-X KERNEL v8.4.2",
  "> MOUNTING SECURE ENCLAVE... OK",
  "> ESTABLISHING ZERO-TRUST TUNNEL... CONNECTED",
  "> SCANNING FOR SIGNATURE...",
];

interface Props {
  onDone: () => void;
  /** When true, the boot SFX is skipped (user chose to enter without sound). */
  muted?: boolean;
}

export default function LogoPreloader({ onDone, muted = false }: Props) {
  const [phase, setPhase] = useState(1);
  const doneRef = useRef(false);
  const stopSoundRef = useRef<(() => void) | null>(null);

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopSoundRef.current?.();
    onDone();
  };

  useEffect(() => {
    if (reduce) {
      setPhase(5);
      const t = setTimeout(finish, 650);
      return () => clearTimeout(t);
    }
    if (!muted) stopSoundRef.current = playBootSequence();
    const timers = [
      setTimeout(() => setPhase(2), T.radarEmerge),
      setTimeout(() => setPhase(3), T.radarLock),
      setTimeout(() => setPhase(4), T.decrypt),
      setTimeout(() => setPhase(5), T.reveal),
      setTimeout(() => setPhase(6), T.dissolve),
      setTimeout(finish, T.done),
    ];
    return () => { timers.forEach(clearTimeout); stopSoundRef.current?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status =
    phase === 1 ? "System boot"
    : phase === 2 ? "Scanning signature"
    : phase === 3 ? "Signature locked"
    : phase === 4 ? "Decrypting core"
    : phase === 5 ? "ARCH-X system online"
    : "Entering";

  return (
    <AnimatePresence>
      <motion.div
        className="boot"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        onClick={finish}
        role="button"
        tabIndex={-1}
        aria-label="Skip intro"
      >
        <div className="boot__noise" />
        <div style={{ position: "fixed", top: 0, left: 0, color: "lime", fontSize: 24, zIndex: 99999, background: "black" }}>
          reduce={String(reduce)} phase={phase}
        </div>
        <BackgroundParticles active={phase < 6} />
        <RadarField active={phase >= 2 && phase < 6} locked={phase >= 3} />

        <motion.div
          className="boot__stage"
          animate={
            phase === 5 ? { scale: [0.98, 1.06, 1.03] }
            : phase === 6 ? { scale: 1.12, opacity: 0 }
            : { scale: 1 }
          }
          transition={{ duration: phase === 6 ? 0.7 : 0.6, ease: "easeOut" }}
        >
          {/* ACT I — terminal boot log, dark screen before the mark appears */}
          {phase === 1 && <TerminalLog />}

          {/* ACT II/III — the real mark: blurry -> locked -> corrupted -> resolved */}
          {phase >= 2 && phase < 6 && (
            <MarkStage phase={phase} />
          )}

          {/* Final bloom behind the resolved mark */}
          <AnimatePresence>
            {phase === 5 && (
              <motion.div
                className="boot__bloom"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: [0, 1, 0.7], scale: 1 }}
                transition={{ duration: 0.8 }}
              />
            )}
          </AnimatePresence>

          {/* dissolve shards break apart on exit */}
          {phase === 6 && <DissolveShards />}
        </motion.div>

        <motion.div
          className="boot__word"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 10 }}
          transition={{ duration: 0.5 }}
        >
          ARCH-X
        </motion.div>

        <div className="boot__status">
          <span className="dot" />
          <AnimatePresence mode="wait">
            <motion.span
              key={status}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {status}
            </motion.span>
          </AnimatePresence>
        </div>

        <motion.div
          className="boot__skip"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 2 && phase < 6 ? 0.6 : 0 }}
          transition={{ duration: 0.6 }}
        >
          Click or press Esc to skip
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── ACT I — terminal boot log ────────────────────────────────────────
function TerminalLog() {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    const timers = LOGS.map((_, i) =>
      setTimeout(() => setVisible(i + 1), 180 + i * 260)
    );
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div
      className="absolute font-mono text-[10px] sm:text-xs text-[var(--cyber)] tracking-wide opacity-80 text-left"
      style={{ left: "-4.5rem", bottom: "0.5rem", width: "min(320px, 78vw)" }}
    >
      {LOGS.slice(0, visible).map((log, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
        >
          {log}
        </motion.div>
      ))}
      {visible < LOGS.length && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          _
        </motion.span>
      )}
    </div>
  );
}

// ── ACT II + III — the mark: emerge -> lock -> corrupt -> resolve ────
function MarkStage({ phase }: { phase: number }) {
  const [hash, setHash] = useState("");
  useEffect(() => {
    if (phase !== 4) return;
    const t = setInterval(() => {
      setHash(
        Array.from({ length: 16 }, () =>
          Math.floor(Math.random() * 16).toString(16).toUpperCase()
        ).join("")
      );
    }, 50);
    return () => clearInterval(t);
  }, [phase]);

  const emerging = phase === 2;
  const locked = phase === 3;
  const corrupting = phase === 4;
  const resolved = phase === 5;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={
          corrupting
            ? { x: [-10, 15, -8, 12, -5, 5, 0], y: [5, -5, 8, -8, 2, -2, 0] }
            : { x: 0, y: 0 }
        }
        transition={{ repeat: corrupting ? Infinity : 0, duration: 0.1 }}
      >
        <motion.img
          className="boot__logo"
          src="/ARCH-X%20LOGO.svg"
          alt="ARCH-X"
          draggable={false}
          style={{ outline: "4px solid red", background: "rgba(255,0,0,0.3)" }}
          initial={{ opacity: 0.15, filter: "blur(14px) brightness(0.4) saturate(0%)", scale: 0.9 }}
          animate={{
            opacity: emerging ? 0.45 : locked ? 0.95 : corrupting ? 0.85 : 1,
            filter: emerging
              ? "blur(7px) brightness(0.6) saturate(40%)"
              : locked
                ? "blur(0px) brightness(1) saturate(100%) drop-shadow(0 0 18px rgba(56,230,255,0.55))"
                : corrupting
                  ? "saturate(0%) contrast(200%) brightness(1.1)"
                  : "blur(0px) brightness(1)",
            scale: resolved || locked ? 1 : 0.94,
          }}
          transition={{ duration: 0.5 }}
        />

        {/* RGB-split glitch layers, only during corruption */}
        {corrupting && (
          <>
            <motion.img
              src="/ARCH-X%20LOGO.svg"
              className="boot__logo"
              style={{ mixBlendMode: "screen", opacity: 0.8, filter: "drop-shadow(8px 0 0 rgba(255,0,0,0.8))" }}
              animate={{ x: [-15, 20] }}
              transition={{ repeat: Infinity, duration: 0.08, repeatType: "mirror" }}
            />
            <motion.img
              src="/ARCH-X%20LOGO.svg"
              className="boot__logo"
              style={{ mixBlendMode: "screen", opacity: 0.8, filter: "drop-shadow(-8px 0 0 rgba(0,255,255,0.8))" }}
              animate={{ x: [15, -20] }}
              transition={{ repeat: Infinity, duration: 0.12, repeatType: "mirror" }}
            />
          </>
        )}
      </motion.div>

      {/* target-lock brackets, from lock through resolve */}
      <AnimatePresence>
        {(locked || corrupting) && (
          <motion.div
            className="absolute inset-[-8%] pointer-events-none"
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: corrupting ? 0.45 : 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
          >
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2" style={{ borderColor: "var(--cyber)" }} />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2" style={{ borderColor: "var(--cyber)" }} />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2" style={{ borderColor: "var(--cyber)" }} />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2" style={{ borderColor: "var(--cyber)" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* decrypt readout, only during corruption */}
      {corrupting && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 whitespace-nowrap">
          <div className="font-mono text-[10px] tracking-[0.25em] text-[#f87171]">
            CORRUPTION DETECTED
          </div>
          <div className="font-mono text-[9px] text-gray-400 tracking-[0.2em] bg-black/40 px-2 py-0.5 border border-white/10">
            HASH: {hash}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ambient background: radar rings + sweep (runs through Acts I-III) ─
function RadarField({ active, locked }: { active: boolean; locked: boolean }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity: active ? 1 : 0, transition: "opacity 0.6s" }}
    >
      <div
        className="absolute opacity-[0.12]"
        style={{
          width: 900, height: 900, borderRadius: "50%",
          border: "1px solid var(--cyber)",
        }}
      />
      <div
        className="absolute opacity-20"
        style={{ width: 560, height: 560, borderRadius: "50%", border: "1px solid var(--cyber)" }}
      />
      <div
        className="absolute opacity-30"
        style={{ width: 300, height: 300, borderRadius: "50%", border: "1px solid var(--cyber)" }}
      />
      {!locked && (
        <motion.div
          className="absolute"
          style={{ width: 900, height: 900, borderRadius: "50%" }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        >
          <div
            className="absolute top-0 right-1/2 w-1/2 h-1/2 origin-bottom-right"
            style={{
              background:
                "conic-gradient(from 0deg at 100% 100%, transparent 0deg, rgba(56,230,255,0.05) 60deg, rgba(56,230,255,0.35) 90deg, var(--cyber) 90deg)",
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

/** PHASE 1 — glowing points appear, then drift. */
function BackgroundParticles({ active }: { active: boolean }) {
  const pts = useMemo(
    () => Array.from({ length: 46 }, (_, i) => ({
      left: `${(Math.sin(i * 12.9) * 0.5 + 0.5) * 100}%`,
      top:  `${(Math.cos(i * 7.7) * 0.5 + 0.5) * 100}%`,
      size: 1.5 + (i % 4) * 0.8,
      delay: (i % 10) * 0.12,
      dur: 2.2 + (i % 5) * 0.6,
    })), []);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {pts.map((p, i) => (
        <motion.span
          key={i}
          style={{
            position: "absolute", left: p.left, top: p.top,
            width: p.size, height: p.size, borderRadius: "50%",
            background: "var(--cyber)", boxShadow: "0 0 8px 1px var(--cyber-glow)",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={active
            ? { opacity: [0, 0.8, 0.2, 0.8], scale: 1, y: [0, -8, 0] }
            : { opacity: 0, scale: 0 }}
          transition={{ delay: p.delay, duration: p.dur, repeat: active ? Infinity : 0, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/** PHASE 6 — mark breaks into particles that fly outward (not a fade). */
function DissolveShards() {
  const shards = useMemo(
    () => Array.from({ length: 40 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2 + Math.sin(i) * 0.4;
      const dist = 120 + (i % 7) * 26;
      return { x: Math.cos(a) * dist, y: Math.sin(a) * dist, delay: (i % 6) * 0.03 };
    }), []);
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
      {shards.map((s, i) => (
        <motion.span
          key={i}
          className="boot__shard"
          style={{ gridArea: "1 / 1" }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: s.x, y: s.y, opacity: 0, scale: 0.3 }}
          transition={{ delay: s.delay, duration: 0.7, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
