import type { CustomEntityExample } from "wink-nlp";

/** wink-nlp custom entities. Names encode slot + value (`domain.leads`). */
export const ASSISTANT_CUSTOM_ENTITIES: CustomEntityExample[] = [
  {
    name: "domain.leads",
    patterns: ["[lead|leads]", "[inquiry|inquiries]", "[enquiry|enquiries]", "form submissions"],
  },
  {
    name: "domain.analytics",
    patterns: [
      "[analytics|gsc|ga4|traffic|performance|overview]",
      "search console",
      "google analytics",
      "search performance",
    ],
  },
  {
    name: "domain.seo",
    patterns: ["[seo]", "seo activities", "seo activity", "seo work"],
  },
  {
    name: "window.today",
    patterns: ["[today]", "for today"],
  },
  {
    name: "window.yesterday",
    patterns: ["[yesterday]", "for yesterday"],
  },
  {
    name: "window.this_week",
    patterns: ["this week", "current week"],
  },
  {
    name: "window.last_week",
    patterns: ["last week", "past week", "previous week"],
  },
  {
    name: "window.this_month",
    patterns: ["this month", "current month"],
  },
  {
    name: "window.last_month",
    patterns: ["last month", "previous month", "past month"],
  },
  {
    name: "window.this_year",
    patterns: ["this year", "current year", "year to date", "ytd"],
  },
  {
    name: "window.last_year",
    patterns: ["last year", "previous year", "past year"],
  },
  {
    name: "window.all",
    patterns: [
      "all time",
      "all-time",
      "lifetime",
      "overall",
      "in total",
      "so far",
      "till now",
      "until now",
      "up to now",
      "to date",
    ],
  },
  {
    name: "metric.clicks",
    patterns: ["[click|clicks]"],
  },
  {
    name: "metric.impressions",
    patterns: ["[impression|impressions]"],
  },
  {
    name: "metric.ctr",
    patterns: ["ctr", "click through rate", "click-through rate", "click through", "avg ctr"],
  },
  {
    name: "metric.position",
    patterns: ["[position|ranking|rank]", "average position", "avg position"],
  },
  {
    name: "metric.sessions",
    patterns: ["[session|sessions]"],
  },
  {
    name: "metric.totalUsers",
    patterns: ["total users", "[users]", "[visitor|visitors]"],
  },
  {
    name: "metric.newUsers",
    patterns: ["new users", "new visitors"],
  },
  {
    name: "metric.organicSessions",
    patterns: ["organic sessions", "organic traffic"],
  },
  {
    name: "metric.pageViews",
    patterns: ["page views", "pageviews", "page view", "screen page views", "screen views"],
  },
  {
    name: "metric.engagementRate",
    patterns: ["engagement rate", "engagement"],
  },
  {
    name: "metric.avgSessionDuration",
    patterns: ["session duration", "average session duration", "avg session duration", "avg duration"],
  },
  {
    name: "dimension.query",
    patterns: ["[query|queries|keyword|keywords]", "search queries", "search query"],
  },
  {
    name: "dimension.page",
    patterns: ["[page|pages]", "top pages", "best pages"],
  },
  {
    name: "dimension.country",
    patterns: ["[country|countries|geo|geos]", "top countries"],
  },
  {
    name: "dimension.device",
    patterns: ["[device|devices]"],
  },
  {
    name: "dimension.landing_page",
    patterns: ["landing [page|pages]", "landing"],
  },
  {
    name: "dimension.channel_group",
    patterns: ["[channel|channels]", "traffic sources", "channel group"],
  },
  {
    name: "activity.blogs",
    patterns: ["[blog|blogs|post|posts|article|articles]", "blog posts"],
  },
  {
    name: "activity.backlinks",
    patterns: ["[backlink|backlinks]", "[link|links]", "link building"],
  },
  {
    name: "activity.technical_work",
    patterns: ["technical work", "technical", "tech work", "[fix|fixes]", "web changes"],
  },
  {
    name: "topic.top",
    patterns: ["[top|best|highest]"],
  },
  {
    name: "source.gsc",
    patterns: ["[gsc]", "search console"],
  },
  {
    name: "source.ga4",
    patterns: ["[ga4]", "google analytics"],
  },
];

/** Lowercase literals from custom-entity patterns — used for typo correction. */
export const ASSISTANT_LEXICON_TERMS: readonly string[] = (() => {
  const terms = new Set<string>();
  for (const entity of ASSISTANT_CUSTOM_ENTITIES) {
    for (const pattern of entity.patterns) {
      const stripped = pattern.replace(/\b[A-Z]{2,}\b/g, " ");
      for (const chunk of stripped.split(/\s+/)) {
        const inner = chunk.replace(/^\[/, "").replace(/\]$/, "");
        for (const alt of inner.split("|")) {
          const word = alt.trim().toLowerCase();
          if (word.length >= 3 && /^[a-z][a-z0-9-]*$/.test(word)) terms.add(word);
        }
      }
    }
  }
  return [...terms];
})();

export const ASSISTANT_LEXICON_TERM_SET: ReadonlySet<string> = new Set(ASSISTANT_LEXICON_TERMS);

/** Single-token literals → entity name, so corrected typos still fill slots if wink misses. */
export const ASSISTANT_TERM_ENTITIES: Readonly<Record<string, string>> = (() => {
  const map: Record<string, string> = {};
  for (const entity of ASSISTANT_CUSTOM_ENTITIES) {
    for (const pattern of entity.patterns) {
      if (pattern.includes(" ") || /[A-Z]{2,}/.test(pattern)) continue;
      const inner = pattern.replace(/^\[/, "").replace(/\]$/, "");
      for (const alt of inner.split("|")) {
        const word = alt.trim().toLowerCase();
        if (word.length >= 3 && /^[a-z][a-z0-9-]*$/.test(word) && map[word] == null) {
          map[word] = entity.name;
        }
      }
    }
  }
  return map;
})();

/** Multi-word patterns → entity name, longest first. */
export const ASSISTANT_PHRASE_ENTITIES: ReadonlyArray<{ phrase: string; entity: string }> = (() => {
  const items: Array<{ phrase: string; entity: string }> = [];
  const seen = new Set<string>();
  for (const entity of ASSISTANT_CUSTOM_ENTITIES) {
    for (const pattern of entity.patterns) {
      if (!pattern.includes(" ") || /[A-Z]{2,}/.test(pattern) || pattern.includes("[")) continue;
      const phrase = pattern.toLowerCase().replace(/-/g, " ");
      if (seen.has(phrase)) continue;
      seen.add(phrase);
      items.push({ phrase, entity: entity.name });
    }
  }
  items.sort((a, b) => b.phrase.length - a.phrase.length);
  return items;
})();
