import type { FC } from "react";

interface ArchXLogoProps {
  className?: string;
  size?: number;
}

/**
 * Brand mark. Renders the real metallic ARCH-X emblem from public/ARCH-X LOGO.svg
 * (served at /ARCH-X LOGO.svg). The SVG carries its own chrome/graphite colors, so
 * there's no currentColor tint — `className` is kept only for layout/opacity hooks.
 */
export const ArchXLogo: FC<ArchXLogoProps> = ({ className = "", size = 36 }) => {
  return (
    <img
      src="/ARCH-X%20LOGO.svg"
      width={size}
      height={size}
      alt="ARCH-X"
      draggable={false}
      className={`${className} transition-transform duration-500 group-hover:scale-110`}
      style={{ objectFit: "contain", display: "block", userSelect: "none" }}
    />
  );
};
