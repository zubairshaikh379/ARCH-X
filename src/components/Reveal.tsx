import { useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import { motion, useInView } from "motion/react";

type Direction = "up" | "down" | "left" | "right" | "scale" | "none";

interface RevealProps {
  children: ReactNode;
  /** Entry direction / style. Default "up". */
  from?: Direction;
  delay?: number;
  /** Travel distance in px (ignored for scale/none). Default 32. */
  distance?: number;
  /** Add a slight de-blur on entry for a filmic feel. Default true. */
  blur?: boolean;
  className?: string;
  style?: CSSProperties;
}

const OFFSETS: Record<Direction, { x?: number; y?: number; scale?: number }> = {
  up:    { y: 1 },
  down:  { y: -1 },
  left:  { x: 1 },
  right: { x: -1 },
  scale: { scale: 0.92 },
  none:  {},
};

/**
 * Scroll-reveal wrapper with directional variants + optional de-blur.
 * Fail-safe: forces visible after 1.2s so content never gets stuck hidden
 * (clipped ancestor, fast scroll, screenshot bots, misfiring observer).
 */
export default function Reveal({
  children,
  from = "up",
  delay = 0,
  distance = 32,
  blur = true,
  className,
  style,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const [forceShow, setForceShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceShow(true), 1200);
    return () => clearTimeout(t);
  }, []);
  const show = inView || forceShow;

  const o = OFFSETS[from];
  const hidden = {
    opacity: 0,
    x: (o.x ?? 0) * distance,
    y: (o.y ?? 0) * distance,
    scale: o.scale ?? 1,
    filter: blur ? "blur(6px)" : "blur(0px)",
  };
  const shown = { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={hidden}
      animate={show ? shown : hidden}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
