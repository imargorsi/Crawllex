# Upcoming feature: WooCommerce store KPIs

**Status:** not started. Parked until the plugin work is scheduled (2026-10-20).

## Goal

After a WooCommerce site is connected through the Crawllex WordPress plugin, show the store's main KPIs inside Crawllex: total orders, revenue, average order value, orders by status, refunds, new customers, top products.

## Approach

- Data is fetched server-side by Crawllex, not by the plugin. The WP application password stays encrypted in Crawllex and never reaches the browser (same path as draft push, `lib/integrations/wordpress/wp-rest.ts`).
- Read only. No writes to WooCommerce. Draft-only rule (AGENTS.md rule 13) is untouched.
- New route: `GET /api/v1/projects/[id]/integrations/lead-sources/[sourceId]/store-kpis?period=7|30|90`. Permission `integrations.view`. Returns a normalized DTO, cached about 15 min.
- Card hidden when WooCommerce is not active on the site. Non-WooCommerce sites are unaffected.

## Data sources (confirm against live site first)

- Counts: `wc/v3/orders` with `after`/`before` and the `X-WP-Total` response header.
- Revenue, AOV, refunds: `wc-analytics/reports/orders/stats` or `wc/v3/reports/sales`. Depends on WooCommerce version.
- Top products: `wc-analytics/reports/products`.
- Currency and formatting: `wc/v3/settings/general`.

## Open questions (resolve before build)

1. Does WooCommerce accept the WP application password for `wc/v3` and `wc-analytics`? If not, the connect flow needs WooCommerce consumer key/secret. That changes the plugin and the credential model.
2. Timezone for "today" and period boundaries: WordPress site timezone vs project timezone.
3. Large stores: pagination cap and fallback when the cap is hit.
4. Multi-currency stores.

## Plugin side

Likely small: report WooCommerce active or not on verify (`hasWooCommerce`). Full KPI pull stays in Crawllex. Plugin version bump and prod-stamped zip per `doc/setup.md` Release Checklist.

## Tests and docs when built

- Tests: mocked WC responses, hidden-card path, error path ("store unreachable", no raw response), currency formatting.
- Strings: en and ar (Arabic flagged for native review).
- Docs: `doc/api.md`, `doc/architecture.md` (WordPress section), `doc/rbac.md` if a permission is added, `doc/migration.md` status.
