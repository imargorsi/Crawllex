"use client";

import { useState } from "react";

import { LensUptimeBars } from "@/components/lens/lens-charts";
import { formatMinutes, formatWhen, type TLensT } from "@/components/lens/lens-overview";
import { LENS_CARD, LensCardHeader, LensEmpty, LensPill, LensStat } from "@/components/lens/lens-ui";
import type { TLensDemoDashboard, TLensDemoIncident } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

type TProps = { data: TLensDemoDashboard; t: TLensT; locale: string };

/** Uptime monitoring tab: current status, availability, response time, daily timeline, incident history. */
export function LensUptime({ data, t, locale }: TProps) {
  const { uptime, incidents } = data;
  const [selectedId, setSelectedId] = useState<string | null>(incidents[0]?.id ?? null);
  const selected = incidents.find((i) => i.id === selectedId) ?? null;
  const operational = uptime.status === "operational";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <section className={LENS_CARD}>
          <LensCardHeader icon={Icons.checkCircle} title={t("uptimeStatusTitle")} />
          <div className="flex flex-wrap items-center gap-3">
            <LensPill tone={operational ? "success" : uptime.status === "down" ? "danger" : "muted"}>
              {operational ? t("statusOperational") : uptime.status === "down" ? t("statusDown") : t("statusUnknown")}
            </LensPill>
          </div>
          <LensStat label={t("lastSuccessfulCheck")} value={formatWhen(uptime.lastSuccessAt, locale)} icon={Icons.clock} />
          <p className="text-sm text-text-secondary">{operational ? t("noOutage") : t("currentOutage")}</p>
        </section>

        <section className={LENS_CARD}>
          <LensCardHeader icon={Icons.analytics} title={t("availabilityTitle")} />
          <span className="text-4xl font-semibold tabular-nums text-text-primary">{uptime.percent.toFixed(2)}%</span>
          <div className="grid grid-cols-3 gap-3 border-t border-border/50 pt-4">
            <LensStat label={t("totalDowntime")} value={formatMinutes(uptime.totalDowntimeMin, t)} />
            <LensStat label={t("incidents")} value={uptime.incidents} />
            <LensStat label={t("checksRecorded")} value={uptime.checks.toLocaleString(locale)} />
          </div>
        </section>

        <section className={LENS_CARD}>
          <LensCardHeader icon={Icons.refresh} title={t("responseTitle")} />
          <div className="grid grid-cols-2 gap-3">
            <LensStat label={t("avgLabel")} value={`${uptime.avgResponseMs} ms`} />
            <LensStat label={t("p95Label")} value={`${uptime.p95ResponseMs} ms`} />
          </div>
          <p className="text-xs text-text-muted">{t("uptimeUnknownNote")}</p>
        </section>
      </div>

      <section className={LENS_CARD}>
        <LensCardHeader icon={Icons.chartBar} title={t("timelineTitle")} />
        <LensUptimeBars days={uptime.daily} height={300} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className={LENS_CARD}>
          <LensCardHeader icon={Icons.alert} title={t("incidentHistoryTitle")} />
          {incidents.length === 0 ? (
            <LensEmpty>{t("noIncidents")}</LensEmpty>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs text-text-muted">
                    <th className="px-2 py-2 font-medium">{t("colDate")}</th>
                    <th className="px-2 py-2 font-medium">{t("colDuration")}</th>
                    <th className="px-2 py-2 font-medium">{t("colStatus")}</th>
                    <th className="px-2 py-2 font-medium"><span className="sr-only">{t("viewDetails")}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => (
                    <IncidentRow
                      key={incident.id}
                      incident={incident}
                      t={t}
                      locale={locale}
                      active={incident.id === selectedId}
                      onSelect={() => setSelectedId(incident.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={LENS_CARD}>
          <LensCardHeader icon={Icons.list} title={t("incidentDetailTitle")} />
          {selected ? (
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <Detail label={t("colStatus")}>
                <LensPill tone={selected.status === "resolved" ? "success" : "danger"}>
                  {selected.status === "resolved" ? t("statusResolved") : t("statusOngoing")}
                </LensPill>
              </Detail>
              <Detail label={t("detectedAt")}>{formatWhen(selected.detected, locale)}</Detail>
              <Detail label={t("recoveredAt")}>{selected.recovered ? formatWhen(selected.recovered, locale) : "—"}</Detail>
              <Detail label={t("colDuration")}>{formatMinutes(selected.durationMin, t)}</Detail>
              <Detail label={t("colStatus")}>{selected.reason}</Detail>
            </dl>
          ) : (
            <LensEmpty>{t("noIncidents")}</LensEmpty>
          )}
        </section>
      </div>
    </div>
  );
}

function IncidentRow({ incident, t, locale, active, onSelect }: {
  incident: TLensDemoIncident;
  t: TLensT;
  locale: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      className={cn("cursor-pointer border-b border-border/40 last:border-0 transition-colors hover:bg-bg-hover/50", active && "bg-bg-selected")}
      onClick={onSelect}
    >
      <td className="px-2 py-3 text-text-primary">{formatWhen(incident.startedAt, locale)}</td>
      <td className="px-2 py-3 tabular-nums text-text-secondary">{formatMinutes(incident.durationMin, t)}</td>
      <td className="px-2 py-3">
        <LensPill tone={incident.status === "resolved" ? "success" : "danger"}>
          {incident.status === "resolved" ? t("statusResolved") : t("statusOngoing")}
        </LensPill>
      </td>
      <td className="px-2 py-3 text-end">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          {t("viewDetails")}
          <Icons.arrowRight className="size-3.5" aria-hidden />
        </button>
      </td>
    </tr>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="text-text-primary">{children}</dd>
    </div>
  );
}
