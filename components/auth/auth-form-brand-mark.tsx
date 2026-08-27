"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

type AuthFormBrandMarkProps = {
  className?: string;
  priority?: boolean;
};

/**
 * Unified Crawllex mark for every auth card — outline frame only, no fill.
 */
export function AuthFormBrandMark({ className, priority = false }: AuthFormBrandMarkProps) {
  const { t } = useTranslation("translation", { keyPrefix: "layout" });

  return (
    <div className={cn("flex justify-center", className)}>
      <span
        className={cn(
          "inline-flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-transparent",
          "dark:border-text-primary/45",
        )}
      >
        <Image
          src="/favicon.png"
          alt={t("appName")}
          width={36}
          height={36}
          priority={priority}
          className="size-9 object-contain"
        />
      </span>
    </div>
  );
}
