import { useEffect, useRef } from "react";

/**
 * Lightweight galaxy/starfield backdrop for the hero — twinkling stars plus a
 * faint nebula haze in the brand's cyan/purple range. Pure canvas 2D (cheap,
 * no WebGL context contention with HeroScene), fixed behind everything.
 * Respects prefers-reduced-motion by freezing twinkle/drift.
 */
export default function Starfield({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0, h = 0;
    const STAR_COUNT = 220;
    interface Star { x: number; y: number; r: number; base: number; phase: number; speed: number; hue: "cyan" | "white" | "purple"; }
    let stars: Star[] = [];

    const seed = () => {
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      stars = Array.from({ length: STAR_COUNT }, () => {
        const roll = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: roll > 0.94 ? 1.6 + Math.random() * 1.2 : 0.5 + Math.random() * 1,
          base: 0.25 + Math.random() * 0.55,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.8,
          hue: roll > 0.93 ? "cyan" : roll > 0.88 ? "purple" : "white",
        };
      });
    };
    seed();

    let raf = 0;
    let t = 0;
    const draw = () => {
      if (!reduced) raf = requestAnimationFrame(draw);
      t += reduced ? 0 : 0.012;
      ctx.clearRect(0, 0, w, h);

      // Nebula haze — two soft radial blooms, cyan + purple, drifting slowly.
      const nx = w * 0.32 + Math.sin(t * 0.15) * w * 0.04;
      const ny = h * 0.28 + Math.cos(t * 0.11) * h * 0.03;
      const g1 = ctx.createRadialGradient(nx, ny, 0, nx, ny, Math.max(w, h) * 0.42);
      g1.addColorStop(0, "rgba(56,230,255,0.10)");
      g1.addColorStop(1, "rgba(56,230,255,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const px = w * 0.72 - Math.sin(t * 0.13) * w * 0.05;
      const py = h * 0.62 - Math.cos(t * 0.1) * h * 0.04;
      const g2 = ctx.createRadialGradient(px, py, 0, px, py, Math.max(w, h) * 0.38);
      g2.addColorStop(0, "rgba(139,92,246,0.08)");
      g2.addColorStop(1, "rgba(139,92,246,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Stars — twinkle via sine, tiny cyan cross-flare on the bright ones.
      for (const s of stars) {
        const tw = reduced ? s.base : s.base + Math.sin(t * s.speed + s.phase) * 0.28;
        const alpha = Math.max(0, Math.min(1, tw));
        const color = s.hue === "cyan" ? "56,230,255" : s.hue === "purple" ? "180,150,255" : "255,255,255";
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color},${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.5) {
          ctx.strokeStyle = `rgba(${color},${alpha * 0.35})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(s.x - s.r * 3, s.y); ctx.lineTo(s.x + s.r * 3, s.y);
          ctx.moveTo(s.x, s.y - s.r * 3); ctx.lineTo(s.x, s.y + s.r * 3);
          ctx.stroke();
        }
      }
    };
    draw();

    const onResize = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); seed(); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden
    />
  );
}
