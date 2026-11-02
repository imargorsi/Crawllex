import {
  REPORT_FLAT_CHANGE_RATIO,
  REPORT_MAX_HIGHLIGHTS,
  REPORT_STABLE_POSITION_DELTA,
} from "@/lib/reports/constants";
import {
  countPhrase,
  startCase,
  formatDuration,
  formatInt,
  formatPercent,
  formatPosition,
  relativeChange,
  type TChange,
} from "@/lib/reports/format";
import type { TReportNarrativeSectionDto, TReportSnapshotDto } from "@/types/reports.types";

/**
 * Rule-based report narrative. Every sentence is built from the collected numbers with fixed
 * templates and thresholds, so the same data always gives the same text. No LLM is called.
 * Manual notes are passed through as written by the team.
 */

type TBase = Omit<TReportSnapshotDto, "version" | "generatedAt" | "narrative" | "notes">;

export type TNarrativeNotes = TReportSnapshotDto["notes"];

export type TNarrativeResult = TReportSnapshotDto["narrative"];

const ORIGIN_LABELS: Record<string, string> = {
  wordpress: "website forms",
  csv_import: "imported lists",
  manual: "added by the team",
};

const PREVIOUS_UNIT = "the previous period";

function changePhrase(change: TChange): string {
  if (change.direction === "none" || change.ratio == null) return "";
  if (Math.abs(change.ratio) < REPORT_FLAT_CHANGE_RATIO) return `, in line with ${PREVIOUS_UNIT}`;
  const share = Math.abs(change.ratio * 100).toFixed(1);
  return change.direction === "up" ? `, up ${share}%` : `, down ${share}%`;
}

function positionPhrase(current: number | null, previous: number | null): string {
  if (current == null || previous == null) return "";
  const delta = previous - current; // lower position is better
  if (Math.abs(delta) < REPORT_STABLE_POSITION_DELTA) return "and stayed stable";
  return delta > 0
    ? `and improved by ${delta.toFixed(1)} places`
    : `and slipped by ${Math.abs(delta).toFixed(1)} places`;
}

function sentence(parts: string[]): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function searchSection(base: TBase): TReportNarrativeSectionDto {
  const { current, previous } = base.gsc;

  if (!base.sources.gsc) {
    return {
      key: "search",
      heading: "Search Performance",
      paragraphs: ["No Search Console data is available for this period, so search figures are not included."],
    };
  }

  const clicks = relativeChange(current.clicks, previous.clicks);
  const impressions = relativeChange(current.impressions, previous.impressions);
  const paragraphs = [
    sentence([
      `Search Console recorded ${countPhrase(current.clicks, "click", "clicks")}${changePhrase(clicks)}.`,
      `Impressions reached ${formatInt(current.impressions)}${changePhrase(impressions)}.`,
    ]),
    sentence([
      `Average click-through rate was ${formatPercent(current.ctr)}`,
      previous.ctr != null ? `(${formatPercent(previous.ctr)} previously).` : ".",
      `Average position was ${formatPosition(current.position)} ${positionPhrase(current.position, previous.position)}.`,
    ]),
  ];

  const topQuery = base.gsc.topQueries[0];
  if (topQuery && (topQuery.clicks ?? 0) > 0) {
    paragraphs.push(
      `The leading search query was “${topQuery.value}” with ${formatInt(topQuery.clicks)} clicks.`,
    );
  }

  return { key: "search", heading: "Search Performance", paragraphs };
}

function trafficSection(base: TBase): TReportNarrativeSectionDto {
  const { current, previous } = base.ga4;

  if (!base.sources.ga4) {
    return {
      key: "traffic",
      heading: "Website Traffic",
      paragraphs: ["No Google Analytics data is available for this period, so traffic figures are not included."],
    };
  }

  const sessions = relativeChange(current.sessions, previous.sessions);
  const organicShare = current.sessions > 0 ? current.organicSessions / current.sessions : null;
  const paragraphs = [
    sentence([
      `The website recorded ${countPhrase(current.sessions, "session", "sessions")} from ${countPhrase(current.totalUsers, "user", "users")}${changePhrase(sessions)}.`,
      organicShare != null
        ? `${formatPercent(organicShare)} of sessions came from organic search.`
        : "",
    ]),
  ];

  const topChannel = base.ga4.channels[0];
  const topCountry = base.ga4.countries[0];
  if (topChannel && (topChannel.sessions ?? 0) > 0) {
    paragraphs.push(
      sentence([
        `The largest channel was ${topChannel.value} with ${countPhrase(topChannel.sessions ?? 0, "session", "sessions")}.`,
        topCountry && (topCountry.sessions ?? 0) > 0
          ? `Most sessions came from ${topCountry.value} (${formatInt(topCountry.sessions)}).`
          : "",
      ]),
    );
  }

  return { key: "traffic", heading: "Website Traffic", paragraphs };
}

function engagementSection(base: TBase): TReportNarrativeSectionDto {
  const { current } = base.ga4;
  const { contacts, highlights } = base.events;
  const contactTotal = contacts.call + contacts.email + contacts.whatsapp;

  const paragraphs: string[] = [];
  if (base.sources.ga4) {
    paragraphs.push(
      sentence([
        `Engagement rate was ${formatPercent(current.engagementRate)} and visitors stayed on average ${formatDuration(current.avgSessionDuration)}.`,
      ]),
    );
  }

  if (contactTotal > 0) {
    paragraphs.push(
      `Visitors took ${formatInt(contactTotal)} contact actions: ${formatInt(contacts.call)} calls, ${formatInt(contacts.email)} email clicks and ${formatInt(contacts.whatsapp)} WhatsApp clicks.`,
    );
  } else if (base.sources.ga4) {
    paragraphs.push("No contact actions (calls, email or WhatsApp clicks) were recorded this period.");
  }

  const topEvent = highlights[0];
  if (topEvent && topEvent.count > 0) {
    paragraphs.push(`The most frequent tracked action was “${topEvent.label}” (${formatInt(topEvent.count)} times).`);
  }

  if (paragraphs.length === 0) {
    paragraphs.push("Engagement figures are not available because no Google Analytics data exists for this period.");
  }

  return { key: "engagement", heading: "Engagement And Contact Actions", paragraphs };
}

function leadsSection(base: TBase): TReportNarrativeSectionDto {
  const change = relativeChange(base.leads.total, base.leads.previousTotal);
  const origins = Object.entries(base.leads.byOrigin)
    .filter(([, count]) => count > 0)
    .map(([origin, count]) => `${formatInt(count)} ${ORIGIN_LABELS[origin] ?? origin}`);

  const paragraphs = [
    sentence([
      `${startCase(countPhrase(base.leads.total, "lead", "leads"))} ${base.leads.total === 1 ? "was" : "were"} recorded this period${changePhrase(change)}.`,
      origins.length > 0 ? `By source: ${origins.join(", ")}.` : "",
    ]),
  ];

  return { key: "leads", heading: "Leads", paragraphs };
}

function contentSection(base: TBase): TReportNarrativeSectionDto {
  const { current, previous } = base.activities;
  const paragraphs = [
    sentence([
      `This period the team logged ${countPhrase(current.blogs, "blog post", "blog posts")}, ${countPhrase(current.backlinks, "backlink", "backlinks")} and ${countPhrase(current.technical_work, "technical task", "technical tasks")}.`,
      previous.blogs + previous.backlinks + previous.technical_work > 0
        ? `The previous period had ${formatInt(previous.blogs)} blog posts, ${formatInt(previous.backlinks)} backlinks and ${formatInt(previous.technical_work)} technical tasks.`
        : "",
    ]),
  ];

  const titles = base.activities.blogs.slice(0, 3).map((blog) => `“${blog.title}”`);
  if (titles.length > 0) {
    paragraphs.push(`Published topics included ${titles.join(", ")}.`);
  }

  return { key: "content", heading: "Content And Off-Page Work", paragraphs };
}

function keyFindings(base: TBase): string[] {
  const findings: string[] = [];

  if (base.sources.gsc) {
    const clicks = relativeChange(base.gsc.current.clicks, base.gsc.previous.clicks);
    if (clicks.ratio != null && Math.abs(clicks.ratio) >= REPORT_FLAT_CHANGE_RATIO) {
      findings.push(
        `Search clicks ${clicks.direction === "up" ? "rose" : "fell"} ${Math.abs(clicks.ratio * 100).toFixed(1)}% against the previous period.`,
      );
    }
    const delta =
      base.gsc.previous.position != null && base.gsc.current.position != null
        ? base.gsc.previous.position - base.gsc.current.position
        : 0;
    if (Math.abs(delta) >= REPORT_STABLE_POSITION_DELTA) {
      findings.push(
        `Average position ${delta > 0 ? "improved" : "slipped"} by ${Math.abs(delta).toFixed(1)} places.`,
      );
    }
  }

  const leads = relativeChange(base.leads.total, base.leads.previousTotal);
  if (leads.ratio != null && Math.abs(leads.ratio) >= REPORT_FLAT_CHANGE_RATIO) {
    findings.push(
      `Leads ${leads.direction === "up" ? "increased" : "decreased"} to ${formatInt(base.leads.total)}.`,
    );
  }

  const contactTotal = base.events.contacts.call + base.events.contacts.email + base.events.contacts.whatsapp;
  if (contactTotal > 0) {
    findings.push(`${countPhrase(contactTotal, "contact action", "contact actions")} were taken on the website.`);
  }

  if (base.sources.ga4 && base.ga4.current.sessions > 0) {
    const organic = base.ga4.current.organicSessions / base.ga4.current.sessions;
    findings.push(`Organic search delivered ${formatPercent(organic)} of website sessions.`);
  }

  return findings.slice(0, 5);
}

function executiveSummary(base: TBase, notes: TNarrativeNotes): string[] {
  const lines: string[] = [];

  if (base.sources.gsc) {
    const clicks = relativeChange(base.gsc.current.clicks, base.gsc.previous.clicks);
    lines.push(
      `Search Console recorded ${countPhrase(base.gsc.current.clicks, "click", "clicks")} and ${countPhrase(base.gsc.current.impressions, "impression", "impressions")}${changePhrase(clicks)}.`,
    );
  }
  if (base.sources.ga4) {
    lines.push(
      `Google Analytics recorded ${countPhrase(base.ga4.current.sessions, "session", "sessions")} from ${countPhrase(base.ga4.current.totalUsers, "user", "users")}.`,
    );
  }
  lines.push(
    `${startCase(countPhrase(base.leads.total, "lead", "leads"))} ${base.leads.total === 1 ? "was" : "were"} recorded and ${countPhrase(base.activities.current.blogs, "blog post", "blog posts")} ${base.activities.current.blogs === 1 ? "was" : "were"} published.`,
  );

  for (const highlight of notes.highlights.slice(0, REPORT_MAX_HIGHLIGHTS)) {
    lines.push(highlight);
  }

  return lines;
}

export function buildNarrative(base: TBase, notes: TNarrativeNotes): TNarrativeResult {
  return {
    executiveSummary: executiveSummary(base, notes),
    keyFindings: keyFindings(base),
    sections: [
      searchSection(base),
      trafficSection(base),
      engagementSection(base),
      leadsSection(base),
      contentSection(base),
    ],
  };
}
