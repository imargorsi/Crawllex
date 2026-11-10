"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ReportTable } from "@/components/reports/report-view/report-view-blocks";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { TReportDeliveryDto, TReportDeliveryStatus, TReportListItemDto } from "@/types/reports.types";

/** Dot colour per delivery status, from theme tokens. Readable on the cover image and on the page. */
const DOT: Record<TReportDeliveryStatus, string> = {
  sent: "bg-success",
  failed: "bg-destructive",
  not_sent: "bg-warning",
  skipped: "bg-text-muted",
};

/** Table label key per delivery status. */
const STATUS_LABEL: Record<TReportDeliveryStatus, "deliveryStatusSent" | "deliveryStatusNotSent" | "deliveryStatusFailed" | "deliveryStatusSkipped"> = {
  sent: "deliveryStatusSent",
  not_sent: "deliveryStatusNotSent",
  failed: "deliveryStatusFailed",
  skipped: "deliveryStatusSkipped",
};

const timeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/**
 * Email delivery status of one report: a chip with a summary, which opens the per-recipient list.
 * Renders nothing unless the list returned delivery data (only for users who can create reports).
 */
export function ReportDeliveryStatus({ report, variant = "inline" }: { report: TReportListItemDto; variant?: "inline" | "cover" }) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.reports" });
  const [open, setOpen] = useState(false);
  if (!report.deliveries) return null;

  const deliveries = report.deliveries;
  const count = (status: TReportDeliveryStatus) => deliveries.filter((item) => item.status === status).length;
  const sent = count("sent");
  const failed = count("failed");
  const recipients = report.recipientCount ?? deliveries.length;

  // Send is manual: before the first send there are no deliveries, so the chip shows "Not Sent".
  const label =
    recipients === 0
      ? t("deliveryNoRecipients")
      : sent === recipients
        ? t("deliverySent")
        : sent > 0 || failed > 0
          ? t("deliveryPartial", { sent, failed })
          : t("deliveryNotSent");
  const dot = sent === recipients && recipients > 0 ? DOT.sent : failed > 0 ? DOT.failed : DOT.not_sent;

  const table = {
    headers: [t("deliveryColRecipient"), t("deliveryColStatus"), t("deliveryColTime"), t("deliveryColError")],
    rows: deliveries.map((item: TReportDeliveryDto) => [
      item.name && item.email ? `${item.name} · ${item.email}` : item.name || item.email || "—",
      t(STATUS_LABEL[item.status]),
      item.at ? timeFormatter.format(new Date(item.at)) : "—",
      item.error ?? "—",
    ]),
    emptyText: t("deliveryNoRecipients"),
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors",
          variant === "cover"
            ? "border-white/30 bg-black/45 text-white backdrop-blur-md hover:bg-black/60"
            : "border-text-primary/25 text-text-primary hover:border-brand/60",
        )}
      >
        <span className={cn("size-2 shrink-0 rounded-full", dot)} aria-hidden />
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("deliveryTitle")} description={report.title} className="w-[min(100%-1.5rem,48rem)]">
        <ReportTable table={table} />
      </Modal>
    </>
  );
}
