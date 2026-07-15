import type { CSSProperties } from "react";

/**
 * Hand-authored ARCH-X emblem geometry — a stylized dragon coiled inside the
 * hex/arch/X framework. The shipped logo asset is a 364-path raster trace that
 * can't be stroke-animated, so this clean vector version is what the preloader
 * draws AND what stands in for the logo on the standby gate (one consistent,
 * on-brand mark everywhere, no clashing chrome render).
 *
 * Canvas: 340×340, centered at (170,170). Dragon faces left, body coils
 * clockwise down the right and sweeps into an arrow-tipped tail — echoing the
 * real emblem's composition.
 */

// ── Geometric framework ──────────────────────────────────────────────
const C = 170;
const hexPts = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 180) * (60 * i - 90);
  return [C + 150 * Math.cos(a), C + 150 * Math.sin(a)];
});
export const HEX_PATH =
  "M" + hexPts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L") + " Z";
export const HEX_POINTS = hexPts;

export const ARCH_PATH = "M112 236 L112 158 A58 58 0 0 1 228 158 L228 236";
export const X_PATH = "M140 152 L200 212 M200 152 L140 212";

// ── Dragon (drawn in reveal order) ───────────────────────────────────
export const DRAGON = {
  // Neck + body coiling clockwise around the right side.
  body: "M150 138 C210 122 262 144 278 196 C289 236 266 280 216 292 C177 301 136 289 116 258",
  // Head outline, facing left (snout at the left, back of skull at right).
  head: "M58 148 L86 135 L112 129 L146 126 L150 150 L150 160 L130 172 L100 174 L72 167 Z",
  // Two swept-back horns + a cheek frill.
  horns: "M140 127 C150 100 174 82 204 70 M150 132 C170 122 194 116 220 114 M134 133 C139 147 139 147 132 159",
  // Spine spikes riding the upper body curve.
  spikes: "M176 123 L184 107 L191 124 M206 122 L215 107 L222 125 M240 137 L251 125 L256 143 M269 171 L283 166 L272 183",
  // Tail curling up off the coil…
  tail: "M116 258 C102 250 96 234 104 219",
  // …into an arrowhead (two barbs).
  arrow: "M104 219 L91 231 M104 219 L117 230",
  // Mouth gape line across the snout.
  mouth: "M60 150 L96 154 L128 151",
  // Lower-jaw teeth.
  teeth: "M86 166 L90 174 L94 166 M102 170 L106 178 L110 170 M118 171 L122 179 L126 171",
  // Chin beard spikes.
  beard: "M74 165 L66 181 M88 171 L85 188",
  // Angular eye slit + its ignition point.
  eyeSlit: "M100 142 L118 146 L102 149",
  eye: { cx: 109, cy: 145 },
};

/**
 * Static, non-animated emblem for the standby gate. Renders the dragon inside
 * the hex frame in faint cyber-cyan so it reads as "system idle".
 */
export function DragonMark({ className = "" }: { className?: string }) {
  const s = (extra: CSSProperties = {}): CSSProperties => ({
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...extra,
  });
  return (
    <svg className={className} viewBox="0 0 340 340" aria-label="ARCH-X">
      <path d={HEX_PATH} style={s({ stroke: "rgba(56,230,255,0.35)", strokeWidth: 2 })} />
      <path d={DRAGON.body}   style={s({ stroke: "rgba(56,230,255,0.8)", strokeWidth: 2.4 })} />
      <path d={DRAGON.head}   style={s({ stroke: "rgba(56,230,255,0.9)", strokeWidth: 2 })} />
      <path d={DRAGON.horns}  style={s({ stroke: "rgba(56,230,255,0.8)", strokeWidth: 2 })} />
      <path d={DRAGON.spikes} style={s({ stroke: "rgba(56,230,255,0.7)", strokeWidth: 1.8 })} />
      <path d={DRAGON.tail}   style={s({ stroke: "rgba(56,230,255,0.8)", strokeWidth: 2.2 })} />
      <path d={DRAGON.arrow}  style={s({ stroke: "rgba(56,230,255,0.8)", strokeWidth: 2.2 })} />
      <path d={DRAGON.teeth}  style={s({ stroke: "rgba(56,230,255,0.6)", strokeWidth: 1.5 })} />
      <path d={DRAGON.beard}  style={s({ stroke: "rgba(56,230,255,0.6)", strokeWidth: 1.5 })} />
      <path d={DRAGON.mouth}  style={s({ stroke: "rgba(56,230,255,0.7)", strokeWidth: 1.5 })} />
      <path d={DRAGON.eyeSlit} style={s({ stroke: "#eaf9ff", strokeWidth: 1.5 })} />
      <circle cx={DRAGON.eye.cx} cy={DRAGON.eye.cy} r={2.4} fill="#eaf9ff" />
    </svg>
  );
}
