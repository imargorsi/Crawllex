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
import { elevatedCardSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { notify } from "@/lib/frontend/feedback/notify";
import { buildMonthOptions, defaultMonthValue, monthValueToPeriod } from "@/lib/frontend/reports/period-options";
import { isRichDocEmpty, REPORT_WRITTEN_KEYS, type TReportWrittenKey, type TRichDoc } from "@/lib/reports/rich-text";
import { cn } from "@/lib/utils";

type TWrittenState = Record<TReportWrittenKey, TRichDoc | null>;

const EMPTY_WRITTEN: TWrittenState = { executiveSummary: null, search: null, traffic: null, leads: null, work: null };

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

const PERIOD_STEP = 0;
const WRITTEN_STEP = 1;
const NEXT_STEPS_STEP = 2;

/** Create a monthly report in three steps, like the project form: period, written text, next steps. */
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
  const [currentStep, setCurrentStep] = useState(PERIOD_STEP);
  const [month, setMonth] = useState(defaultMonthValue());
  const [written, setWritten] = useState<TWrittenState>(EMPTY_WRITTEN);
  const [nextSteps, setNextSteps] = useState<TRichDoc | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const createMutation = useCreateReportMutation(projectId);
  const isSubmitting = createMutation.isPending;

  const stepLabels = [t("stepPeriod"), t("stepWritten"), t("stepNextSteps")];
  const writtenCount = REPORT_WRITTEN_KEYS.filter((key) => written[key] && !isRichDocEmpty(written[key])).length;

  function setSection(key: TReportWrittenKey, doc: TRichDoc) {
    setWritten((current) => ({ ...current, [key]: doc }));
  }

  function goToNextStep() {
    if (currentStep === PERIOD_STEP && !monthValueToPeriod(month)) {
      setStepError(t("invalidPeriod"));
      return;
    }
    setStepError(null);
    setCurrentStep((step) => Math.min(step + 1, NEXT_STEPS_STEP));
  }

  function goToPreviousStep() {
    setStepError(null);
    setCurrentStep((step) => Math.max(step - 1, PERIOD_STEP));
  }

  async function submit() {
    const period = monthValueToPeriod(month);
    if (!period) {
      setCurrentStep(PERIOD_STEP);
      setStepError(t("invalidPeriod"));
      return;
    }
    if (!nextSteps || isRichDocEmpty(nextSteps)) {
      setStepError(t("nextStepsRequired"));
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

  const isLastStep = currentStep === NEXT_STEPS_STEP;

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (isLastStep) void submit();
        else goToNextStep();
      }}
    >
      <section className={cn(elevatedCardSurfaceClass, "rounded-2xl p-6 sm:p-8")}>
        <div className="space-y-6">
          <ProjectCreateStepper labels={stepLabels} current={currentStep} />

          {currentStep === PERIOD_STEP ? (
            <div className="space-y-6">
              <p className="type-body text-text-muted">{t("stepPeriodLead")}</p>
              <div className="max-w-sm">
                <Input
                  id="report-month"
                  type="select"
                  label={t("periodMonth")}
                  value={month}
                  options={monthOptions}
                  required
                  onChange={(event) => setMonth(event.target.value)}
                />
                <p className="type-caption mt-2 text-text-muted">{t("periodHint")}</p>
              </div>
            </div>
          ) : null}

          {currentStep === WRITTEN_STEP ? (
            <div className="space-y-6">
              <p className="type-body text-text-muted">{t("stepWrittenLead")}</p>
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
          ) : null}

          {currentStep === NEXT_STEPS_STEP ? (
            <div className="space-y-6">
              <p className="type-body text-text-muted">{t("stepNextStepsLead")}</p>
              <RichTextEditor
                id="report-next-steps"
                label={t("written.nextSteps")}
                hint={t("sectionNextStepsHint")}
                placeholder={t("writtenPlaceholder")}
                defaultValue={null}
                required
                onChange={(doc) => {
                  setNextSteps(doc);
                  if (!isRichDocEmpty(doc)) setStepError(null);
                }}
                error={stepError && !nextSteps ? stepError : undefined}
              />
              <p className="type-body-strong text-text-secondary">
                {t("reviewWritten", { count: writtenCount, total: REPORT_WRITTEN_KEYS.length })}
              </p>
            </div>
          ) : null}

          {stepError && !(currentStep === NEXT_STEPS_STEP && !nextSteps) ? (
            <p className="type-caption text-destructive" role="alert">
              {stepError}
            </p>
          ) : null}
        </div>
      </section>

      <div className="p-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={goToPreviousStep} disabled={currentStep === PERIOD_STEP}>
            {t("previousStep")}
          </Button>
          <div className="flex w-full justify-end sm:w-auto">
            {isLastStep ? (
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
        {currentStep === PERIOD_STEP ? (
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
