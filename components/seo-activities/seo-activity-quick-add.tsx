"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogSectionDivider } from "@/components/ui/dialog-section-divider";
import { parseGoogleDocId } from "@/lib/seo-activities/google-doc-url";
import { fieldStartIcons } from "@/lib/frontend/forms/input-start-icons";
import { SEO_ACTIVITY_TYPE_OPTIONS } from "@/lib/frontend/seo-activities/constants";
import { isValidIsoDate } from "@/lib/frontend/seo-activities/date-range.utils";
import {
  activityToQuickAddValues,
  emptyQuickAddValues,
  type TSeoActivityQuickAddValues,
} from "@/lib/frontend/seo-activities/quick-add.utils";
import { sanitizeHttpUrl } from "@/lib/frontend/seo-activities/sanitize-url.utils";
import { dialogSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { overlayClass } from "@/lib/frontend/theme/chrome-tones";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/display-name";
import type {
  TSeoActivityBacklink,
  TSeoActivityBlog,
  TSeoActivityType,
  TSeoActivityTechnicalWork,
} from "@/types/seo-activity.types";
import { cn } from "@/lib/utils";

export type TSeoActivityEditorTarget = {
  mode: "create" | "edit";
  type: TSeoActivityType;
  row?: TSeoActivityBlog | TSeoActivityBacklink | TSeoActivityTechnicalWork;
};

type TSeoActivityQuickAddProps = {
  open: boolean;
  /** True only when the project has a connected WordPress site with stored credentials. */
  canPushToWordpress: boolean;
  target: TSeoActivityEditorTarget;
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    mode: "create" | "edit";
    type: TSeoActivityType;
    values: TSeoActivityQuickAddValues;
    activityId?: string;
  }) => Promise<void>;
};

export function SeoActivityQuickAdd({
  open,
  canPushToWordpress,
  target,
  onOpenChange,
  onSave,
}: TSeoActivityQuickAddProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.seoActivities.quickAdd" });
  const titleId = useId();
  const descriptionId = useId();
  const isEdit = target.mode === "edit";
  const [type, setType] = useState<TSeoActivityType>(target.type);
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TSeoActivityQuickAddValues>({
    defaultValues: emptyQuickAddValues(),
    mode: "onSubmit",
  });

  const pushSelected = useWatch({ control, name: "pushToWordpress" });
  const pushOn = type === "blogs" && !isEdit && canPushToWordpress && Boolean(pushSelected);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setType(target.type);
    if (target.mode === "edit" && target.row) {
      reset(activityToQuickAddValues(target.type, target.row));
      return;
    }
    reset(emptyQuickAddValues());
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

  function onTypeChange(next: TSeoActivityType) {
    if (isEdit) return;
    setType(next);
    reset(emptyQuickAddValues());
  }

  async function onSubmit(values: TSeoActivityQuickAddValues) {
    await onSave({
      mode: target.mode,
      type,
      values,
      activityId: isEdit ? target.row?.id : undefined,
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
        <header className="relative flex shrink-0 flex-col gap-4 px-5 pb-5 pt-5 sm:px-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute inset-e-3 top-3 rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <Icons.cancel className="size-4" aria-hidden />
            <span className="sr-only">{t("close")}</span>
          </button>

          <div className="flex flex-col gap-1.5 pe-10">
            <h2 id={titleId} className="type-title text-text-primary">
              {isEdit ? t("editTitle") : t("title")}
            </h2>
            <p id={descriptionId} className="type-caption text-text-muted">
              {isEdit ? t("editLead") : t("lead")}
            </p>
          </div>

          <div
            className="inline-flex w-full max-w-full flex-wrap items-center gap-1 rounded-xl border border-border bg-bg-input p-1"
            role="tablist"
            aria-label={t("tabsAriaLabel")}
          >
            {SEO_ACTIVITY_TYPE_OPTIONS.map((option) => {
              const isActive = type === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  disabled={isEdit && !isActive}
                  onClick={() => onTypeChange(option)}
                  className={cn(
                    "min-w-0 flex-1 rounded-lg px-3 py-2 type-label transition-colors",
                    isActive
                      ? "bg-brand text-text-on-brand shadow-xs"
                      : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                    isEdit && !isActive && "pointer-events-none opacity-40",
                  )}
                >
                  {t(`tabs.${option}`)}
                </button>
              );
            })}
          </div>
        </header>
        <DialogSectionDivider />

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            {type === "blogs" ? (
              <Input
                id="seo-quick-add-title"
                label={t("fields.title")}
                placeholder={t("fields.titlePh")}
                required
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                startIcon={fieldStartIcons.document}
                error={errors.title?.message}
                {...register("title", {
                  required: t("validation.required"),
                  minLength: { value: 3, message: t("validation.minTitle") },
                  maxLength: { value: DISPLAY_NAME_MAX_LENGTH, message: t("validation.maxTitle") },
                })}
              />
            ) : null}

            {type === "backlinks" ? (
              <Input
                id="seo-quick-add-anchor"
                label={t("fields.anchorText")}
                placeholder={t("fields.anchorTextPh")}
                required
                startIcon={fieldStartIcons.text}
                error={errors.anchorText?.message}
                {...register("anchorText", {
                  required: t("validation.required"),
                  minLength: { value: 2, message: t("validation.minAnchor") },
                })}
              />
            ) : null}

            {type === "technical_work" ? (
              <Input
                id="seo-quick-add-details"
                type="textarea"
                rows={3}
                label={t("fields.details")}
                placeholder={t("fields.detailsPh")}
                required
                error={errors.details?.message}
                {...register("details", {
                  required: t("validation.required"),
                  minLength: { value: 4, message: t("validation.minDetails") },
                })}
              />
            ) : null}

            {type === "blogs" && !isEdit && canPushToWordpress ? (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <Checkbox {...register("pushToWordpress")} />
                <span className="type-label text-text-primary">{t("fields.pushToWordpress")}</span>
              </label>
            ) : null}

            {/* Always registered so the rules stay current; hidden while a WordPress push is selected. */}
            <div className={pushOn ? "hidden" : undefined}>
              <Input
                id="seo-quick-add-url"
                type="url"
                label={t("fields.url")}
                placeholder={t("fields.urlPh")}
                required={!pushOn}
                error={errors.url?.message}
                {...register("url", {
                  required: pushOn ? false : t("validation.required"),
                  validate: (value) =>
                    pushOn || Boolean(sanitizeHttpUrl(value)) || t("validation.url"),
                })}
              />
            </div>

            <div className={pushOn ? undefined : "hidden"}>
              <Input
                id="seo-quick-add-doc-url"
                type="url"
                label={t("fields.docUrl")}
                placeholder={t("fields.docUrlPh")}
                required={pushOn}
                error={errors.docUrl?.message}
                {...register("docUrl", {
                  validate: (value) =>
                    !pushOn || Boolean(parseGoogleDocId(value)) || t("validation.docUrl"),
                })}
              />
            </div>

            <Input
              id="seo-quick-add-date"
              type="date"
              label={t("fields.occurredOn")}
              required
              error={errors.occurredOn?.message}
              {...register("occurredOn", {
                required: t("validation.required"),
                validate: (value) => isValidIsoDate(value) || t("validation.date"),
              })}
            />
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
