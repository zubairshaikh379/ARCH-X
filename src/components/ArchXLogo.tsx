import React from "react";

interface ArchXLogoProps {
  className?: string;
  size?: number;
}

export const ArchXLogo: React.FC<ArchXLogoProps> = ({ className = "text-zinc-100", size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      className={`${className} transition-transform duration-500 group-hover:scale-110`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circular dragon silhouette / wings / spikes */}
      <path
        d="M 50,5 C 75,5 95,25 95,50 C 95,75 75,95 50,95 C 28,95 10,80 6,58 C 5,53 8,48 13,48 C 17,48 20,51 21,55 C 23,69 35,80 50,80 C 66,80 80,66 80,50 C 80,34 66,20 50,20 C 45,20 40,21 35,24 C 33,25 31,24 30,22 C 29,20 30,17 32,16 C 37,13 43,11 50,11 Z"
        fill="currentColor"
        opacity="0.85"
      />
      
      {/* Stylized sharp dragon head on the left side */}
      <path
        d="M 28,34 C 23,30 16,30 10,34 C 7,36 5,39 6,43 C 7,46 10,48 13,46 C 15,45 15,44 14,42 C 16,40 20,40 23,42 L 18,45 C 16,46 16,49 18,50 L 25,46 C 27,45 28,42 27,39 C 29,38 31,39 32,41 C 33,43 32,46 30,48 L 33,51 C 36,48 37,43 35,39 C 33,35 30,34 28,34 Z"
        fill="currentColor"
      />

      {/* Spiky dragon horns pointing backwards/upwards */}
      <path
        d="M 26,30 L 33,18 L 30,28 L 39,21 L 34,31 L 44,27 L 37,34"
        fill="currentColor"
      />

      {/* Back scales and spikes on the main circle */}
      <path
        d="M 54,12 L 58,4 L 62,11 L 68,5 L 71,12 L 78,7 L 79,15 C 83,12 87,14 89,19 L 83,21"
        fill="currentColor"
      />

      {/* Tail spikes at the bottom ending in an arrow shape */}
      <path
        d="M 12,65 L 14,75 L 8,70 L 15,85 L 22,80 L 16,77 L 23,69 Z"
        fill="currentColor"
      />

      {/* Wing detail sweeping from top-right */}
      <path
        d="M 68,20 C 74,24 82,34 84,46 C 76,41 70,43 64,48 C 66,38 68,28 68,20 Z"
        fill="currentColor"
        opacity="0.9"
      />

      {/* Inner subtle tech-ring for aesthetic alignment */}
      <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" fill="none" opacity="0.35" />
    </svg>
  );
};
