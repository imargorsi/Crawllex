"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Icons } from "@/lib/frontend/icons/app-icons";
import { dialogSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { overlayStrongClass } from "@/lib/frontend/theme/chrome-tones";
import { cn } from "@/lib/utils";

/** Centred dialog that matches the app's frosted dialog surface. Closes on Escape and backdrop click. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <div className={cn("fixed inset-0 z-50 backdrop-blur-[2px]", overlayStrongClass)} aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[min(100%-1.5rem,48rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl p-6 outline-none sm:p-7",
          dialogSurfaceClass,
          className,
        )}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <Icons.cancel className="size-4" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    </>,
    document.body,
  );
}
