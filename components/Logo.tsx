
import React from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  // Added optional onClick prop to handle interactions (e.g., navigating to home)
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ className = "h-24", showTagline = false, onClick }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`} onClick={onClick}>
      <svg viewBox="0 0 1000 1000" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Top Crimson Bowtie/T Shape */}
        <path d="M272.5 130V328L500 220L272.5 130Z" fill="#b11e31" />
        <path d="M727.5 130V328L500 220L727.5 130Z" fill="#b11e31" />
        <path d="M272.5 130L727.5 328H715L272.5 130Z" fill="#b11e31" />
        <path d="M727.5 130L272.5 328H285L727.5 130Z" fill="#b11e31" />

        {/* Central Blue Building Pillar */}
        <path d="M495 275L395 590H495V275Z" fill="#00599f" />
        <path d="M505 275L605 590H505V275Z" fill="#004a85" />
        <rect x="375" y="595" width="250" height="10" fill="#00599f" />

        {/* Brand Text */}
        <text x="500" y="740" textAnchor="middle" fontFamily="'Inter', sans-serif" fontWeight="500" fontSize="120" fill="#00599f">Ram Infosys</text>
        
        {/* Horizontal Divider Line */}
        <line x1="120" y1="785" x2="880" y2="785" stroke="#94a3b8" strokeWidth="2" />

        {/* Tagline */}
        <text x="500" y="860" textAnchor="middle" fontFamily="'Inter', sans-serif" fontStyle="italic" fontWeight="300" fontSize="64" fill="#00599f">Infinite Possibilities</text>
      </svg>
    </div>
  );
};

export default Logo;
