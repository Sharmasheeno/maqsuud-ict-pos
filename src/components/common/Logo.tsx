import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
}) => {
  const dimensions = {
    sm: { box: 34, title: 'text-sm', badge: 'text-[9px] px-1.5 py-0.5', sub: 'text-[7.5px]' },
    md: { box: 42, title: 'text-base', badge: 'text-[10px] px-1.5 py-0.5', sub: 'text-[8.5px]' },
    lg: { box: 54, title: 'text-xl', badge: 'text-xs px-2 py-0.5', sub: 'text-[10px]' },
    xl: { box: 72, title: 'text-2xl', badge: 'text-sm px-2.5 py-0.5', sub: 'text-xs' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* Isometric 3D Hexagonal Ribbon & Circuit-Trace Icon */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
        style={{ width: dimensions.box, height: dimensions.box }}
      >
        {/* Subtle Dual-Tone Ambient Glow */}
        <div className="absolute -inset-1 rounded-2xl bg-linear-to-br from-rose-500/20 via-emerald-500/20 to-lime-500/20 blur-md opacity-75 group-hover:opacity-100 transition-opacity" />

        <svg
          width={dimensions.box}
          height={dimensions.box}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-sm"
        >
          <defs>
            {/* Top-Left 3D Folded Crimson Ribbon Gradient */}
            <linearGradient id="maqsuudCrimsonTop" x1="10%" y1="10%" x2="80%" y2="60%">
              <stop offset="0%" stopColor="#ff1e27" />
              <stop offset="55%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <linearGradient id="maqsuudCrimsonFold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>

            {/* Bottom-Right 3D Folded Emerald-to-Lime Ribbon Gradient */}
            <linearGradient id="maqsuudEmeraldMain" x1="15%" y1="85%" x2="90%" y2="20%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="50%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#84cc16" />
            </linearGradient>
            <linearGradient id="maqsuudEmeraldFold" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Top-Left 3D Isometric Crimson Ribbon */}
          <path
            d="M16 58 L16 30 L50 10 L76 25 L63 33 L50 25 L30 37 L30 50 Z"
            fill="url(#maqsuudCrimsonTop)"
          />
          <path
            d="M16 30 L30 37 L30 66 L16 58 Z"
            fill="url(#maqsuudCrimsonFold)"
            opacity="0.92"
          />

          {/* Bottom-Right 3D Isometric Emerald-to-Lime Ribbon */}
          <path
            d="M84 42 L84 70 L50 90 L24 75 L37 67 L50 75 L70 63 L70 50 Z"
            fill="url(#maqsuudEmeraldMain)"
          />
          <path
            d="M84 42 L70 50 L70 63 L84 70 Z"
            fill="url(#maqsuudEmeraldFold)"
            opacity="0.88"
          />

          {/* Interlocking Central PCB Circuit Traces */}
          {/* Green Circuit Trace 1: Bottom-left to Top-Right */}
          <path
            d="M20 75 L46 60 L46 42 L68 29"
            stroke="url(#maqsuudEmeraldMain)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Green Circuit Trace 2: Parallel Bus */}
          <path
            d="M32 82 L56 68 L56 48 L74 37"
            stroke="#16a34a"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Crimson Circuit Trace: Center-left to Mid-Right */}
          <path
            d="M35 45 L48 37 L64 46"
            stroke="url(#maqsuudCrimsonTop)"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Glowing Circular PCB Terminal Nodes */}
          {/* Bottom-Left Green Node */}
          <circle cx="20" cy="75" r="5" fill="#16a34a" className="animate-pulse" />
          <circle cx="20" cy="75" r="2.2" fill="#ffffff" />

          {/* Lower-Left Secondary Green Node */}
          <circle cx="32" cy="82" r="4.2" fill="#84cc16" />
          <circle cx="32" cy="82" r="1.8" fill="#ffffff" />

          {/* Top-Right Green Node */}
          <circle cx="68" cy="29" r="4.8" fill="#84cc16" className="animate-pulse" />
          <circle cx="68" cy="29" r="2" fill="#ffffff" />

          {/* Mid-Right Secondary Green Node */}
          <circle cx="74" cy="37" r="4" fill="#16a34a" />
          <circle cx="74" cy="37" r="1.6" fill="#ffffff" />

          {/* Mid-Right Crimson Node */}
          <circle cx="64" cy="46" r="4.8" fill="#e11d48" className="animate-pulse" />
          <circle cx="64" cy="46" r="2" fill="#ffffff" />
        </svg>
      </div>

      {/* Typography Lockup */}
      {variant === 'full' && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-display font-extrabold tracking-tight text-slate-900 dark:text-white ${dimensions.title}`}
            >
              MAQSUUD
            </span>
            <span
              className={`font-display font-black uppercase tracking-wider rounded-md bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white shadow-xs shadow-emerald-600/30 border border-emerald-400/30 ${dimensions.badge}`}
            >
              ICT
            </span>
          </div>

          {/* Subtitle with Flanking Circuit-Line Dividers */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="h-[2px] w-3 rounded-full bg-linear-to-r from-[#e11d48] to-[#dc2626]" />
            <span
              className={`font-mono font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 ${dimensions.sub}`}
            >
              POS &amp; ERP SYSTEM
            </span>
            <span className="h-[2px] w-3 rounded-full bg-linear-to-r from-[#16a34a] to-[#84cc16]" />
          </div>
        </div>
      )}
    </div>
  );
};
