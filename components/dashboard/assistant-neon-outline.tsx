"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

type TAssistantNeonOutlineProps = {
  /** Match Tailwind rounded-2xl (16) or rounded-3xl (24). */
  radius?: number;
  className?: string;
};

const STROKE = 1.5;
/** Pull the stroke in so rounded corners stay inside the card. */
const INSET = 2;

/**
 * Neon rim via SVG stroke only — cannot paint the transparent glass fill.
 */
export function AssistantNeonOutline({
  radius = 16,
  className,
}: TAssistantNeonOutlineProps) {
  const gradId = `assistant-neon-${useId().replace(/:/g, "")}`;
  const cornerRadius = Math.max(0, radius - INSET);

  return (
    <svg
      aria-hidden
      overflow="visible"
      className={cn(
        "pointer-events-none absolute inset-0 z-10 size-full overflow-visible motion-reduce:hidden",
        className,
      )}
    >
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="objectBoundingBox"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.95" />
          <stop offset="50%" stopColor="var(--gradient-mid)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0.95" />
          <animateTransform
            attributeName="gradientTransform"
            type="rotate"
            from="0 0.5 0.5"
            to="360 0.5 0.5"
            dur="14s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      <rect
        x={INSET}
        y={INSET}
        rx={cornerRadius}
        ry={cornerRadius}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{
          width: `calc(100% - ${INSET * 2}px)`,
          height: `calc(100% - ${INSET * 2}px)`,
        }}
      />
    </svg>
  );
}
