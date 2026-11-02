"use client";

/**
 * Animated report cover: isometric cube field drifts behind a floating "report page" whose bars
 * rise and whose trend line draws itself. Pure SVG + CSS keyframes (app/globals.css), so no
 * animation library is needed. Motion is limited to motion-safe.
 */
const BARS = [
  { x: 24, height: 38, delay: 0.15 },
  { x: 48, height: 56, delay: 0.3 },
  { x: 72, height: 44, delay: 0.45 },
  { x: 96, height: 72, delay: 0.6 },
  { x: 120, height: 58, delay: 0.75 },
  { x: 144, height: 86, delay: 0.9 },
] as const;

const PAGE_X = 50;
const PAGE_Y = 20;
const BASE_Y = 126;

export function ReportCoverGraphic() {
  return (
    <svg
      viewBox="0 0 300 165"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="report-cover-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-dark)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
        <linearGradient id="report-bar-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--status-invited)" />
          <stop offset="100%" stopColor="var(--brand)" />
        </linearGradient>
        <linearGradient id="report-line-stroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--status-invited)" />
        </linearGradient>
        <filter id="report-page-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      <rect width="300" height="165" fill="url(#report-cover-bg)" />

      <image
        href="/report-assets/cover-art.svg"
        x="160"
        y="-20"
        width="170"
        height="170"
        preserveAspectRatio="xMidYMid meet"
        opacity="0.28"
        className="motion-safe:animate-[report-cover-drift_12s_ease-in-out_infinite]"
      />

      <g className="motion-safe:animate-[report-float_6s_ease-in-out_infinite]">
        <rect
          x={PAGE_X}
          y={PAGE_Y}
          width="200"
          height="128"
          rx="14"
          fill="#ffffff"
          fillOpacity="0.96"
          filter="url(#report-page-shadow)"
        />
        <rect x={PAGE_X + 14} y={PAGE_Y + 14} width="46" height="6" rx="3" fill="var(--brand)" />
        <rect x={PAGE_X + 14} y={PAGE_Y + 26} width="78" height="4" rx="2" fill="#c9d1e6" />
        <circle cx={PAGE_X + 176} cy={PAGE_Y + 17} r="5" fill="var(--status-invited)" />

        <g opacity="0.18" stroke="#1f2138" strokeWidth="0.6">
          {[62, 80, 98].map((y) => (
            <line key={y} x1={PAGE_X + 14} x2={PAGE_X + 186} y1={y} y2={y} />
          ))}
        </g>

        {BARS.map((bar) => (
          <rect
            key={bar.x}
            x={PAGE_X + bar.x - 6}
            y={BASE_Y - bar.height}
            width="12"
            height={bar.height}
            rx="3"
            fill="url(#report-bar-fill)"
            className="motion-safe:animate-[report-bar-rise_1.1s_cubic-bezier(.2,.8,.2,1)_both]"
            style={{ transformOrigin: `${PAGE_X + bar.x}px ${BASE_Y}px`, animationDelay: `${bar.delay}s` }}
          />
        ))}

        <path
          d={`M${PAGE_X + 18} 100 C ${PAGE_X + 50} 84, ${PAGE_X + 66} 92, ${PAGE_X + 92} 74 S ${PAGE_X + 140} 56, ${PAGE_X + 160} 62 S ${PAGE_X + 186} 40, ${PAGE_X + 190} 36`}
          fill="none"
          stroke="url(#report-line-stroke)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="320"
          strokeDashoffset="0"
          className="motion-safe:animate-[report-line-draw_1.8s_ease-out_0.5s_both]"
        />
      </g>
    </svg>
  );
}
