# Ticket: Crawllex v2 product plan

- Date: 2026-10-29
- Type: Documentation
- Status: Done, pending owner items (below)
- Owner: product owner (m.arsalan)

## Summary

Wrote the full Crawllex v2 product plan as a presentable document, with a SaaS layer (positioning, metrics, trial, billing, ops, compliance). Agents (Lens, Radar, Compass, Connect) and agent credits moved to a v3 brief in Appendix A.

## Done today

- Rebuilt the v2 doc. Sections: product overview, tiers and feature matrix, built modules, reports, DataForSEO and local SEO, Crawllex Insight assistant, notifications, mobile app (read only), lead integrations, shared platform, known gaps, decision log, roadmap and launch checklist, sources, Appendix A.
- Cost model for one project: about $4.80 per month (Crestora, 100 keywords), about $8.90 (Peakra, 300 keywords). Based on DataForSEO list prices.
- Verified against official docs: OpenAI pricing (gpt-5.6-luna), Webflow webhook signing, Shopify webhook HMAC.
- Decided: tier names (Sprouta, Crestora, Peakra, Ranovia), assistant name (Oriel), lead statuses, report retention, chat retention, mobile token lifetimes, lead sources per tier, assistant caps.
- Added SaaS layer: 2.4 market and positioning, 2.5 success metrics, 2.6 trial and onboarding, 10.6 billing and account model, 10.7 support and operations, 10.8 compliance outline.

## Files

- `/mnt/projects/Crawllex/doc/doc/source/product-plan-v2.md` (source)
- `/mnt/projects/Crawllex/doc/doc/source/product-plan-v2.docx`
- `/mnt/projects/Crawllex/doc/doc/source/product-plan-v2.odt`
- `/mnt/projects/Crawllex/doc/doc/source/build-product-plan.sh` (rebuild)
- `/mnt/projects/Crawllex/doc/HANDOFF-product-plan-v2.md`

## Owner items (not done by this ticket)

1. Set prices (D12).
2. Confirm payment provider (Paddle recommended; Stripe fallback).
3. Choose MongoDB Atlas region and R2 jurisdiction (before first paid DPA).
4. Support and on-call staffing.
5. Lawyer review: DPA, terms, regional laws.
6. Formal trademark search: Sprouta, Crestora, Peakra, Ranovia, Oriel. Brand clearance for Crawllex.
7. Apple Developer and Google Play accounts.

## Notes

- Web searches are not trademark clearance.
- OpenAI, payment-provider and competitor prices come from secondary sources in parts. Re-check before public use.
