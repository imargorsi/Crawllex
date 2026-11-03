"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ProjectCreateStepper } from "@/components/forms/project-create-stepper";
import { RichTextEditor } from "@/components/reports/rich-text-editor";
import { Input } from "@/components/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCreateReportMutation, type TCreateReportPayload } from "@/features/reports/reports.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { notify } from "@/lib/frontend/feedback/notify";
import { elevatedCardSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { buildMonthOptions, defaultMonthValue, monthValueToPeriod } from "@/lib/frontend/reports/period-options";
import { isRichDocEmpty, REPORT_WRITTEN_KEYS, type TReportWrittenKey, type TRichDoc } from "@/lib/reports/rich-text";
import { cn } from "@/lib/utils";

type TWrittenState = Record<TReportWrittenKey, TRichDoc | null>;

const EMPTY_WRITTEN: TWrittenState = { executiveSummary: null, search: null, traffic: null, leads: null, work: null };

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

const REPORT_STEP = 0;
const CONTENT_STEP = 1;

/** Create a monthly report in two steps: report (month and next steps), then content (written sections). */
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
  const [currentStep, setCurrentStep] = useState(REPORT_STEP);
  const [month, setMonth] = useState(defaultMonthValue());
  const [nextSteps, setNextSteps] = useState<TRichDoc | null>(null);
  const [written, setWritten] = useState<TWrittenState>(EMPTY_WRITTEN);
  const [stepError, setStepError] = useState<string | null>(null);
  const createMutation = useCreateReportMutation(projectId);
  const isSubmitting = createMutation.isPending;
  const hasNextSteps = Boolean(nextSteps && !isRichDocEmpty(nextSteps));

  const stepLabels = [t("stepReport"), t("stepContent")];

  function setSection(key: TReportWrittenKey, doc: TRichDoc) {
    setWritten((current) => ({ ...current, [key]: doc }));
  }

  /** Checks the report step. Returns the first problem, or null when the step is complete. */
  function validateReportStep(): string | null {
    if (!monthValueToPeriod(month)) return t("invalidPeriod");
    if (!hasNextSteps) return t("nextStepsRequired");
    return null;
  }

  function goToNextStep() {
    const problem = validateReportStep();
    if (problem) {
      setStepError(problem);
      return;
    }
    setStepError(null);
    setCurrentStep(CONTENT_STEP);
  }

  function goToPreviousStep() {
    setStepError(null);
    setCurrentStep(REPORT_STEP);
  }

  async function submit() {
    const problem = validateReportStep();
    const period = monthValueToPeriod(month);
    if (problem || !period || !nextSteps) {
      setCurrentStep(REPORT_STEP);
      setStepError(problem);
      return;
    }
    setStepError(null);
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
      setStepError(error instanceof ApiError ? error.message : t("loadError"));
    }
  }

  const isContentStep = currentStep === CONTENT_STEP;

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (isContentStep) void submit();
        else goToNextStep();
      }}
    >
      <section className={cn(elevatedCardSurfaceClass, "rounded-2xl p-6 sm:p-8")}>
        <div className="flex flex-col gap-8">
          <ProjectCreateStepper labels={stepLabels} current={currentStep} />

          {currentStep === REPORT_STEP ? (
            <div className="flex flex-col gap-8">
              <p className="type-body text-text-secondary">{t("stepReportLead")}</p>
              <div className="flex max-w-sm flex-col gap-3">
                <Input
                  id="report-month"
                  type="select"
                  label={t("periodMonth")}
                  value={month}
                  options={monthOptions}
                  required
                  onChange={(event) => setMonth(event.target.value)}
                />
                <p className="type-caption text-text-secondary">{t("periodHint")}</p>
              </div>
              <RichTextEditor
                id="report-next-steps"
                label={t("written.nextSteps")}
                hint={t("sectionNextStepsHint")}
                placeholder={t("writtenPlaceholder")}
                defaultValue={nextSteps}
                required
                onChange={(doc) => {
                  setNextSteps(doc);
                  if (!isRichDocEmpty(doc)) setStepError(null);
                }}
              />
            </div>
          ) : null}

          {isContentStep ? (
            <div className="flex flex-col gap-8">
              <p className="type-body text-text-secondary">{t("stepContentLead")}</p>
              <div className="grid gap-x-6 gap-y-10 lg:grid-cols-2">
                {REPORT_WRITTEN_KEYS.map((key) => (
                  <div key={key} className={cn(key === "executiveSummary" && "lg:col-span-2")}>
                    <RichTextEditor
                      id={`report-written-${key}`}
                      label={t(`written.${key}`)}
                      hint={t(`writtenHint.${key}`)}
                      placeholder={t("writtenPlaceholder")}
                      defaultValue={written[key]}
                      onChange={(doc) => setSection(key, doc)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {stepError ? (
            <p className="text-sm text-destructive" role="alert">
              {stepError}
            </p>
          ) : null}
        </div>
      </section>

      <div className="p-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={goToPreviousStep} disabled={!isContentStep}>
            {t("previousStep")}
          </Button>
          <div className="flex w-full justify-end sm:w-auto">
            {isContentStep ? (
              <Button type="submit" variant="gradient" size="lg" disabled={isSubmitting} aria-busy={isSubmitting} className="w-full sm:min-w-52 sm:w-auto">
                <span className="inline-flex items-center justify-center gap-2 px-1">
                  {isSubmitting ? <Spinner className="size-4 shrink-0" /> : null}
                  {t("createSubmit")}
                </span>
              </Button>
            ) : (
              <Button type="submit" variant="gradient" size="lg" className="w-full sm:min-w-52 sm:w-auto">
                {t("nextStep")}
              </Button>
            )}
          </div>
        </div>
        {!isContentStep ? (
          <div className="mt-3">
            <Link href="/reports" className="inline-flex type-body-strong text-text-secondary transition-colors hover:text-text-primary hover:underline">
              {t("backToList")}
            </Link>
          </div>
        ) : null}
      </div>
    </form>
  );
}
