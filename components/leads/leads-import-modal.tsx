"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/input";
import { Button } from "@/components/ui/button";
import { DialogSectionDivider } from "@/components/ui/dialog-section-divider";
import { Spinner } from "@/components/ui/spinner";
import { commitLeadsImport, previewLeadsImport } from "@/features/leads/leads.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { downloadHrefAsFile } from "@/lib/frontend/download-file";
import { notify } from "@/lib/frontend/feedback/notify";
import {
  dialogSurfaceClass,
  formFieldControlClass,
  glassPanelSurfaceClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { overlayClass } from "@/lib/frontend/theme/chrome-tones";
import {
  LEAD_DATE_USE_TODAY,
  LEAD_EXTRAS_KEEP,
  LEAD_FIELD_SKIP,
  LEAD_IMPORT_MAX_FILE_BYTES,
  LEAD_IMPORT_SAMPLE_CSV_FILENAME,
  LEAD_IMPORT_SAMPLE_CSV_HREF,
  LEAD_REQUIRED_FIELDS,
} from "@/lib/leads/constants";
import { coreMappedHeaders, reconcileExtrasHeaders } from "@/lib/leads/extras.utils";
import { cn } from "@/lib/utils";
import type { TLeadColumnMapping, TLeadField, TLeadsImportResult } from "@/types/lead.types";

type TImportStep = "file" | "matching";

type TLeadsImportModalProps = {
  open: boolean;
  projectId: string;
  onOpenChange: (open: boolean) => void;
  onImported: (result: TLeadsImportResult) => void;
};

const EMPTY_MAPPING: TLeadColumnMapping = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
  servicesInterestedIn: "",
  leadDate: LEAD_DATE_USE_TODAY,
  extras: [],
};

/** Match UI order: names first, then contact, then optional extras. */
const MATCH_FIELDS: TLeadField[] = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "message",
  "leadDate",
  "servicesInterestedIn",
];

export function LeadsImportModal({
  open,
  projectId,
  onOpenChange,
  onImported,
}: TLeadsImportModalProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.leads.importModal" });
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<TImportStep>("file");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<TLeadColumnMapping>(EMPTY_MAPPING);
  const [rowCount, setRowCount] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const headerOptions = useMemo(
    () => headers.map((header) => ({ label: header, value: header })),
    [headers],
  );

  const unmappedHeaders = useMemo(() => {
    const used = coreMappedHeaders(mapping);
    return headers.filter((header) => !used.has(header));
  }, [headers, mapping]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setStep("file");
    setFile(null);
    setHeaders([]);
    setMapping(EMPTY_MAPPING);
    setRowCount(0);
    setIsParsing(false);
    setIsImporting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isParsing && !isImporting) onOpenChange(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange, isParsing, isImporting]);

  function onPickFile(next: File | null) {
    if (!next) {
      setFile(null);
      return;
    }
    if (!next.name.toLowerCase().endsWith(".csv")) {
      notify.error(t("errors.csvOnly"));
      return;
    }
    if (next.size > LEAD_IMPORT_MAX_FILE_BYTES) {
      notify.error(t("errors.tooLarge"));
      return;
    }
    setFile(next);
    setStep("file");
    setHeaders([]);
    setMapping(EMPTY_MAPPING);
  }

  async function goToMatching() {
    if (!file) return;
    setIsParsing(true);
    try {
      const preview = await previewLeadsImport(projectId, file);
      setHeaders(preview.headers);
      setMapping(preview.suggestedMapping);
      setRowCount(preview.rowCount);
      setStep("matching");
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : t("errors.parseFallback"));
    } finally {
      setIsParsing(false);
    }
  }

  function mappingComplete(): boolean {
    return LEAD_REQUIRED_FIELDS.every((field) => Boolean(mapping[field]));
  }

  function onMappingChange(field: TLeadField, header: string) {
    setMapping((prev) => {
      const previousUsed = coreMappedHeaders(prev);
      const next: TLeadColumnMapping = { ...prev, [field]: header };
      if (header && header !== LEAD_DATE_USE_TODAY && header !== LEAD_FIELD_SKIP) {
        for (const other of MATCH_FIELDS) {
          if (other !== field && next[other] === header) {
            next[other] = other === "leadDate" ? LEAD_DATE_USE_TODAY : "";
          }
        }
      }
      next.extras = reconcileExtrasHeaders(headers, next, prev.extras, previousUsed);
      return next;
    });
  }

  function onExtraToggle(header: string, keep: boolean) {
    setMapping((prev) => {
      const without = prev.extras.filter((value) => value !== header);
      return {
        ...prev,
        extras: keep ? [...without, header] : without,
      };
    });
  }

  async function runImport() {
    if (!file || !mappingComplete()) return;
    setIsImporting(true);
    try {
      const result = await commitLeadsImport(projectId, file, mapping);
      onImported(result);
      onOpenChange(false);
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : t("errors.importFallback"));
    } finally {
      setIsImporting(false);
    }
  }

  const busy = isParsing || isImporting;

  function renderFieldRow(field: TLeadField) {
    const required = (LEAD_REQUIRED_FIELDS as readonly string[]).includes(field);
    const allowsSkip = field === "servicesInterestedIn" || field === "lastName";
    const options =
      field === "leadDate"
        ? [{ label: t("useToday"), value: LEAD_DATE_USE_TODAY }, ...headerOptions]
        : allowsSkip
          ? [{ label: t("doNotImport"), value: LEAD_FIELD_SKIP }, ...headerOptions]
          : headerOptions;

    const value = allowsSkip ? mapping[field] || LEAD_FIELD_SKIP : mapping[field];

    return (
      <Input
        key={field}
        id={`lead-map-${field}`}
        type="select"
        label={t(`fields.${field}`)}
        required={required}
        disabled={busy}
        value={value}
        placeholder={t("selectColumn")}
        options={options}
        onChange={(event) => {
          const next = event.target.value;
          onMappingChange(field, allowsSkip && next === LEAD_FIELD_SKIP ? "" : next);
        }}
      />
    );
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={t("close")}
        className={cn("absolute inset-0 backdrop-blur-[2px]", overlayClass)}
        onClick={() => {
          if (!busy) onOpenChange(false);
        }}
        disabled={busy}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex max-h-[min(92vh,36rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl",
          dialogSurfaceClass,
          "border-2 border-text-muted/45",
        )}
      >
        <header className="relative flex shrink-0 items-center justify-between gap-3 px-5 py-4 pe-12 sm:px-6">
          <h2 id={titleId} className="type-title text-text-primary">
            {step === "file" || isParsing ? t("titleImport") : t("titleMatching")}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="absolute inset-e-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary disabled:opacity-50"
          >
            <Icons.cancel className="size-4" aria-hidden />
            <span className="sr-only">{t("close")}</span>
          </button>
        </header>
        <DialogSectionDivider />

        {busy ? (
          <div className="flex min-h-[18rem] flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <Spinner className="size-8 text-brand" />
            <p className="type-body-strong text-text-primary">
              {isParsing ? t("parsing") : t("importing")}
            </p>
            <p className="type-caption text-text-muted">
              {isParsing ? t("parsingHint") : t("importingHint")}
            </p>
          </div>
        ) : (
          <>
            <div className="themed-scrollbar relative min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {step === "file" ? (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={(event) => {
                      onPickFile(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />

                  {!file ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        formFieldControlClass,
                        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-dashed px-4 py-10 text-center transition-colors hover:bg-bg-hover/40",
                      )}
                    >
                      <Icons.file className="size-8 text-brand" aria-hidden />
                      <span className="type-label text-text-primary">{t("chooseFile")}</span>
                      <span className="type-caption text-text-muted">{t("chooseFileHint")}</span>
                    </button>
                  ) : (
                    <div
                      className={cn(
                        glassPanelSurfaceClass,
                        "flex items-center gap-3 rounded-xl px-4 py-3 dark:border-text-primary/45",
                      )}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Icons.file className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate type-body-strong text-text-primary">{file.name}</p>
                        <p className="type-caption text-text-muted">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onPickFile(null)}
                        className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                        aria-label={t("removeFile")}
                        title={t("removeFile")}
                      >
                        <Icons.delete className="size-4" aria-hidden />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <Button
                      type="button"
                      variant="outlined"
                      size="md"
                      onClick={() => {
                        void downloadHrefAsFile(
                          LEAD_IMPORT_SAMPLE_CSV_HREF,
                          LEAD_IMPORT_SAMPLE_CSV_FILENAME,
                        ).catch(() => {
                          notify.error(t("downloadSampleError"));
                        });
                      }}
                    >
                      <Icons.cloudDownload className="size-4" aria-hidden />
                      {t("downloadSample")}
                    </Button>
                    <p className="type-caption text-text-muted">{t("downloadSampleHint")}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-1 rounded-xl border border-text-primary/70 bg-transparent px-4 py-2 text-center dark:border-text-primary/55">
                    <p className="type-label text-text-primary">{t("matchBanner")}</p>
                    <p className="type-caption text-text-muted">
                      {t("rowCount", { count: rowCount })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {MATCH_FIELDS.map((field) => renderFieldRow(field))}
                  </div>

                  {unmappedHeaders.length > 0 ? (
                    <div className="space-y-3 border-t border-border pt-4">
                      <div className="type-stack-md">
                        <p className="type-label text-text-primary">{t("extrasTitle")}</p>
                        <p className="type-caption text-text-muted">{t("extrasHint")}</p>
                      </div>
                      {unmappedHeaders.map((header) => {
                        const keep = mapping.extras.includes(header);
                        return (
                          <Input
                            key={header}
                            id={`lead-extra-${header}`}
                            type="select"
                            label={header}
                            disabled={busy}
                            value={keep ? LEAD_EXTRAS_KEEP : LEAD_FIELD_SKIP}
                            options={[
                              { label: t("keepAsExtra"), value: LEAD_EXTRAS_KEEP },
                              { label: t("doNotImport"), value: LEAD_FIELD_SKIP },
                            ]}
                            onChange={(event) => {
                              onExtraToggle(header, event.target.value === LEAD_EXTRAS_KEEP);
                            }}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <DialogSectionDivider />
            <footer className="flex shrink-0 items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <Button
                type="button"
                variant="outlined"
                size="md"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel")}
              </Button>

              {step === "file" ? (
                <Button
                  type="button"
                  variant="outlined"
                  size="md"
                  disabled={!file}
                  onClick={() => void goToMatching()}
                  className="gap-1.5"
                >
                  {t("nextMatching")}
                  <Icons.arrowRight className="size-4" aria-hidden />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outlined"
                  size="md"
                  disabled={!mappingComplete()}
                  onClick={() => void runImport()}
                  className="gap-1.5"
                >
                  {t("nextImport")}
                  <Icons.arrowRight className="size-4" aria-hidden />
                </Button>
              )}
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
