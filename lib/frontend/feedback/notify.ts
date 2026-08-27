"use client";

import { toast, type TGlassToastOptions } from "@tarmiz/web-glass-toast";

import { formatFeedbackText } from "@/lib/frontend/feedback/format";
import type { FeedbackMessage } from "@/lib/frontend/feedback/types";

const DEFAULT_OPTIONS: TGlassToastOptions = {
  position: "bottom-right",
  duration: 5000,
  /** Auto-dismiss only — no manual close control. */
  dismissible: false,
};

function showToast({ variant, message }: FeedbackMessage, options: TGlassToastOptions = {}) {
  const title = formatFeedbackText(message);
  const merged: TGlassToastOptions = { ...DEFAULT_OPTIONS, ...options };

  switch (variant) {
    case "success":
      return toast.success(title, merged);
    case "error":
      return toast.error(title, merged);
    case "warning":
      return toast.warning(title, merged);
    case "info":
      return toast.info(title, merged);
  }
}

export const notify = {
  success: (message: string, options?: TGlassToastOptions) =>
    showToast({ variant: "success", message }, options),
  error: (message: string, options?: TGlassToastOptions) =>
    showToast({ variant: "error", message }, options),
  warning: (message: string, options?: TGlassToastOptions) =>
    showToast({ variant: "warning", message }, options),
  info: (message: string, options?: TGlassToastOptions) =>
    showToast({ variant: "info", message }, options),
  show: (message: FeedbackMessage, options?: TGlassToastOptions) => showToast(message, options),
  dismiss: (id?: string) => toast.dismiss(id),
};
