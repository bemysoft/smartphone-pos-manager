import React from "react";

interface NexusPosLogoProps {
  className?: string;
  size?: number;
}

export const NexusPosLogo: React.FC<NexusPosLogoProps> = ({ className = "h-7 w-7", size = 28 }) => {
  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="nexusGrad1" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="nexusGradGlow" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.25" />
          </linearGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Squircle Container */}
        <rect
          x="1.5"
          y="1.5"
          width="33"
          height="33"
          rx="10"
          fill="url(#nexusGradGlow)"
          stroke="url(#nexusGrad1)"
          strokeWidth="1.5"
        />

        {/* Futuristic Interlocking Geometric 'N' & Tech Connection Nodes */}
        <path
          d="M10 26V10L26 26V10"
          stroke="url(#nexusGrad1)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glowEffect)"
        />

        {/* Glowing Connected Nodes */}
        <circle cx="10" cy="10" r="2.2" fill="#38BDF8" />
        <circle cx="26" cy="26" r="2.2" fill="#10B981" />
        <circle cx="18" cy="18" r="2.5" fill="#818CF8" />

        {/* Subtle Accent Dots */}
        <circle cx="10" cy="26" r="1.5" fill="#0EA5E9" opacity="0.8" />
        <circle cx="26" cy="10" r="1.5" fill="#34D399" opacity="0.8" />
      </svg>
    </div>
  );
};

export default NexusPosLogo;
