import { cn } from "@/lib/utils";

export const REPORT_STAT_TONE = {
  brand: "border-brand/50 text-brand",
  cyan: "border-[var(--status-invited)]/50 text-[var(--status-invited)]",
  emerald: "border-[var(--status-active)]/50 text-[var(--status-active)]",
  amber: "border-[var(--status-pending)]/50 text-[var(--status-pending)]",
} as const;

export type TReportStatTone = keyof typeof REPORT_STAT_TONE;

/** Transparent pill with a coloured outline. Used in the reports table and on report cards. */
export function ReportStatChip({
  value,
  label,
  tone,
  size = "sm",
  className,
}: {
  value: string;
  label: string;
  tone: TReportStatTone;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap rounded-full border bg-transparent shadow-[0_6px_14px_-8px_rgba(0,0,0,0.6)]",
        size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
        REPORT_STAT_TONE[tone],
        className,
      )}
    >
      <span className="font-bold tabular-nums">{value}</span>
      <span className="text-text-muted">{label}</span>
    </span>
  );
}
