"use client";

import { useState } from "react";

import { UPTIME_LEGEND_COLORS, LensUptimeBars, LensUptimeLegend } from "@/components/lens/lens-charts";
import { formatWhen, formatMinutes, type TLensT } from "@/components/lens/lens-overview";
import { LENS_FLOAT_CARD, LensEmpty, LensPill, LensStatTile } from "@/components/lens/lens-ui";
import type { TLensDemoDashboard, TLensDemoIncident } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

/**
 * Uptime Monitoring: same structure as All Issues and Pages. Header, status strip, four figures,
 * the daily chart, then incident history and the selected incident. Demo data only.
 */
export function LensUptime({ data, t, locale }: { data: TLensDemoDashboard; t: TLensT; locale: string }) {
  const { uptime, incidents } = data;
  const [selectedId, setSelectedId] = useState<string | null>(incidents[0]?.id ?? null);
  const selected = incidents.find((i) => i.id === selectedId) ?? null;
  const operational = uptime.status === "operational";

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
          <Icons.analytics className="size-4 text-brand" aria-hidden />
        </span>
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-text-primary">{t("uptimeTitle")}</h2>
          <span className="text-sm text-text-muted">
            {t("uptimeSubtitle")} · {t("checksRecorded")}: {uptime.checks.toLocaleString(locale)} · {t("lastCheckedShort", { time: formatWhen(uptime.lastCheckedAt, locale) })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-text-primary/35">
        <div className="flex flex-wrap items-center gap-3">
          <LensPill tone={operational ? "success" : uptime.status === "down" ? "danger" : "muted"}>
            {operational ? t("statusOperational") : uptime.status === "down" ? t("statusDown") : t("statusUnknown")}
          </LensPill>
          <span className="text-sm text-text-secondary">{operational ? t("noOutage") : t("currentOutage")}</span>
        </div>
        <span className="text-sm text-text-muted">
          {t("lastSuccessfulCheck")}: {formatWhen(uptime.lastSuccessAt, locale)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <LensStatTile
          icon={Icons.checkCircle}
          label={t("uptimeLabel")}
          value={`${uptime.percent.toFixed(2)}%`}
          tone="success"
          trend={uptime.daily.map((d) => d.uptimePct ?? 100)}
          caption={t("dailyCaption")}
        />
        <LensStatTile icon={Icons.clock} label={t("totalDowntime")} value={formatMinutes(uptime.totalDowntimeMin, t)} tone="warning" caption={t("last30Days")} />
        <LensStatTile icon={Icons.alert} label={t("incidents")} value={uptime.incidents} tone="danger" caption={t("last30Days")} />
        <LensStatTile icon={Icons.refresh} label={t("avgResponse")} value={`${uptime.avgResponseMs} ms`} tone="muted" caption={`${t("p95Label")}: ${uptime.p95ResponseMs} ms`} />
      </div>

      <div className={cn(LENS_FLOAT_CARD, "gap-5 p-5 sm:p-7")}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span className="text-sm font-medium text-text-secondary">{t("timelineTitle")}</span>
          <LensUptimeLegend
            items={[
              { label: t("legendGood"), color: UPTIME_LEGEND_COLORS.good },
              { label: t("legendDegraded"), color: UPTIME_LEGEND_COLORS.degraded },
              { label: t("legendDown"), color: UPTIME_LEGEND_COLORS.down },
              { label: t("legendNoData"), color: UPTIME_LEGEND_COLORS.none },
            ]}
          />
        </div>
        <LensUptimeBars days={uptime.daily} height={300} locale={locale} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className={cn(LENS_FLOAT_CARD, "gap-4 p-0")}>
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <span className="text-base font-semibold text-text-primary">{t("incidentHistoryTitle")}</span>
            <span className="text-xs text-text-muted">{t("viewDetails")}</span>
          </div>
          {incidents.length === 0 ? (
            <div className="p-5">
              <LensEmpty>{t("noIncidents")}</LensEmpty>
            </div>
          ) : (
            <ul className="flex flex-col">
              {incidents.map((incident) => (
                <li key={incident.id}>
                  <button
                    type="button"
                    aria-pressed={incident.id === selectedId}
                    onClick={() => setSelectedId(incident.id)}
                    className={cn(
                      "flex w-full flex-wrap items-center justify-between gap-3 border-b border-border/40 px-5 py-4 text-start transition-colors last:border-0 hover:bg-bg-hover/50",
                      incident.id === selectedId && "bg-bg-hover/60",
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-text-primary">{incident.reason}</span>
                      <span className="text-xs text-text-muted">{formatWhen(incident.startedAt, locale)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm tabular-nums text-text-secondary">{formatMinutes(incident.durationMin, t)}</span>
                      <IncidentStatus incident={incident} t={t} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={cn(LENS_FLOAT_CARD, "gap-5 p-5 sm:p-6")}>
          <span className="text-base font-semibold text-text-primary">{t("incidentDetailTitle")}</span>
          {selected ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
              <Detail label={t("reason")}>{selected.reason}</Detail>
              <Detail label={t("colStatus")}>
                <IncidentStatus incident={selected} t={t} />
              </Detail>
              <Detail label={t("detectedAt")}>{formatWhen(selected.detected, locale)}</Detail>
              <Detail label={t("recoveredAt")}>{selected.recovered ? formatWhen(selected.recovered, locale) : "—"}</Detail>
              <Detail label={t("colDuration")}>{formatMinutes(selected.durationMin, t)}</Detail>
            </dl>
          ) : (
            <LensEmpty>{t("noIncidents")}</LensEmpty>
          )}
        </div>
      </div>
    </section>
  );
}

function IncidentStatus({ incident, t }: { incident: TLensDemoIncident; t: TLensT }) {
  return (
    <LensPill tone={incident.status === "resolved" ? "success" : "danger"}>
      {incident.status === "resolved" ? t("statusResolved") : t("statusOngoing")}
    </LensPill>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-xs font-medium text-text-muted">{label}</dt>
      <dd className="text-sm text-text-primary">{children}</dd>
    </div>
  );
}
