import { useEffect, useRef } from "react";

/**
 * Starfield backdrop — twinkling white-grey stars that visually continue
 * the spiral-particle aesthetic of the preloader, so the transition feels
 * like one continuous space scene. A very faint cyan nebula haze echoes
 * the globe's atmosphere without competing with it.
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
    const STAR_COUNT = 260;
    interface Star {
      x: number; y: number; r: number;
      base: number; phase: number; speed: number;
      hue: "white" | "silver" | "cyan";
    }
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
          // larger accent stars are rarer
          r: roll > 0.96 ? 1.5 + Math.random() * 1.0 : 0.4 + Math.random() * 0.85,
          base: 0.18 + Math.random() * 0.52,
          phase: Math.random() * Math.PI * 2,
          speed: 0.35 + Math.random() * 0.75,
          // ~88% white/silver (matches spiral particles), ~12% very soft cyan
          hue: roll > 0.88 ? "cyan" : roll > 0.55 ? "white" : "silver",
        };
      });
    };
    seed();

    let raf = 0;
    let t = 0;
    const draw = () => {
      if (!reduced) raf = requestAnimationFrame(draw);
      t += reduced ? 0 : 0.011;
      ctx.clearRect(0, 0, w, h);

      // Faint nebula — very soft cyan drift top-left, matches globe atmosphere hue
      const nx = w * 0.3 + Math.sin(t * 0.14) * w * 0.04;
      const ny = h * 0.25 + Math.cos(t * 0.1) * h * 0.03;
      const g1 = ctx.createRadialGradient(nx, ny, 0, nx, ny, Math.max(w, h) * 0.38);
      g1.addColorStop(0, "rgba(56,230,255,0.055)");
      g1.addColorStop(1, "rgba(56,230,255,0)");
      ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h);

      // Very subtle silver haze bottom-right — depth without colour clash
      const sx = w * 0.74 - Math.sin(t * 0.12) * w * 0.04;
      const sy = h * 0.65 - Math.cos(t * 0.09) * h * 0.04;
      const g2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * 0.32);
      g2.addColorStop(0, "rgba(180,190,210,0.04)");
      g2.addColorStop(1, "rgba(180,190,210,0)");
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);

      // Stars
      for (const s of stars) {
        const tw = reduced ? s.base : s.base + Math.sin(t * s.speed + s.phase) * 0.25;
        const alpha = Math.max(0, Math.min(1, tw));
        const color =
          s.hue === "cyan"   ? "56,230,255" :
          s.hue === "silver" ? "180,188,200" :
                               "220,225,235";
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color},${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        // tiny cross-flare on the few larger stars
        if (s.r > 1.4) {
          ctx.strokeStyle = `rgba(${color},${alpha * 0.28})`;
          ctx.lineWidth = 0.5;
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
