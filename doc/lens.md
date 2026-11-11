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
2. **Tab row:** Overview · SEO health · Uptime monitoring, then View history. Demo notice is removed from the UI.
3. **Overview**
   - SEO health score card: ring (3 band segments, marker at score), band legend, points to Healthy, Failed / Warnings / Notices tiles, rule-based summary bullets (two columns), uptime block under the ring, partial/complete scan pill and band pill in the card header.
   - Pages affected (severity bars) and Priority issues (top 4 by severity).
   - Four section cards: On-page SEO, Technical SEO, Pages, Issues (severity strip).
   - Uptime monitoring: headline strip (uptime, downtime, incidents, average response, lowest day), 30 daily bars with legend.
4. **SEO health tab:** subtabs All issues · On-page SEO · Technical SEO · Pages. Issue rows expand to found / why it matters / how to fix / how to verify / affected pages.
5. **View history:** scan history table (date, status, coverage, score, pages checked, new, resolved, open). Failed runs show error code, no score.
6. **Uptime monitoring tab:** current status, availability, response time, daily timeline, incident history with detail panel.

Clickable cards: `LensClickCard`. Only the four section cards and the tab/button links route (to tabs). Other cards have the affordance but no action yet.

## Rules the UI follows

- Score bands: Needs attention below 60, Needs work 60–84, Healthy 85 and above.
- Failed = must fix, Warnings = should fix, Notices = advisory (shown, not scored).
- Labels Title Case, descriptions sentence case. Colors from theme tokens only (no raw hex in Lens components).
- Every number shown comes from the view model. Demo values are not computed.

## Not done yet (tracked, not hidden)

- Live data and API states (not connected, load failed, empty). Their strings were removed as unused and must return with the API.
- Scoring formula change and per-run score snapshot (see crawllex-lens `docs/DECISIONS.md`, pending owner approval).
- Website identity (domain) and coverage detail (discovered / selected / checked / not checked) on Overview.
- Recent activity and Coverage & trends were removed from Overview to fit the agreed layout.
- Pages and Issues as separate pages (currently SEO health subtabs).
- Arabic translations.
