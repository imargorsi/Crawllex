"use client";

import type { TFunction } from "i18next";

import type { TSummaryBullet, TSummaryTone } from "@/lib/lens/seo-summary";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

const TONE_ICON: Record<TSummaryTone, { icon: typeof Icons.alert; className: string }> = {
  attention: { icon: Icons.alert, className: "text-destructive" },
  info: { icon: Icons.bulb, className: "text-brand" },
  good: { icon: Icons.checkCircle, className: "text-success" },
};

/** Rule-based summary: one bullet per finding, with tone icon. Text is translated from the bullet key. */
export function LensSeoSummary({ bullets, heading, t, className }: {
  bullets: TSummaryBullet[];
  heading: string;
  t: TFunction<"translation", "lens">;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-border p-4 dark:border-text-primary/40", className)}>
      <h3 className="text-sm font-semibold text-text-primary">{heading}</h3>
      <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {bullets.map((bullet, index) => {
          const { icon: Icon, className } = TONE_ICON[bullet.tone];
          return (
            <li key={`${bullet.key}-${index}`} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary">
              <Icon className={cn("mt-0.5 size-4 shrink-0", className)} aria-hidden />
              <span>{t(bullet.key, bullet.vars)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
