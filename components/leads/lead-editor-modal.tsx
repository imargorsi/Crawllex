"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/input";
import { Button } from "@/components/ui/button";
import { DialogSectionDivider } from "@/components/ui/dialog-section-divider";
import { fieldStartIcons } from "@/lib/frontend/forms/input-start-icons";
import {
  emptyLeadEditorValues,
  leadToEditorValues,
  type TLeadEditorValues,
} from "@/lib/frontend/leads/editor.utils";
import { dialogSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { overlayClass } from "@/lib/frontend/theme/chrome-tones";
import {
  LEAD_EMAIL_MAX_LENGTH,
  LEAD_MESSAGE_MAX_LENGTH,
  LEAD_NAME_MAX_LENGTH,
  LEAD_PHONE_MAX_LENGTH,
} from "@/lib/leads/constants";
import { leadExtrasForDisplay } from "@/lib/leads/extras.utils";
import { isValidLeadDate, isValidLeadEmail, normalizeLeadPhone } from "@/lib/leads/normalize";
import type { TLeadDto } from "@/types/lead.types";
import { cn } from "@/lib/utils";

export type TLeadEditorTarget =
  | { mode: "create" }
  | { mode: "edit"; lead: TLeadDto };

type TLeadEditorModalProps = {
  open: boolean;
  target: TLeadEditorTarget;
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    mode: "create" | "edit";
    values: TLeadEditorValues;
    leadId?: string;
  }) => Promise<void>;
};

export function LeadEditorModal({ open, target, onOpenChange, onSave }: TLeadEditorModalProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.leads.editor" });
  const titleId = useId();
  const descriptionId = useId();
  const isEdit = target.mode === "edit";
  const extrasEntries =
    target.mode === "edit" ? leadExtrasForDisplay(target.lead, t("fields.services")) : [];
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TLeadEditorValues>({
    defaultValues: emptyLeadEditorValues(),
    mode: "onSubmit",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (target.mode === "edit") {
      reset(leadToEditorValues(target.lead));
      return;
    }
    reset(emptyLeadEditorValues());
  }, [open, reset, target]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  async function onSubmit(values: TLeadEditorValues) {
    await onSave({
      mode: target.mode,
      values,
      leadId: target.mode === "edit" ? target.lead.id : undefined,
    });
    onOpenChange(false);
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={t("close")}
        className={cn("absolute inset-0 backdrop-blur-[2px]", overlayClass)}
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "relative z-10 flex max-h-[min(92vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl",
          dialogSurfaceClass,
          "border-2 border-text-muted/45",
        )}
      >
        <header className="relative type-stack-md shrink-0 px-5 pb-5 pt-5 sm:px-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute inset-e-3 top-3 rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <Icons.cancel className="size-4" aria-hidden />
            <span className="sr-only">{t("close")}</span>
          </button>
          <h2 id={titleId} className="type-title pe-10 text-text-primary">
            {isEdit ? t("editTitle") : t("createTitle")}
          </h2>
          <p id={descriptionId} className="type-caption pe-10 text-text-muted">
            {isEdit ? t("editLead") : t("createLead")}
          </p>
        </header>
        <DialogSectionDivider />

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="themed-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <Input
              id="lead-date"
              type="date"
              label={t("fields.leadDate")}
              required
              error={errors.leadDate?.message}
              {...register("leadDate", {
                required: t("validation.required"),
                validate: (value) => isValidLeadDate(value) || t("validation.date"),
              })}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="lead-first-name"
                label={t("fields.firstName")}
                placeholder={t("fields.firstNamePh")}
                required
                maxLength={LEAD_NAME_MAX_LENGTH}
                startIcon={fieldStartIcons.person}
                error={errors.firstName?.message}
                {...register("firstName", {
                  required: t("validation.required"),
                  maxLength: { value: LEAD_NAME_MAX_LENGTH, message: t("validation.maxName") },
                })}
              />
              <Input
                id="lead-last-name"
                label={t("fields.lastName")}
                placeholder={t("fields.lastNamePh")}
                maxLength={LEAD_NAME_MAX_LENGTH}
                startIcon={fieldStartIcons.person}
                error={errors.lastName?.message}
                {...register("lastName", {
                  maxLength: { value: LEAD_NAME_MAX_LENGTH, message: t("validation.maxName") },
                })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="lead-email"
                type="email"
                label={t("fields.email")}
                placeholder={t("fields.emailPh")}
                required
                maxLength={LEAD_EMAIL_MAX_LENGTH}
                error={errors.email?.message}
                {...register("email", {
                  required: t("validation.required"),
                  validate: (value) => isValidLeadEmail(value) || t("validation.email"),
                })}
              />
              <Input
                id="lead-phone"
                label={t("fields.phone")}
                placeholder={t("fields.phonePh")}
                required
                maxLength={LEAD_PHONE_MAX_LENGTH}
                startIcon={fieldStartIcons.phone}
                error={errors.phone?.message}
                {...register("phone", {
                  required: t("validation.required"),
                  validate: (value) =>
                    normalizeLeadPhone(value).length >= 7 || t("validation.phone"),
                })}
              />
            </div>

            <Input
              id="lead-message"
              type="textarea"
              rows={2}
              label={t("fields.message")}
              placeholder={t("fields.messagePh")}
              required
              maxLength={LEAD_MESSAGE_MAX_LENGTH}
              error={errors.message?.message}
              {...register("message", {
                required: t("validation.required"),
                maxLength: {
                  value: LEAD_MESSAGE_MAX_LENGTH,
                  message: t("validation.maxMessage"),
                },
              })}
            />

            {extrasEntries.length > 0 ? (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="type-stack-md">
                  <p className="type-label text-text-primary">{t("extrasTitle")}</p>
                  <p className="type-caption text-text-muted">{t("extrasHint")}</p>
                </div>
                {extrasEntries.map(([key, value]) => (
                  <Input
                    key={key}
                    id={`lead-extra-${key}`}
                    label={key}
                    value={value}
                    startIcon={fieldStartIcons.text}
                    readOnly
                    disabled
                  />
                ))}
              </div>
            ) : null}
          </div>

          <DialogSectionDivider />
          <footer className="flex shrink-0 flex-col-reverse gap-2.5 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
            <Button
              type="button"
              variant="outlined"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="w-full sm:min-w-28 sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="outlined"
              size="lg"
              disabled={isSubmitting}
              className="w-full sm:min-w-28 sm:w-auto"
            >
              {isEdit ? t("save") : t("submit")}
            </Button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
}
