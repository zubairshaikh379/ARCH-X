import { useRef } from "react";
import type { ReactNode, CSSProperties, MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  /** How far the button drifts toward the cursor (px at edge). */
  strength?: number;
}

/**
 * Button that magnetically pulls toward the cursor while hovered, then springs
 * back on leave. Fine-pointer only — touch/coarse devices get a plain button so
 * nothing feels stuck. Respects prefers-reduced-motion (no drift).
 */
export default function MagneticButton({
  children,
  onClick,
  className = "",
  style,
  strength = 18,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  const canMagnet = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!ref.current || !canMagnet()) return;
    const r = ref.current.getBoundingClientRect();
    const relX = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const relY = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      className={className}
      style={{ ...style, x: sx, y: sy }}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.button>
  );
}
