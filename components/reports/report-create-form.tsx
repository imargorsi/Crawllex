"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { RichTextEditor } from "@/components/reports/rich-text-editor";
import { Input } from "@/components/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCreateReportMutation, type TCreateReportPayload } from "@/features/reports/reports.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { notify } from "@/lib/frontend/feedback/notify";
import { buildMonthOptions, defaultMonthValue, monthValueToPeriod } from "@/lib/frontend/reports/period-options";
import { isRichDocEmpty, REPORT_WRITTEN_KEYS, type TReportWrittenKey, type TRichDoc } from "@/lib/reports/rich-text";
import { cn } from "@/lib/utils";

type TWrittenState = Record<TReportWrittenKey, TRichDoc | null>;

const EMPTY_WRITTEN: TWrittenState = { executiveSummary: null, search: null, traffic: null, leads: null, work: null };

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

/** Full-page form to create a monthly report: period, optional written sections, required next steps. */
export function ReportCreateForm({ projectId }: { projectId: string }) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.reports" });
  const router = useRouter();
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

  function setSection(key: TReportWrittenKey, doc: TRichDoc) {
    setWritten((current) => ({ ...current, [key]: doc }));
  }

  async function submit() {
    const period = monthValueToPeriod(month);
    if (!period) {
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
      written: Object.fromEntries(
        REPORT_WRITTEN_KEYS.map((key) => [key, written[key] && !isRichDocEmpty(written[key]) ? written[key] : null]),
      ) as TCreateReportPayload["written"],
      nextSteps,
    };
    try {
      const report = await createMutation.mutateAsync(payload);
      notify.success(t("created"));
      router.push(`/reports/${report.id}`);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : t("loadError"));
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <FormCard title={t("sectionPeriod")}>
        <div className="max-w-sm">
          <Input
            id="report-month"
            type="select"
            label={t("periodMonth")}
            value={month}
            options={monthOptions}
            onChange={(event) => setMonth(event.target.value)}
          />
          <p className="mt-2 text-xs text-text-muted">{t("periodHint")}</p>
        </div>
      </FormCard>

      <FormCard title={t("sectionWritten")} hint={t("sectionWrittenHint")}>
        <div className="space-y-8">
          {REPORT_WRITTEN_KEYS.map((key) => (
            <RichTextEditor
              key={key}
              id={`report-written-${key}`}
              label={t(`written.${key}`)}
              hint={t(`writtenHint.${key}`)}
              placeholder={t("writtenPlaceholder")}
              defaultValue={null}
              onChange={(doc) => setSection(key, doc)}
            />
          ))}
        </div>
      </FormCard>

      <FormCard title={t("sectionNextSteps")} hint={t("sectionNextStepsHint")} required={t("requiredLabel")}>
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
      </FormCard>

      <div className="flex flex-col-reverse gap-3 border-t border-text-primary/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-5 text-sm text-rose-600 dark:text-rose-400" role="alert">
          {formError}
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" className={cn(buttonVariants({ variant: "outline", size: "md" }))} onClick={() => router.push("/reports")}>
            {t("backToList")}
          </button>
          <Button type="submit" disabled={createMutation.isPending}>
            {t("createSubmit")}
          </Button>
        </div>
      </div>
    </form>
  );
}

function FormCard({ title, hint, required, children }: { title: string; hint?: string; required?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-3xl border border-text-primary/20 p-6 sm:p-8">
      <header className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-text-primary">
          {title}
          {required ? <span className="text-xs font-medium uppercase tracking-wider text-brand">{required}</span> : null}
        </h2>
        {hint ? <p className="text-sm text-text-muted">{hint}</p> : null}
      </header>
      {children}
    </section>
  );
}
