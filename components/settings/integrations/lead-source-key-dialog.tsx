"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/input";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { DialogSectionDivider } from "@/components/ui/dialog-section-divider";
import { notify } from "@/lib/frontend/feedback/notify";
import { fieldStartIcons } from "@/lib/frontend/forms/input-start-icons";
import { dialogSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { overlayClass } from "@/lib/frontend/theme/chrome-tones";
import { cn } from "@/lib/utils";

type TLeadSourceKeyDialogProps = {
  open: boolean;
  plaintextKey: string;
  onOpenChange: (open: boolean) => void;
};

export function LeadSourceKeyDialog({
  open,
  plaintextKey,
  onOpenChange,
}: TLeadSourceKeyDialogProps) {
  const { t } = useTranslation("translation", { keyPrefix: "settings.integrations.wordpress" });
  const titleId = useId();
  const descriptionId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(plaintextKey);
      notify.success(t("keyCopied"));
      return;
    } catch {
      // Fall through to execCommand for non-secure contexts.
    }

    try {
      const input = inputRef.current;
      if (!input) throw new Error("missing input");
      input.focus();
      input.select();
      const copied = document.execCommand("copy");
      if (!copied) throw new Error("copy failed");
      notify.success(t("keyCopied"));
    } catch {
      notify.error(t("copyError"));
    }
  }

  if (!mounted || !open || !plaintextKey) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div className={cn("absolute inset-0 backdrop-blur-[2px]", overlayClass)} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl",
          dialogSurfaceClass,
          "border-2 border-text-muted/45",
        )}
      >
        <header className="type-stack-md shrink-0 px-5 pb-5 pt-5 sm:px-6">
          <Heading sectionTitle id={titleId}>
            {t("keyDialogTitle")}
          </Heading>
          <p id={descriptionId} className="type-caption text-text-muted">
            {t("keyDialogLead")}
          </p>
        </header>

        <div className="px-5 pb-1 sm:px-6">
          <Input
            ref={inputRef}
            id="lead-source-plaintext-key"
            name="lead-source-key"
            label={t("keyLabel")}
            value={plaintextKey}
            readOnly
            autoComplete="off"
            spellCheck={false}
            startIcon={fieldStartIcons.lock}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>

        <DialogSectionDivider />
        <footer className="flex shrink-0 flex-col-reverse gap-2.5 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
          <Button type="button" variant="outlined" size="lg" onClick={() => void copyKey()}>
            {t("copyKey")}
          </Button>
          <Button type="button" variant="outlined" size="lg" onClick={() => onOpenChange(false)}>
            {t("done")}
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
