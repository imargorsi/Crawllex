# Lens (SEO health and uptime) — UI reference

Status: SEO data is live from the Lens API (`/v1/projects/:id/seo`). Uptime and incidents are still demo data until the uptime phase.
Lens service itself: `/mnt/projects/crawllex-lens` (see its `docs/STATUS.md`).

Sidebar: **Agents & AI** group (`lib/frontend/layout/sidebar-nav.ts`), with Oriel. Label key `lens`.

## Enrollment and checks (decided 2026-11-11, revised)

- **Enroll:** a super admin clicks "Enroll In Lens" in Settings > Modules (category shown to super admin only), for the selected project. `POST /api/v1/projects/[id]/lens/enroll` requires an active project and calls Lens `POST /v1/projects/:id/enroll`. The flag `lensEnrolledAt` is saved only after Lens accepts.
- **First audit:** Lens queues it in the background on enrollment, if the project has no runs. Enrolling again does not queue another.
- **Approval** no longer enrolls a project. Approval and enrollment are separate steps.
- **Lens page:** shown only when the project is enrolled (`lensEnrolled` on the project; sidebar and route guard). Also needs `lens.view`.
- **Later checks:** `lens.run` (restricted, super admin assigns). The Start check button and `POST /api/v1/projects/[id]/lens/runs` require enrollment and `lens.run`.
- **Scheduled checks** are off by default. Lens schedules still exist in the engine.

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
| Contract (Lens to UI) | `features/lens/lens.types.ts` |
| Data hook | `features/lens/use-lens-dashboard.ts` (SEO from API; uptime from demo) |
| Live API | `features/lens/lens.api.ts`, `app/api/v1/projects/[id]/lens/seo/route.ts`, `lib/lens/client.ts`, `lib/lens/config.ts` |
| Uptime demo (temporary) | `features/lens/lens.demo.ts` |
| Entrance motion | `app/globals.css` (`.lens-rise`, honours reduced motion) |
| Page wash | `components/ui/page-backdrop.tsx` (shared with Reports detail) |

Strings: `lens` block in `locales/en.ts` and `locales/ar.ts`. Arabic values are English placeholders until translated.

## Layout (top to bottom)

1. **Header:** title and subtitle, Last check block, Start check button (no action yet).
2. **Top nav:** one glass bar with icons and counts: Overview · SEO Health (open issues) · Pages (checked) · Uptime Monitoring. View History sits beside it (opens scan history). No search. Demo notice is removed from the UI.
3. **Overview**
   - SEO health score card: ring (3 band segments, marker at score), band legend, points to Healthy, Must Fix / Should Fix / Worth a Look tiles, rule-based summary bullets (two columns), uptime block under the ring, partial/complete scan pill and band pill in the card header.
   - Pages affected (severity bars) and Priority issues (top 4 by severity).
   - Four section cards: On-Page SEO, Technical SEO, Pages, Issues (severity strip). On-Page and Technical open the All Issues tab with that type filter set.
   - Uptime monitoring: headline strip (uptime, downtime, incidents, average response, lowest day), 30 daily bars with legend.
4. **SEO Health tab (command center):** current open issues only.
   - Stat tiles: Must Fix (High), Should Fix (Medium), Worth a Look (Advisory), Page Issues. Each has a trend wave with a caption.
   - No outer card: the page sits directly on the backdrop. One filter bar: type tabs (All Issues, On-Page SEO, Technical SEO, with counts) and the shared `TableListSort` dropdowns for rule and severity. Issues are ordered by severity, then affected pages.
   - Rule dropdown (shared `TableListSort`, with counts): Meta Title, Meta Description, Headings, Content, Images, Indexing and Canonicals, Robots and Sitemap, Page URL.
   - Summary list (jump links to each card), partial-scan notice in the header, status and last check shown once in the header.
   - Each issue card (reference layout): severity, type and rule chips; title with the one-line finding; page count on the right. Affected Pages strip with page chips and View All Pages. Four equal panels: What We Found (cyan), Why It Matters (amber), How To Fix (coral, highlighted), AI Suggestion (neutral). Dummy data for AI, source to be decided. Footer: score impact (advisory items say they do not change the score), last check, Open Issue Details.
5. **Pages tab:** header and one filter bar (Issue dropdown), then one list card. Each row shows the URL, the page meta title (or "No title" in red), status, and Must Fix / Should Fix / Worth a Look counts. Counts are open issues on the page, sorted by priority; pages not evaluated show "—". No search. Clicking a row opens the Page Details sheet (`?page=<url>`): scan status, counts, every rule check (Pass, Finding, Not Evaluated), and the issue cards for that page. Escape or the close button closes it.
6. **View History:** header, four figures (fixed since first check, open now, checks completed, checks failed), the scan history table (date with Current marker, status, coverage, score with band and change from the previous completed check, pages checked, new, resolved, open), and the issue log (every issue event: date, event, issue, severity). Failed runs show the error code and no score.
6. **Uptime Monitoring tab:** header, status strip (status, last successful check), four stat tiles (uptime with daily trend, total downtime, incidents, average response with p95), the daily chart with legend, then incident history (select a row) beside the selected incident detail (reason, status, detected, recovered, duration). Same structure as All Issues and Pages.

Clickable cards: `LensClickCard`. Only the four section cards and the tab/button links route (to tabs). Other cards have the affordance but no action yet.

## URL state (shareable screens)

Every view and filter lives in the URL, read and written with `hooks/use-query-params.hook.ts`:

| Param | Values | Default (not written) |
|---|---|---|
| `view` | `seo`, `pages`, `uptime`, `history` | overview |
| `type` | `onpage`, `technical` | all (SEO Health only) |
| `severity` | `high`, `medium`, `advisory` | all (SEO Health only) |
| `sort` | `pages` (Most pages) | severity (SEO Health only) |
| `issue` | issue id (Pages view: pages affected by that issue, shown in the Issue dropdown) | none |
| `page` | page URL (Pages view: opens Page Details sheet) | none |
| `rule` | `titles`, `descriptions`, `headings`, `content`, `images`, `indexing`, `robots`, `urls`, `links`, `structured` | all (SEO Health only) |

Example: `/lens?view=seo&type=technical&severity=high` opens SEO Health, Technical, High. Unknown values fall back to the default. Switching view clears the filters.

## Uptime rules (decided 2026-11-11)

- Uptime monitoring tracks a rolling 30 days. Probe and incident rows older than 30 days are deleted.
- Every active site in Crawllex is monitored by default. Adding or activating a site starts monitoring without a separate step.
- Uptime is a separate monitor event stream. Running or re-running an SEO check does not change uptime figures, incidents, or the daily bars.
- Uptime figures never come from SEO scan results.

Implementation status: rules are decided. Retention job and default enrolment are not built yet (the Lens worker probes only projects with a schedule today).

## Rules the UI follows

- Score bands: Needs attention below 60, Needs work 60–84, Healthy 85 and above.
- Must Fix = high (scored), Should Fix = medium (scored), Worth a Look = advisory (shown, not scored). Same names on the overview, All Issues, and Pages.
- Labels Title Case, descriptions sentence case. Colors from theme tokens only (no raw hex in Lens components).
- Every number shown comes from the view model. Demo values are not computed.

## Data contract (implemented)

The Lens API returns the whole SEO dashboard from `GET /v1/projects/:id/seo` (Lens `src/api/lens-view.ts`). Crawllex passes it through `GET /api/v1/projects/[id]/lens/seo`. The shape is `TLensSeoDashboard` in `features/lens/lens.types.ts`.

- **Rules:** one issue per catalog rule (Lens `src/seo/catalog.ts`, matches `docs/SEO-RULES.md`). Title, found, why, fix and verify text come from Lens. `group` = type (on-page or technical), `ruleGroup` = rule category. Non-catalog engine codes are not shown.
- **Pages:** per URL, state checked or failed, meta title (null when empty), counts (Must Fix, Should Fix, Worth a Look) and `ruleChecks` with result pass, finding or not_evaluated. Not evaluated is never shown as Pass.
- **Runs:** every run with status, coverage, coverage reason (none, cap_reached, gaps), score, pages checked, known URLs, new, resolved and open issues. Failed runs have an error code and no score.
- **Score:** model v1 (Lens `src/seo/score.ts`). Per scored rule, weight (high 10, medium 4) x (0.5 + 0.5 x affected/checked) for page rules; full weight for site rules. Total penalty capped at 60, so the floor is 40. Advisory rules never score. No checked pages means no score (shown as "No score yet").
- **Bands:** below 60 needs attention, 60 to 84 needs work, 85 and above healthy (`scoreBandOf` in `lens-overview.tsx`).
- **Event labels:** Lens returns event codes (opened, seen, reopened, resolved, fix_failed, verified, not_seen_partial, verification_inconclusive). The UI translates them (`EVENT_LABEL_KEY` in `lens-issues.tsx`).
- **AI suggestion:** no source yet. Lens returns `aiSuggestion: null`; the panel says "Not generated yet."
- **Removed (no source):** effort and the old action text. Priority table shows the catalog fix text.

## Not done yet (tracked, not hidden)

- Recent activity and Coverage & trends: removed from Overview. Owner decides whether they return and where.
- Uptime and incidents: demo data (`lens.demo.ts`) until the uptime phase.
- AI suggestion source: not decided. Panel shows "Not generated yet."
- Score numbers: formula implemented in Lens (model v1). Tune on Gate 1 data before release.
- Tier and severity changes: decided (crawllex-lens `docs/SEO-RULES.md`). Re-audit of the Gate 1 site required before the change ships.
- Penalty breakdown view on scan history (stored in the snapshot once the snapshot change lands).
- Arabic translations are first drafts. Need a native review.
- Uptime retention job (30 days) and default enrolment of active sites: decided, not built (see Uptime rules).
- Mobile (390px) pass for all views: not done.
- Tab panels: LensNavBar and LensTabs have tab roles but no linked tabpanel yet.

## Client review pass (2026-11-11)

- Affected page chips open Pages filtered to that URL. View All Pages opens Pages filtered to the issue.
- Open Issue Details shows status (Still Open or Resolved), first seen, and a timeline. View in History opens the history view. No owner, due date, or assignment.
- Stat tiles: Must Fix, Should Fix, Worth a Look. Trend waves sit below the figure and say "Trend, last 7 checks" (dummy data).
- AI Suggestion carries the review note again ("Suggested by AI. Review before you apply it."). This reverses the earlier removal, per the client review.
- Gaps still open: Lens API states (loading, error), mobile pass at 390px, per-issue points cost, page detail view.

## Fixed in the UI pass (2026-11-11)

- Labels use Title Case (tabs, card titles, band names, table headers, buttons).
- Cards that hold their own buttons are not clickable cards (no nested interactive elements).
- Website host shown in the subtitle.
- Pages card shows the coverage breakdown: checked, not checked, reason (crawl limit).
- Pages table has a Not Evaluated state and sorts failed pages first.
- Scan history shows the band under each score and the crawl limit under partial coverage.
