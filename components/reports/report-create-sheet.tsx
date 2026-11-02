"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCreateReportMutation } from "@/features/reports/reports.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { notify } from "@/lib/frontend/feedback/notify";
import { formFieldControlClass } from "@/lib/frontend/layout/dashboard-chrome";
import { buildMonthOptions, defaultMonthValue, monthValueToPeriod } from "@/lib/frontend/reports/period-options";
import { REPORT_MAX_HIGHLIGHTS } from "@/lib/reports/constants";
import { cn } from "@/lib/utils";
import type { TReportDetailDto } from "@/types/reports.types";

type TReportCreateSheetProps = {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (report: TReportDetailDto) => void;
};

export function ReportCreateSheet({ projectId, open, onOpenChange, onCreated }: TReportCreateSheetProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.reports" });
  const monthOptions = useMemo(() => buildMonthOptions(24), []);
  const [month, setMonth] = useState(defaultMonthValue());
  const [highlightsText, setHighlightsText] = useState("");
  const [translationStatus, setTranslationStatus] = useState("");
  const [closingNote, setClosingNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const createMutation = useCreateReportMutation(projectId);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setFormError(null);
    onOpenChange(nextOpen);
  }

  async function submit() {
    const period = monthValueToPeriod(month);
    if (!period || !projectId) {
      setFormError(t("invalidPeriod"));
      return;
    }
    const highlights = highlightsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (highlights.length > REPORT_MAX_HIGHLIGHTS) {
      setFormError(`${t("highlightsHint")} (${REPORT_MAX_HIGHLIGHTS})`);
      return;
    }
    setFormError(null);
    try {
      const report = await createMutation.mutateAsync({
        ...period,
        highlights,
        translationStatus: translationStatus.trim() || null,
        closingNote: closingNote.trim() || null,
      });
      notify.success(t("created"));
      handleOpenChange(false);
      onCreated(report);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t("loadError");
      setFormError(message);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[min(100%,30rem)] sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("createTitle")}</SheetTitle>
          <SheetDescription>{t("createBody")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 px-1">
          <div className="space-y-2">
            <Label htmlFor="report-month">{t("periodMonth")}</Label>
            <select
              id="report-month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className={cn(
                "flex h-10 w-full rounded-xl bg-transparent px-3 py-2 text-sm text-text-primary outline-none",
                formFieldControlClass,
              )}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" }).format(
                    new Date(Date.UTC(option.year, option.month - 1, 1)),
                  )}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-secondary">{t("periodHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-highlights">{t("highlightsLabel")}</Label>
            <textarea
              id="report-highlights"
              rows={4}
              value={highlightsText}
              onChange={(event) => setHighlightsText(event.target.value)}
              className={cn(
                "flex w-full rounded-xl bg-transparent px-3 py-2 text-sm text-text-primary outline-none",
                formFieldControlClass,
              )}
            />
            <p className="text-xs text-text-secondary">{t("highlightsHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-translation">{t("translationStatusLabel")}</Label>
            <Input
              id="report-translation"
              value={translationStatus}
              maxLength={500}
              onChange={(event) => setTranslationStatus(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-closing">{t("closingNoteLabel")}</Label>
            <textarea
              id="report-closing"
              rows={3}
              value={closingNote}
              maxLength={1000}
              onChange={(event) => setClosingNote(event.target.value)}
              className={cn(
                "flex w-full rounded-xl bg-transparent px-3 py-2 text-sm text-text-primary outline-none",
                formFieldControlClass,
              )}
            />
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "md" }))}
              onClick={() => handleOpenChange(false)}
            >
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
