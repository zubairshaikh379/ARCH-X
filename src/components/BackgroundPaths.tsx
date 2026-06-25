import React, { useMemo } from "react";

export const BackgroundPaths: React.FC = () => {
  // Pre-defined bezier coordinates that scale elegantly across viewports.
  const paths = useMemo(() => {
    return [
      {
        d: "M -50,450 C 300,200 600,800 1100,500 T 1500,750",
        stroke: "rgba(255, 255, 255, 0.07)",
        strokeWidth: 2,
        duration: "18s",
        delay: "0s"
      },
      {
        d: "M -50,550 C 400,350 500,850 1000,450 T 1500,850",
        stroke: "rgba(255, 255, 255, 0.04)",
        strokeWidth: 1.5,
        duration: "24s",
        delay: "-4s"
      },
      {
        d: "M -50,350 C 200,600 700,300 1100,700 T 1500,650",
        stroke: "rgba(255, 255, 255, 0.05)",
        strokeWidth: 2.5,
        duration: "20s",
        delay: "-8s"
      },
      {
        d: "M -50,650 C 350,750 800,400 1200,800 T 1500,950",
        stroke: "rgba(255, 255, 255, 0.03)",
        strokeWidth: 1,
        duration: "28s",
        delay: "-12s"
      },
      {
        d: "M -50,400 C 500,500 600,200 1200,600 T 1500,550",
        stroke: "rgba(255, 255, 255, 0.05)",
        strokeWidth: 1.8,
        duration: "22s",
        delay: "-2s"
      },
      // Glow/Tracer paths
      {
        d: "M -50,480 C 300,250 650,750 1050,480 T 1500,780",
        stroke: "rgba(255, 255, 255, 0.12)",
        strokeWidth: 2.5,
        glow: true,
        duration: "15s",
        delay: "-6s"
      },
      {
        d: "M -50,580 C 450,400 550,800 1050,500 T 1500,820",
        stroke: "rgba(255, 255, 255, 0.1)",
        strokeWidth: 2,
        glow: true,
        duration: "22s",
        delay: "-14s"
      }
    ];
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <svg
        className="w-full h-full opacity-60"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.02)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
          </linearGradient>
          <filter id="blur-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {paths.map((p, idx) => (
          <g key={idx}>
            {/* Base static ambient path */}
            <path
              d={p.d}
              stroke={p.stroke}
              strokeWidth={p.strokeWidth}
              strokeLinecap="round"
            />
            
            {/* Animated glowing tracer flowing along path */}
            <path
              d={p.d}
              stroke={p.glow ? "url(#glow-grad)" : "rgba(255, 255, 255, 0.12)"}
              strokeWidth={p.strokeWidth + (p.glow ? 1.5 : 0.5)}
              strokeLinecap="round"
              strokeDasharray={p.glow ? "120 400" : "80 300"}
              filter={p.glow ? "url(#blur-glow)" : undefined}
              style={{
                animation: `dash-sweep ${p.duration} linear infinite`,
                animationDelay: p.delay,
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
