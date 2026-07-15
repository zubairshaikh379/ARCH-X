import { useEffect, useRef } from "react";

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, .course-card, .stat-card, .nav-item, .tab-btn';

/**
 * Flowing custom cursor: a precise dot + a lagging ring that grows over
 * interactive elements. Only active on fine (mouse) pointers — touch devices
 * keep their native behaviour and render nothing.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    document.body.classList.add("has-custom-cursor");

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;   // target (mouse)
    let rx = mx, ry = my;                                          // ring (lerped)
    let visible = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (!visible) { visible = true; dot.style.opacity = "1"; ring.style.opacity = "1"; }
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      const hit = (e.target as Element)?.closest?.(INTERACTIVE);
      ring.classList.toggle("is-hover", !!hit);
    };
    const onLeave = () => { visible = false; dot.style.opacity = "0"; ring.style.opacity = "0"; };
    const onDown = () => ring.style.setProperty("scale", "0.85");
    const onUp = () => ring.style.setProperty("scale", "1");

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.body.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" style={{ opacity: 0 }} />
      <div ref={dotRef} className="cursor-dot" style={{ opacity: 0 }} />
    </>
  );
}
