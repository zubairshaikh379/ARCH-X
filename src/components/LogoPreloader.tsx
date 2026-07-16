"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

// ── Vector helpers ─────────────────────────────────────────────────────────
class Vector2D {
  constructor(public x: number, public y: number) {}
  static random(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
class Vector3D {
  constructor(public x: number, public y: number, public z: number) {}
}

// ── Star ───────────────────────────────────────────────────────────────────
class Star {
  private dx: number;
  private dy: number;
  private spiralLocation: number;
  private strokeWeightFactor: number;
  private z: number;
  private angle: number;
  private distance: number;
  private rotationDirection: number;
  private expansionRate: number;
  private finalScale: number;

  constructor(cameraZ: number, cameraTravelDistance: number) {
    this.angle = Math.random() * Math.PI * 2;
    this.distance = 30 * Math.random() + 15;
    this.rotationDirection = Math.random() > 0.5 ? 1 : -1;
    this.expansionRate = 1.2 + Math.random() * 0.8;
    this.finalScale = 0.7 + Math.random() * 0.6;
    this.dx = this.distance * Math.cos(this.angle);
    this.dy = this.distance * Math.sin(this.angle);
    this.spiralLocation = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3;
    this.z = Vector2D.random(0.5 * cameraZ, cameraTravelDistance + cameraZ);
    const lerp = (s: number, e: number, t: number) => s * (1 - t) + e * t;
    this.z = lerp(this.z, cameraTravelDistance / 2, 0.3 * this.spiralLocation);
    this.strokeWeightFactor = Math.pow(Math.random(), 2.0);
  }

  render(p: number, c: AnimationController) {
    const spiralPos = c.spiralPath(this.spiralLocation);
    const q = p - this.spiralLocation;
    if (q <= 0) return;

    const dp = c.constrain(4 * q, 0, 1);
    const le = dp;
    const ee = c.easeOutElastic(dp);
    const pe = Math.pow(dp, 2);

    let easing: number;
    if (dp < 0.3) easing = c.lerp(le, pe, dp / 0.3);
    else if (dp < 0.7) easing = c.lerp(pe, ee, (dp - 0.3) / 0.4);
    else easing = ee;
    void easing;

    let screenX: number, screenY: number;
    if (dp < 0.3) {
      const t = dp / 0.3;
      screenX = c.lerp(spiralPos.x, spiralPos.x + this.dx * 0.3, t);
      screenY = c.lerp(spiralPos.y, spiralPos.y + this.dy * 0.3, t);
    } else if (dp < 0.7) {
      const t = (dp - 0.3) / 0.4;
      const cs = Math.sin(t * Math.PI) * this.rotationDirection * 1.5;
      const bx = spiralPos.x + this.dx * 0.3, by = spiralPos.y + this.dy * 0.3;
      const tx = spiralPos.x + this.dx * 0.7, ty = spiralPos.y + this.dy * 0.7;
      screenX = c.lerp(bx, tx, t) + (-this.dy * 0.4 * cs) * t;
      screenY = c.lerp(by, ty, t) + (this.dx * 0.4 * cs) * t;
    } else {
      const t = (dp - 0.7) / 0.3;
      const bx = spiralPos.x + this.dx * 0.7, by = spiralPos.y + this.dy * 0.7;
      const td = this.distance * this.expansionRate * 1.5;
      const sa = this.angle + 1.2 * this.rotationDirection * t * Math.PI;
      screenX = c.lerp(bx, spiralPos.x + td * Math.cos(sa), t);
      screenY = c.lerp(by, spiralPos.y + td * Math.sin(sa), t);
    }

    const vx = (this.z - (c as any)._cameraZ) * screenX / (c as any)._viewZoom;
    const vy = (this.z - (c as any)._cameraZ) * screenY / (c as any)._viewZoom;

    let sm = 1.0;
    if (dp < 0.6) sm = 1.0 + dp * 0.2;
    else { const t = (dp - 0.6) / 0.4; sm = 1.2 * (1 - t) + this.finalScale * t; }

    c.showProjectedDot(new Vector3D(vx, vy, this.z), 8.5 * this.strokeWeightFactor * sm);
  }
}

// ── AnimationController ────────────────────────────────────────────────────
class AnimationController {
  private timeline: gsap.core.Timeline;
  public time = 0;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private size: number;
  private stars: Star[] = [];

  readonly _cameraZ = -400;
  readonly _cameraTravelDistance = 3400;
  readonly _viewZoom = 100;
  private readonly _startDotYOffset = 28;
  private readonly _changeEventTime = 0.32;
  private readonly _numberOfStars = 5000;
  private readonly _trailLength = 80;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, dpr: number, size: number) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.size = size;
    this.timeline = gsap.timeline({ repeat: -1 });

    const orig = Math.random;
    let seed = 1234;
    Math.random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < this._numberOfStars; i++)
      this.stars.push(new Star(this._cameraZ, this._cameraTravelDistance));
    Math.random = orig;

    void dpr;
    this.timeline.to(this, { time: 1, duration: 15, repeat: -1, ease: "none", onUpdate: () => this.render() });
  }

  ease(p: number, g: number) {
    return p < 0.5 ? 0.5 * Math.pow(2 * p, g) : 1 - 0.5 * Math.pow(2 * (1 - p), g);
  }
  easeOutElastic(x: number) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * (2 * Math.PI) / 4.5) + 1;
  }
  map(v: number, s1: number, e1: number, s2: number, e2: number) {
    return s2 + (e2 - s2) * ((v - s1) / (e1 - s1));
  }
  constrain(v: number, mn: number, mx: number) { return Math.min(Math.max(v, mn), mx); }
  lerp(s: number, e: number, t: number) { return s * (1 - t) + e * t; }

  spiralPath(p: number): Vector2D {
    p = this.constrain(1.2 * p, 0, 1);
    p = this.ease(p, 1.8);
    const turns = 6;
    const theta = 2 * Math.PI * turns * Math.sqrt(p);
    const r = 170 * Math.sqrt(p);
    return new Vector2D(r * Math.cos(theta), r * Math.sin(theta) + this._startDotYOffset);
  }

  showProjectedDot(pos: Vector3D, sf: number) {
    const t2 = this.constrain(this.map(this.time, this._changeEventTime, 1, 0, 1), 0, 1);
    const camZ = this._cameraZ + this.ease(Math.pow(t2, 1.2), 1.8) * this._cameraTravelDistance;
    if (pos.z > camZ) {
      const d = pos.z - camZ;
      const x = this._viewZoom * pos.x / d;
      const y = this._viewZoom * pos.y / d;
      const sw = 400 * sf / d;
      this.ctx.lineWidth = sw;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawTrail(t1: number) {
    for (let i = 0; i < this._trailLength; i++) {
      const f = this.map(i, 0, this._trailLength, 1.1, 0.1);
      const sw = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f;
      this.ctx.fillStyle = "white";
      this.ctx.lineWidth = sw;
      const pt = t1 - 0.00015 * i;
      const pos = this.spiralPath(pt);
      const off = new Vector2D(pos.x + 5, pos.y + 5);
      const mid = new Vector2D((pos.x + off.x) / 2, (pos.y + off.y) / 2);
      const dx = pos.x - mid.x, dy = pos.y - mid.y;
      const angle = Math.atan2(dy, dx);
      const o = i % 2 === 0 ? -1 : 1;
      const rr = Math.sqrt(dx * dx + dy * dy);
      const ep = this.easeOutElastic(Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5);
      const rx = mid.x + rr * Math.cos(angle + o * Math.PI * ep);
      const ry = mid.y + rr * Math.sin(angle + o * Math.PI * ep);
      this.ctx.beginPath();
      this.ctx.arc(rx, ry, sw / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  render() {
    const ctx = this.ctx;
    const bg = ctx.createRadialGradient(this.size / 2, this.size * 0.46, 0, this.size / 2, this.size * 0.46, this.size * 0.88);
    bg.addColorStop(0, "#07080f");
    bg.addColorStop(0.58, "#040509");
    bg.addColorStop(1, "#010103");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.size, this.size);
    ctx.save();
    ctx.translate(this.size / 2, this.size / 2);
    const t1 = this.constrain(this.map(this.time, 0, this._changeEventTime + 0.25, 0, 1), 0, 1);
    const t2 = this.constrain(this.map(this.time, this._changeEventTime, 1, 0, 1), 0, 1);
    ctx.rotate(-Math.PI * this.ease(t2, 2.7));
    this.drawTrail(t1);
    ctx.fillStyle = "white";
    for (const s of this.stars) s.render(t1, this);
    if (this.time > this._changeEventTime) {
      const dy = this._cameraZ * this._startDotYOffset / this._viewZoom;
      this.showProjectedDot(new Vector3D(0, dy, this._cameraTravelDistance), 2.5);
    }
    ctx.restore();
  }

  destroy() { this.timeline.kill(); }
}

// ── Component ──────────────────────────────────────────────────────────────
interface Props {
  onDone: () => void;
  muted?: boolean;
}

export default function LogoPreloader({ onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctrlRef  = useRef<AnimationController | null>(null);
  const doneRef  = useRef(false);
  const [ready,   setReady]   = useState(false);
  const [exiting, setExiting] = useState(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setExiting(true);
    setTimeout(onDone, 800);
  };

  // canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr  = window.devicePixelRatio || 1;
    const w    = window.innerWidth;
    const h    = window.innerHeight;
    const size = Math.max(w, h);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctrlRef.current = new AnimationController(canvas, ctx, dpr, size);
    setTimeout(() => setReady(true), 400);
    return () => { ctrlRef.current?.destroy(); ctrlRef.current = null; };
  }, []);

  // auto-exit after 5.5 s
  useEffect(() => {
    const t = setTimeout(finish, 5500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // esc to skip
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "radial-gradient(125% 125% at 50% 46%, #07080f 0%, #040509 58%, #010103 100%)",
        overflow: "hidden", cursor: "pointer",
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      onClick={finish}
      role="button"
      tabIndex={-1}
      aria-label="Skip intro"
    >
      {/* spiral canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* ARCH-X — centred exactly over the spiral, fades in with the animation */}
      <AnimatePresence>
        {ready && (
          <motion.div
            key="center-text"
            style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
              gap: "0.6rem",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            {/* main wordmark — sits in the eye of the spiral */}
            <motion.div
              style={{
                fontFamily: "'Courier New', 'Courier', monospace",
                fontWeight: 700,
                fontSize: "clamp(1.6rem, 5vw, 2.8rem)",
                letterSpacing: "0.45em",
                textIndent: "0.45em",
                color: "#e2e8f0",
                textShadow: "0 0 40px rgba(148,163,184,0.5), 0 0 80px rgba(148,163,184,0.2)",
                userSelect: "none",
              }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.0, delay: 0.2, ease: "easeOut" }}
            >
              ARCH-X
            </motion.div>

            {/* subtitle */}
            <motion.div
              style={{
                fontFamily: "'Courier New', 'Courier', monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "#94a3b8",
                userSelect: "none",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Initializing Cyber Range
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* skip hint */}
      <motion.div
        style={{
          position: "absolute", bottom: "1.8rem", left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'Courier New', monospace",
          fontSize: "0.5rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#475569",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        Click or press Esc to skip
      </motion.div>
    </motion.div>
  );
}
