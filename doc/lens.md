# Lens (SEO health and uptime) — UI reference

Status: UI phase done on `feature/lens-dashboard`, demo data only. Live API wiring is the next phase.
Lens service itself: `/mnt/projects/crawllex-lens` (see its `docs/STATUS.md`).

## Route and files

| Item | Location |
|------|----------|
| Page | `app/(dashboard)/lens/page.tsx` → `sections/lens-section.tsx` |
| Overview | `components/lens/lens-overview.tsx` |
| SEO health tab | `components/lens/lens-seo-health.tsx` |
| Uptime tab | `components/lens/lens-uptime.tsx` |
| Shared UI | `components/lens/lens-ui.tsx` (cards, pills, ring, tabs, severity bars) |
| Summary bullets | `components/lens/lens-seo-summary.tsx`, `lib/lens/seo-summary.ts` |
| Uptime bars and legend | `components/lens/lens-charts.tsx` |
| Data (phase 1) | `features/lens/lens.demo.ts`, `features/lens/use-lens-dashboard.ts` |
| Live API client (phase 3) | `features/lens/lens.api.ts`, `lib/lens/client.ts`, `lib/lens/config.ts` |
| Entrance motion | `app/globals.css` (`.lens-rise`, honours reduced motion) |
| Page wash | `components/ui/page-backdrop.tsx` (shared with Reports detail) |

Strings: `lens` block in `locales/en.ts` and `locales/ar.ts`. Arabic values are English placeholders until translated.

## Layout (top to bottom)

1. **Header:** title and subtitle, Last check block, Start check button (no action yet).
2. **Tab row:** Overview · SEO Health · Pages · Uptime Monitoring, then View History (opens scan history). Demo notice is removed from the UI.
3. **Overview**
   - SEO health score card: ring (3 band segments, marker at score), band legend, points to Healthy, Failed / Warnings / Notices tiles, rule-based summary bullets (two columns), uptime block under the ring, partial/complete scan pill and band pill in the card header.
   - Pages affected (severity bars) and Priority issues (top 4 by severity).
   - Four section cards: On-Page SEO, Technical SEO, Pages, Issues (severity strip). On-Page and Technical open the All Issues tab with that type filter set.
   - Uptime monitoring: headline strip (uptime, downtime, incidents, average response, lowest day), 30 daily bars with legend.
4. **SEO Health tab (command center):** current open issues only.
   - Summary tiles: High, Medium, Advisory, Page Issues.
   - Type tabs (All, On-Page, Technical) with counts. Severity uses the shared `TableListSort` dropdown. Issues are ordered by severity, then affected pages.
   - Rule tabs with counts (Meta Title, Meta Description, Headings, Content, Images, Indexing and Canonicals, Robots and Sitemap, Page URL).
   - Each issue card: severity, type and rule chips, title, affected page count; What We Found and Why It Matters beside How to Fix and Affected Pages. Nothing is hidden.
   - Resolved issues are not shown here. They belong in View History.
5. **Pages tab:** every checked page with status (Checked, Check Failed, Not Evaluated) and issue counts, sorted by priority, with URL search. Detailed per-page SEO report comes later.
6. **View History:** scan history table (date, status, coverage, score, pages checked, new, resolved, open). Failed runs show error code, no score.
6. **Uptime monitoring tab:** current status, availability, response time, daily timeline, incident history with detail panel.

Clickable cards: `LensClickCard`. Only the four section cards and the tab/button links route (to tabs). Other cards have the affordance but no action yet.

## Rules the UI follows

- Score bands: Needs attention below 60, Needs work 60–84, Healthy 85 and above.
- Failed = must fix, Warnings = should fix, Notices = advisory (shown, not scored).
- Labels Title Case, descriptions sentence case. Colors from theme tokens only (no raw hex in Lens components).
- Every number shown comes from the view model. Demo values are not computed.

## Data contract (proposed, not implemented)

Per completed run, saved snapshot (Lens `docs/DECISIONS.md`, 2026-11-11):
score, score band, score model version, pages checked, known URLs, coverage (complete or partial), coverage reason (none, cap_reached, gaps), scored high rules, scored medium rules, advisory rules, pages affected, new / resolved / reopened / still open issues, penalty breakdown.

Evaluation per rule and page: Pass, Finding, Not applicable, Not evaluated. Not evaluated is never shown as Pass.

Failed run: listed as failed with its error code, no score. Current view = latest completed run. Partial run: scored with a partial label, never resolves issues.

Score formula (proposed): per scored rule, weight (high 10, medium 4, advisory 0) × (0.5 + 0.5 × affected/checked). Site-wide findings count as full weight. Total capped at 60, so the floor is 40. Advisory rules never score. Numbers to be tuned on Gate 1 data.

## Not done yet (tracked, not hidden)

- Recent activity and Coverage & trends: removed from Overview. Owner decides whether they return and where.
- Live data and API states (not connected, load failed, empty). Their strings were removed as unused and return with the API.
- Scoring formula change and per-run score snapshot (see Data contract; crawllex-lens `docs/DECISIONS.md`, pending owner approval).
- Advisory tier and severity changes (crawllex-lens `docs/SEO-RULES.md`, pending owner approval and a re-audit).
- Penalty breakdown view on scan history (stored in the snapshot once the snapshot change lands).
- Arabic translations are first drafts. Need a native review.

## Fixed in the UI pass (2026-11-11)

- Labels use Title Case (tabs, card titles, band names, table headers, buttons).
- Cards that hold their own buttons are not clickable cards (no nested interactive elements).
- Website host shown in the subtitle.
- Pages card shows the coverage breakdown: checked, not checked, reason (crawl limit).
- Pages table has a Not Evaluated state and sorts failed pages first.
- Scan history shows the band under each score and the crawl limit under partial coverage.
