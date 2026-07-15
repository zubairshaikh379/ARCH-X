import { useEffect, useRef, useCallback } from "react";
import Lenis from "lenis";

/**
 * Smooth-scroll for a single full-page view (the landing page).
 * Mounts Lenis on the window scroller and tears it down on unmount, so it
 * never hijacks the in-app scroll containers (terminal, course lists, etc.).
 * Returns a `scrollTo(target)` for anchor buttons.
 */
export function useLenis(enabled = true) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;
    // Respect reduced-motion — skip smoothing entirely.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    lenisRef.current = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  const scrollTo = useCallback((target: string | HTMLElement, offset = 0) => {
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(target, { offset });
    else if (typeof target === "string") {
      document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return { scrollTo };
}
