"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { RichTextEditor } from "@/components/reports/rich-text-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCreateReportMutation, type TCreateReportPayload } from "@/features/reports/reports.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { notify } from "@/lib/frontend/feedback/notify";
import { buildMonthOptions, defaultMonthValue, monthValueToPeriod } from "@/lib/frontend/reports/period-options";
import { isRichDocEmpty, REPORT_WRITTEN_KEYS, type TReportWrittenKey, type TRichDoc } from "@/lib/reports/rich-text";
import type { TReportDetailDto } from "@/types/reports.types";

type TReportCreateSheetProps = {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (report: TReportDetailDto) => void;
};

type TWrittenState = Record<TReportWrittenKey, TRichDoc | null>;

const EMPTY_WRITTEN: TWrittenState = { executiveSummary: null, search: null, traffic: null, leads: null, work: null };

/** The optional sections, in the order they appear in the report. */
const WRITTEN_FIELDS: TReportWrittenKey[] = [...REPORT_WRITTEN_KEYS];

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

export function ReportCreateSheet({ projectId, open, onOpenChange, onCreated }: TReportCreateSheetProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.reports" });
  const monthOptions = useMemo(
    () =>
      buildMonthOptions(24).map((option) => ({
        value: option.value,
        label: monthFormatter.format(new Date(Date.UTC(option.year, option.month - 1, 1))),
      })),
    [],
  );
  const [month, setMonth] = useState(defaultMonthValue());
  const [written, setWritten] = useState<TWrittenState>(EMPTY_WRITTEN);
  const [nextSteps, setNextSteps] = useState<TRichDoc | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [nextStepsError, setNextStepsError] = useState<string | null>(null);
  const createMutation = useCreateReportMutation(projectId);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setFormError(null);
      setNextStepsError(null);
    }
    onOpenChange(nextOpen);
  }

  function setSection(key: TReportWrittenKey, doc: TRichDoc) {
    setWritten((current) => ({ ...current, [key]: doc }));
  }

  async function submit() {
    const period = monthValueToPeriod(month);
    if (!period || !projectId) {
      setFormError(t("invalidPeriod"));
      return;
    }
    if (!nextSteps || isRichDocEmpty(nextSteps)) {
      setNextStepsError(t("nextStepsRequired"));
      return;
    }
    setFormError(null);
    setNextStepsError(null);
    const payload: TCreateReportPayload = {
      ...period,
      written: Object.fromEntries(WRITTEN_FIELDS.map((key) => [key, written[key] && !isRichDocEmpty(written[key]) ? written[key] : null])) as TCreateReportPayload["written"],
      nextSteps,
    };
    try {
      const report = await createMutation.mutateAsync(payload);
      notify.success(t("created"));
      handleOpenChange(false);
      onCreated(report);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : t("loadError"));
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-[min(100%,60rem)] flex-col gap-0 p-0 sm:max-w-none">
        <SheetHeader className="border-b border-text-primary/15 px-8 py-6">
          <SheetTitle className="text-2xl font-semibold tracking-tight">{t("createTitle")}</SheetTitle>
          <SheetDescription>{t("createBody")}</SheetDescription>
        </SheetHeader>

        <div className="themed-scrollbar flex-1 space-y-10 overflow-y-auto px-8 py-8">
          <section className="space-y-4">
            <SectionHeading title={t("sectionPeriod")} />
            <div className="max-w-sm space-y-2">
              <Input
                id="report-month"
                type="select"
                label={t("periodMonth")}
                value={month}
                options={monthOptions}
                onChange={(event) => setMonth(event.target.value)}
              />
              <p className="text-xs text-text-muted">{t("periodHint")}</p>
            </div>
          </section>

          <section className="space-y-6">
            <SectionHeading title={t("sectionWritten")} hint={t("sectionWrittenHint")} />
            {WRITTEN_FIELDS.map((key) => (
              <div key={key} className="rounded-3xl border border-text-primary/15 p-6">
                <RichTextEditor
                  id={`report-written-${key}`}
                  label={t(`written.${key}`)}
                  hint={t(`writtenHint.${key}`)}
                  placeholder={t("writtenPlaceholder")}
                  defaultValue={null}
                  onChange={(doc) => setSection(key, doc)}
                />
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <SectionHeading title={t("sectionNextSteps")} hint={t("sectionNextStepsHint")} required requiredLabel={t("requiredLabel")} />
            <div className="rounded-3xl border border-text-primary/15 p-6">
              <RichTextEditor
                id="report-next-steps"
                label={t("written.nextSteps")}
                placeholder={t("writtenPlaceholder")}
                defaultValue={null}
                onChange={(doc) => {
                  setNextSteps(doc);
                  if (!isRichDocEmpty(doc)) setNextStepsError(null);
                }}
                error={nextStepsError ?? undefined}
              />
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-text-primary/15 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-h-5 text-sm text-rose-600 dark:text-rose-400" role="alert">
            {formError}
          </p>
          <div className="flex justify-end gap-3">
            <button type="button" className={buttonVariants({ variant: "outline", size: "md" })} onClick={() => handleOpenChange(false)}>
              {t("backToList")}
            </button>
            <Button type="button" onClick={() => void submit()} disabled={createMutation.isPending}>
              {t("createSubmit")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionHeading({ title, hint, required, requiredLabel }: { title: string; hint?: string; required?: boolean; requiredLabel?: string }) {
  return (
    <div className="space-y-1">
      <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-text-primary">
        {title}
        {required ? <span className="text-xs font-medium uppercase tracking-wider text-brand">{requiredLabel}</span> : null}
      </h3>
      {hint ? <p className="text-sm text-text-muted">{hint}</p> : null}
    </div>
  );
}
