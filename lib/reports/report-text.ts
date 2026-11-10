import { REPORT_FLAT_CHANGE_RATIO, REPORT_STABLE_POSITION_DELTA } from "@/lib/reports/constants";
import { countPhrase, formatInt, formatPercent, formatPosition, formatDuration, relativeChange } from "@/lib/reports/format";
import { formatMonthTitle } from "@/lib/reports/period";
import { richDocFirstParagraph } from "@/lib/reports/rich-text";
import type { TReportSnapshotDto } from "@/types/reports.types";

/**
 * Fixed report paragraphs. Each paragraph is a template with the same wording every month; only the
 * numbers, names and trend phrases change. Shared by the in-app report and the PDF, so both read the
 * same. No LLM. If a template needs new wording, change it here once.
 */

export type TReportText = {
  summary: string;
  highlights: {
    leads: string;
    calls: string;
    emails: string;
    whatsapp: string;
    blogs: string;
    backlinks: string;
    technical: string;
  };
  search: string;
  traffic: string;
  engagement: string;
  work: string;
};

/** One plain-language sentence per tracked event. Matches on the label, falls back to a generic line. */
export function describeEvent(label: string, count: number): string {
  const n = formatInt(count);
  const lower = label.toLowerCase();
  if (lower.includes("download")) return `Your files were downloaded ${n} ${count === 1 ? "time" : "times"} this month.`;
  if (lower.includes("click")) return `We tracked ${n} ${count === 1 ? "click" : "clicks"} on key links this month.`;
  if (lower.includes("form") || lower.includes("lead")) return `${n} ${count === 1 ? "visitor" : "visitors"} started a contact form this month.`;
  if (lower.includes("service")) return `Visitors checked the service information ${n} ${count === 1 ? "time" : "times"} this month.`;
  return `Visitors triggered “${label}” ${n} ${count === 1 ? "time" : "times"} this month.`;
}

/** Paragraphs in a report text are separated by this marker; the views split on it. */
export const PARAGRAPH_BREAK = "\n\n";

const ORIGIN_LABELS: Record<string, string> = {
  wordpress: "website forms",
  csv_import: "imported lists",
  manual: "the team",
};

function trend(current: number, previous: number | null | undefined): string {
  const change = relativeChange(current, previous);
  if (change.ratio == null || change.direction === "none") return "";
  if (Math.abs(change.ratio) < REPORT_FLAT_CHANGE_RATIO) return ", in line with the previous period";
  const share = Math.abs(change.ratio * 100).toFixed(1);
  return change.direction === "up" ? `, up ${share}% on the previous period` : `, down ${share}% on the previous period`;
}

/** "3 blog posts were published" / "No blog posts were published this period" */
function logged(count: number, singular: string, plural: string, verb: string): string {
  if (count === 0) return `No ${plural} were ${verb} this period`;
  return `${countPhrase(count, singular, plural)} ${count === 1 ? "was" : "were"} ${verb}`;
}

/** "5 phone calls started from the website this period" / "No phone calls started from the website this period" */
function started(count: number, singular: string, plural: string, tail: string): string {
  return count === 0 ? `No ${plural} ${tail} this period` : `${countPhrase(count, singular, plural)} ${tail} this period`;
}

function positionPhrase(current: number | null | undefined, previous: number | null | undefined): string {
  if (current == null || previous == null) return "";
  const delta = previous - current; // lower position is better
  if (Math.abs(delta) < REPORT_STABLE_POSITION_DELTA) return ", stable on the previous period";
  return delta > 0 ? `, improved by ${delta.toFixed(1)} places` : `, slipped by ${Math.abs(delta).toFixed(1)} places`;
}

export function buildReportText(snapshot: TReportSnapshotDto): TReportText {
  const month = formatMonthTitle(snapshot.period.from);
  const { gsc, ga4, leads, activities, events, sources } = snapshot;
  const contacts = events.contacts;
  const topQuery = gsc.topQueries.find((row) => (row.clicks ?? 0) > 0);
  const topChannel = ga4.channels.find((row) => (row.sessions ?? 0) > 0);
  const topCountry = ga4.countries.find((row) => (row.sessions ?? 0) > 0);
  const origins = Object.entries(leads.byOrigin)
    .filter(([, count]) => count > 0)
    .map(([origin, count]) => `${formatInt(count)} from ${ORIGIN_LABELS[origin] ?? origin}`);
  const titles = activities.blogs.slice(0, 3).map((blog) => `“${blog.title}”`);

  const figures: string[] = [];
  if (sources.gsc) {
    figures.push(
      `Search Console recorded ${countPhrase(gsc.current.clicks, "click", "clicks")} and ${countPhrase(gsc.current.impressions, "impression", "impressions")}${trend(gsc.current.clicks, gsc.previous.clicks)}.`,
    );
  }
  if (sources.ga4) {
    figures.push(
      `Google Analytics recorded ${countPhrase(ga4.current.sessions, "session", "sessions")} from ${countPhrase(ga4.current.totalUsers, "user", "users")}${trend(ga4.current.sessions, ga4.previous.sessions)}.`,
    );
  }
  const summaryParts: string[] = [
    `During ${month}, the team kept the SEO foundation prepared and worked on the website's search readiness, covering content, service pages and key SEO elements.`,
    figures.join(" "),
    "Overall, the focus stayed on a stronger, more accessible and search-friendly website for long-term growth.",
  ].filter(Boolean);

  const highlights = {
    leads: [
      `${logged(leads.total, "lead", "leads", "recorded")}${trend(leads.total, leads.previousTotal)}.`,
      origins.length > 0 ? `By source: ${origins.join(", ")}.` : "",
    ].filter(Boolean).join(" "),
    calls: `${started(contacts.call, "phone call", "phone calls", "started from the website")}.`,
    emails: `${started(contacts.email, "email click", "email clicks", "on the website")}.`,
    whatsapp: `${started(contacts.whatsapp, "WhatsApp click", "WhatsApp clicks", "on the website")}.`,
    blogs: [
      `${logged(activities.current.blogs, "SEO-focused blog post", "SEO-focused blog posts", "published")}${trend(activities.current.blogs, activities.previous.blogs)}.`,
      titles.length > 0 ? `Topics included ${titles.join(", ")}.` : "",
      activities.current.blogs > 0 ? "Each post was published with proper headings, metadata and semantic structure." : "",
    ].filter(Boolean).join(" "),
    backlinks: [
      `${logged(activities.current.backlinks, "backlink", "backlinks", "published")}${trend(activities.current.backlinks, activities.previous.backlinks)}${activities.current.backlinks > 0 ? " on relevant external websites" : ""}.`,
      activities.current.backlinks > 0 ? "Off-page work aims to improve website authority, visibility and keyword support." : "",
    ].filter(Boolean).join(" "),
    technical: [
      `${logged(activities.current.technical_work, "technical task", "technical tasks", "completed")}${trend(activities.current.technical_work, activities.previous.technical_work)}.`,
      activities.current.technical_work > 0 ? "Work focused on maintaining on-page SEO elements, internal linking and content structure." : "",
    ].filter(Boolean).join(" "),
  };

  const search = sources.gsc
    ? [
        `Search performance in ${month} recorded ${countPhrase(gsc.current.clicks, "click", "clicks")} and ${countPhrase(gsc.current.impressions, "impression", "impressions")}${trend(gsc.current.clicks, gsc.previous.clicks)}, with a click-through rate of ${formatPercent(gsc.current.ctr)} and an average position of ${formatPosition(gsc.current.position)}${positionPhrase(gsc.current.position, gsc.previous.position)}.`,
        [
          topQuery ? `The leading query was “${topQuery.value}” with ${formatInt(topQuery.clicks)} clicks.` : "",
          "Clicks are visits that came from Google results. Impressions show how often the website appeared in those results.",
        ].filter(Boolean).join(" "),
      ].join(PARAGRAPH_BREAK)
    : "No Search Console data is available for this period, so search figures are not included.";

  const organicShare = ga4.current.sessions > 0 ? formatPercent(ga4.current.organicSessions / ga4.current.sessions) : null;
  const traffic = sources.ga4
    ? [
        `The website recorded ${countPhrase(ga4.current.sessions, "session", "sessions")} from ${countPhrase(ga4.current.totalUsers, "user", "users")} in ${month}${trend(ga4.current.sessions, ga4.previous.sessions)}.`,
        [
          organicShare ? `${organicShare} of sessions came from organic search.` : "",
          topChannel ? `The largest channel was ${topChannel.value} with ${countPhrase(topChannel.sessions ?? 0, "session", "sessions")}.` : "",
          topCountry ? `Most sessions came from ${topCountry.value} (${formatInt(topCountry.sessions)}).` : "",
          "Traffic sources show where visitors come from, which helps identify the channels that drive the most results.",
        ].filter(Boolean).join(" "),
      ].join(PARAGRAPH_BREAK)
    : "No Google Analytics data is available for this period, so traffic figures are not included.";

  const engagement = sources.ga4
    ? `Engagement rate was ${formatPercent(ga4.current.engagementRate)} and visitors stayed an average of ${formatDuration(ga4.current.avgSessionDuration)} per session.`
    : "";

  const work = [
    `In ${month} the team logged ${countPhrase(activities.current.blogs, "blog post", "blog posts")}, ${countPhrase(activities.current.backlinks, "backlink", "backlinks")} and ${countPhrase(activities.current.technical_work, "technical task", "technical tasks")}.`,
    "Each item is listed in your dashboard, newest first.",
  ].join(" ");

  return {
    summary: summaryParts.join(PARAGRAPH_BREAK),
    highlights,
    search,
    traffic,
    engagement,
    work,
  };
}

/** Summary shown on report list cards: the written executive summary when there is one, else the generated one. */
export function reportListSummary(snapshot: TReportSnapshotDto): string | null {
  const written = snapshot.notes?.written?.executiveSummary;
  if (written) return richDocFirstParagraph(written);
  return buildReportText(snapshot).summary.split(PARAGRAPH_BREAK)[0] ?? null;
}
