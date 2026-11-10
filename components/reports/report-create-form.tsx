"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ProjectCreateStepper } from "@/components/forms/project-create-stepper";
import { ProjectInviteUserSelect } from "@/components/forms/project-invite-user-select";
import { ReportFieldLabel } from "@/components/reports/report-field-label";
import { RichTextEditor } from "@/components/reports/rich-text-editor";
import { Input } from "@/components/input";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useCreateReportMutation, type TCreateReportPayload } from "@/features/reports/reports.api";
import { useProjectQuery } from "@/features/projects/projects.api";
import type { TUserLookupItem } from "@/types/project-invite.types";
import { ApiError } from "@/lib/frontend/api/errors";
import { notify } from "@/lib/frontend/feedback/notify";
import { elevatedCardSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { buildMonthOptions, defaultMonthValue, monthValueToPeriod } from "@/lib/frontend/reports/period-options";
import { isRichDocEmpty, REPORT_WRITTEN_KEYS, type TReportWrittenKey, type TRichDoc } from "@/lib/reports/rich-text";
import type { TAppIconComponent } from "@/components/ui/app-icon";
import { cn } from "@/lib/utils";

type TWrittenState = Record<TReportWrittenKey, TRichDoc | null>;

const EMPTY_WRITTEN: TWrittenState = { executiveSummary: null, search: null, traffic: null, leads: null, work: null };

/** One icon per written section, so each editor is easy to find. */
const WRITTEN_ICON: Record<TReportWrittenKey, TAppIconComponent> = {
  executiveSummary: Icons.file,
  search: Icons.cursorPointer,
  traffic: Icons.globe,
  leads: Icons.userGroup,
  work: Icons.wrench,
} as const;

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
  // Recipients start with the project owner. Once the user edits the list, their list is kept as is.
  const [editedRecipients, setEditedRecipients] = useState<TUserLookupItem[] | null>(null);
  const { data: project } = useProjectQuery(projectId);
  const ownerRecipients: TUserLookupItem[] = project?.owner
    ? [{ id: project.owner.id, name: project.owner.name, email: project.owner.email, profileImage: project.owner.profileImage }]
    : [];
  const recipients = editedRecipients ?? ownerRecipients;
  const [written, setWritten] = useState<TWrittenState>(EMPTY_WRITTEN);
  const [stepError, setStepError] = useState<string | null>(null);
  const createMutation = useCreateReportMutation(projectId);
  const isSubmitting = createMutation.isPending;
  const hasNextSteps = Boolean(nextSteps && !isRichDocEmpty(nextSteps));
  const writtenCount = REPORT_WRITTEN_KEYS.filter((key) => written[key] && !isRichDocEmpty(written[key])).length;
  // Anything typed counts as unsaved work: the user is asked before leaving the page.
  const isDirty = hasNextSteps || writtenCount > 0;
  const [leaveOpen, setLeaveOpen] = useState(false);

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  const stepLabels = [t("stepReport"), t("stepContent")];

  function setSection(key: TReportWrittenKey, doc: TRichDoc) {
    setWritten((current) => ({ ...current, [key]: doc }));
  }

  /** Checks the report step. Returns the first problem, or null when the step is complete. */
  function validateReportStep(): string | null {
    if (!monthValueToPeriod(month)) return t("invalidPeriod");
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
    if (problem || !period) {
      setCurrentStep(REPORT_STEP);
      setStepError(problem);
      return;
    }
    if (!hasNextSteps || !nextSteps) {
      setStepError(t("nextStepsRequired"));
      return;
    }
    setStepError(null);
    const payload: TCreateReportPayload = {
      ...period,
      recipientUserIds: recipients.map((user) => user.id),
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
              <p className="text-base text-text-secondary">{t("stepReportLead")}</p>
              <div className="grid gap-x-6 gap-y-8 lg:grid-cols-2 lg:items-start">
                <div className="flex min-w-0 flex-col gap-3">
                  <ReportFieldLabel htmlFor="report-month" label={t("periodMonth")} icon={Icons.calendar} required />
                  <Input
                    id="report-month"
                    type="select"
                    aria-label={t("periodMonth")}
                    controlClassName="h-12 border-2 border-border/60 dark:border-text-primary/25"
                    value={month}
                    options={monthOptions}
                    required
                    onChange={(event) => setMonth(event.target.value)}
                  />
                  <p className="type-caption text-text-muted">{t("periodHint")}</p>
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                  <ReportFieldLabel htmlFor="report-recipients-search" label={t("sendToLabel")} icon={Icons.mail} />
                  <ProjectInviteUserSelect
                    selectedUsers={recipients}
                    onSelect={(user) => setEditedRecipients([...recipients, user])}
                    onRemove={(userId) => setEditedRecipients(recipients.filter((user) => user.id !== userId))}
                    hideSearchLabel
                    searchClassName="border-2 border-border/60 dark:border-text-primary/25"
                    chipsBelow
                    helpText={t("sendToHint")}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {isContentStep ? (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <p className="text-base text-text-secondary">{t("stepContentLead")}</p>
                <p className="text-sm font-medium text-text-primary">
                  {t("writtenProgress", { count: writtenCount, total: REPORT_WRITTEN_KEYS.length })}
                </p>
              </div>
              <div className="grid gap-x-6 gap-y-10 lg:grid-cols-2">
                {REPORT_WRITTEN_KEYS.map((key) => (
                  <div key={key} className={cn(key === "executiveSummary" && "lg:col-span-2")}>
                    <RichTextEditor
                      id={`report-written-${key}`}
                      label={t(`written.${key}`)}
                      icon={WRITTEN_ICON[key]}
                      hint={t(`writtenHint.${key}`)}
                      placeholder={t("writtenPlaceholder")}
                      defaultValue={written[key]}
                      onChange={(doc) => setSection(key, doc)}
                    />
                  </div>
                ))}
              </div>
              <RichTextEditor
                id="report-next-steps"
                label={t("written.nextSteps")}
                icon={Icons.rocket}
                hint={t("sectionNextStepsHint")}
                placeholder={t("writtenPlaceholder")}
                defaultValue={nextSteps}
                required
                onChange={(doc) => {
                  setNextSteps(doc);
                  if (!isRichDocEmpty(doc)) setStepError(null);
                }}
                error={stepError && !hasNextSteps ? stepError : undefined}
              />
            </div>
          ) : null}

          {stepError && !(isContentStep && !hasNextSteps) ? (
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
            <Link
              href="/reports"
              onClick={(event) => {
                if (!isDirty) return;
                event.preventDefault();
                setLeaveOpen(true);
              }}
              className="inline-flex type-body-strong text-text-secondary transition-colors hover:text-text-primary hover:underline"
            >
              {t("backToList")}
            </Link>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        tone="destructive"
        title={t("leaveTitle")}
        description={t("leaveBody")}
        action={
          <>
            <AlertDialogCancel>{t("leaveStay")}</AlertDialogCancel>
            <button type="button" className={buttonVariants({ variant: "destructive", size: "md" })} onClick={() => router.push("/reports")}>
              {t("leaveConfirm")}
            </button>
          </>
        }
      />
    </form>
  );
}
