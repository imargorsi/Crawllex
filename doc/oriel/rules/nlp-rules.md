# Crawllex NLP rules

How the current Crawllex parser reads a question. Source: `lib/assistant/nlp/*.ts` and `lib/assistant/ai/tools.ts`. Keep in sync with code: any change to those files updates this doc in the same change.

## 1. Normalize (`normalize.ts`)
- Remove `? ! . , ; : " ' \`` and collapse spaces. Lowercase.
- Strip filler phrases, longest first: "i would like to know", "i want to know", "i need to know", "can you please tell me", "could you please tell me", "can you tell me", "could you tell me", "please tell me", "can you please", "could you please", "would you please", "do i have", "did we get", "did i get", "can you", "could you", "would you", "tell me", "please".
- Hyphens in phrases become spaces.

## 2. Write requests are refused (`engine.ts`)
Words: invite, delete, remove, create, add, update, edit, publish, send, email, change. Any of them → unknown (no answer). Crawllex assistant is read-only.

## 3. Typo correction (`correct-query.ts`)
- Only words of 4+ letters. Max edit distance (Damerau-Levenshtein): 1 for 4–6 letters, 2 for 7+.
- Same first letter required. Ties → no correction.
- Stopwords and numbers never corrected. Stopwords: a, an, about, and, are, did, do, for, got, has, have, how, i, in, is, it, just, last, many, me, my, of, on, our, past, please, previous, show, tell, that, the, this, to, was, we, were, what, with, you, plus number words.

## 4. Slots (`lexicon.ts`, `engine.ts`)
- Domain: leads (lead, leads, inquiry, enquiry, form submissions); analytics (analytics, gsc, ga4, traffic, performance, overview, search console, google analytics); seo (seo, seo activities, seo work).
- Metrics: clicks; impressions; ctr (ctr, click through rate); position (position, ranking, rank, average position); sessions; totalUsers (total users, users, visitors); newUsers; organicSessions (organic sessions, organic traffic); pageViews (page views, pageviews, screen views); engagementRate (engagement rate, engagement); avgSessionDuration (session duration, avg duration).
- Dimensions: query (query, keyword, search queries); page (page, top pages, best pages); country (country, geo); device; landing_page (landing page, landing); channel_group (channel, traffic sources).
- Activity types: blogs (blog, post, article); backlinks (backlink, link, link building); technical_work (technical, tech work, fix, web changes). More than one activity type → unknown.
- Ranking words: top, best, highest → "top rows of one dimension".
- Source: gsc (gsc, search console); ga4 (ga4, google analytics). Query and device default to gsc; landing_page and channel_group default to ga4.
- Domain inference: metrics or dimensions → analytics; activity types → seo. Two domains → unknown. No domain → unknown.
- Metric choice order: avgSessionDuration, organicSessions, pageViews, newUsers, engagementRate, ctr, position, impressions, totalUsers, sessions, clicks.
- Dimension choice: landing_page before channel_group. Other multiple dimensions → unknown.
- "page views" with dimension page and no ranking word → metric pageViews.

## 5. Time windows (`parse-duration.ts`, `parse-date.ts`, `windows.ts`)
- Named: today; yesterday; this week (Monday to today); last week (Monday to Sunday before).
- Presets: this month, last month, this year, last year, all (all time, lifetime, overall, in total, so far, till now, to date, total).
- "last|past|previous N days|weeks|months" with digits or words (one … ninety). 15, 30, 90 days = presets. "last day" = 1 day. Shorthand "last 7|14|15|30|60|90" counts.
- Calendar dates: ISO (2026-10-31), "October 31", "31 October", optional year. Ambiguous numeric dates ignored.
- Several windows: pick the most specific. Scores: date 100; today/yesterday 90; this/last week or last N days/weeks/months 70; last 15/30/90 days 60; this/last month 50; this/last year 30; all 10. Equal scores → unknown.
- Defaults: leads → this month; SEO activities → all time; analytics → last 30 days.
- Analytics data ends yesterday (UTC). "today" or a future date → notice "Search data for <label> isn't available yet." and show yesterday.
- Analytics range capped at 366 days (`ANALYTICS_MAX_RANGE_DAYS`).
- Analytics "this week" = Monday to yesterday; on Monday the range is empty.
- Leads and SEO windows use local date. Analytics uses UTC.

## 6. Routing (`run-query.ts`)
0. Short greeting → fixed Oriel reply. No parse, no data, no model.
1. "Up or down" style question (not explanation) → comparison in code (`compare.ts`). Permission `analytics.view` required, else step 2.
2. Parser recognizes the question and it is not an explanation request → permission check → answer from data in code.
3. Parser does not recognize it, or it is an explanation request → AI path if enabled and the breaker is closed. First question: brief built in code. Follow-up: one model call with the thread's period. On failure → step 4.
4. Unknown → "couldn't understand" message.
Breaker: 3 consecutive AI failures → AI off for 5 minutes, per server instance.
Periods: a follow-up or comparison with no period of its own uses the last earlier question's period in the thread. Otherwise the default: 30 days ending yesterday (AI), this month so far vs last month (comparison).

## Planned (not in code yet)
Procedure matching (step 2 of the spec: score ≥ 0.7 against `doc/procedures/`) and general questions via OpenAI (spec 6.3). See `architecture/target.md`.
