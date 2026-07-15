import { useEffect, useRef } from "react";

/**
 * Fixed full-bleed galaxy backdrop: parallax layers of twinkling stars plus periodic
 * shooting stars. Canvas-2D, no assets. Respects prefers-reduced-motion (static field,
 * no twinkle, no shooting stars). Sits behind the hero (z-index: 0 via .starfield).
 */
export default function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    interface Star { x: number; y: number; r: number; base: number; tw: number; depth: number; }
    interface Shot { x: number; y: number; vx: number; vy: number; life: number; len: number; }

    let stars: Star[] = [];
    let shots: Shot[] = [];
    let w = 0, h = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const build = () => {
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(240, Math.floor((w * h) / 7000));
      stars = Array.from({ length: count }, () => {
        const depth = rand(0.3, 1);
        return {
          x: Math.random() * w, y: Math.random() * h,
          r: rand(0.4, 1.5) * depth,
          base: rand(0.25, 0.9),
          tw: rand(0, Math.PI * 2),
          depth,
        };
      });
    };
    build();

    let rafId = 0;
    let last = 0;
    let nextShot = rand(1200, 3600);

    const frame = (ts: number) => {
      rafId = requestAnimationFrame(frame);
      const dt = last ? ts - last : 16;
      last = ts;

      ctx.clearRect(0, 0, w, h);

      // stars
      for (const s of stars) {
        let a = s.base;
        if (!reduced) { s.tw += 0.02 * s.depth; a = s.base * (0.6 + 0.4 * Math.sin(s.tw)); }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,224,232,${a.toFixed(3)})`;
        ctx.fill();
      }

      if (!reduced) {
        // spawn shooting stars on a random timer
        nextShot -= dt;
        if (nextShot <= 0) {
          nextShot = rand(2600, 6500);
          const fromLeft = Math.random() > 0.5;
          const speed = rand(0.4, 0.75);
          shots.push({
            x: fromLeft ? rand(0, w * 0.4) : rand(w * 0.6, w),
            y: rand(0, h * 0.5),
            vx: (fromLeft ? 1 : -1) * speed * rand(0.7, 1),
            vy: speed * rand(0.5, 0.9),
            life: 1,
            len: rand(80, 180),
          });
        }
        // draw + advance shooting stars
        shots = shots.filter((sh) => sh.life > 0);
        for (const sh of shots) {
          sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.life -= dt / 900;
          const tx = sh.x - sh.vx * sh.len, ty = sh.y - sh.vy * sh.len;
          const g = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
          const a = Math.max(0, sh.life);
          g.addColorStop(0, `rgba(235,238,245,${(0.9 * a).toFixed(3)})`);
          g.addColorStop(1, "rgba(235,238,245,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
      }
    };
    rafId = requestAnimationFrame(frame);

    const onResize = () => build();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
