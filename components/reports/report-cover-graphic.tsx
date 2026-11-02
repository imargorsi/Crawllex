"use client";

/**
 * Animated cover for a report card: a mini report page with bars rising and a trend line drawing.
 * Pure SVG + CSS keyframes (see app/globals.css), so no animation library is needed.
 * Motion is limited to motion-safe, so reduced-motion users see the static graphic.
 */
const BARS = [
  { x: 14, height: 34, delay: 0.1 },
  { x: 36, height: 52, delay: 0.25 },
  { x: 58, height: 40, delay: 0.4 },
  { x: 80, height: 66, delay: 0.55 },
  { x: 102, height: 48, delay: 0.7 },
  { x: 124, height: 74, delay: 0.85 },
] as const;

const BASE_Y = 96;

export function ReportCoverGraphic() {
  return (
    <svg
      viewBox="0 0 220 120"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="report-bar-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--status-invited)" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="report-line-stroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--status-invited)" />
          <stop offset="100%" stopColor="var(--brand)" />
        </linearGradient>
      </defs>

      <g opacity="0.18" stroke="var(--border)" strokeWidth="0.6">
        {[24, 48, 72, 96].map((y) => (
          <line key={y} x1="0" x2="220" y1={y} y2={y} />
        ))}
      </g>

      {BARS.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={BASE_Y - bar.height}
          width="12"
          height={bar.height}
          rx="3"
          fill="url(#report-bar-fill)"
          className="motion-safe:animate-[report-bar-rise_1.1s_cubic-bezier(.2,.8,.2,1)_both]"
          style={{ transformOrigin: `${bar.x + 6}px ${BASE_Y}px`, animationDelay: `${bar.delay}s` }}
        />
      ))}

      <path
        d="M10 80 C 40 60, 60 70, 84 50 S 130 30, 152 40 S 190 18, 210 14"
        fill="none"
        stroke="url(#report-line-stroke)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="320"
        strokeDashoffset="0"
        className="motion-safe:animate-[report-line-draw_1.8s_ease-out_0.4s_both]"
      />

      {[
        { cx: 84, cy: 50, delay: 1.2 },
        { cx: 152, cy: 40, delay: 1.4 },
        { cx: 210, cy: 14, delay: 1.6 },
      ].map((dot) => (
        <circle
          key={dot.cx}
          cx={dot.cx}
          cy={dot.cy}
          r="3.2"
          fill="var(--status-invited)"
          className="motion-safe:animate-[report-float_3.6s_ease-in-out_infinite]"
          style={{ animationDelay: `${dot.delay}s` }}
        />
      ))}
    </svg>
  );
}
