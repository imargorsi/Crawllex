# Functional corpus manifest

Source: `doc/source/Crawllex — Product Manual.md` (Product Manual, sections 1–8).
Purpose: the only text the customer chatbot (Oriel) may use for answers.

## Included
| File | Source section | Notes |
|---|---|---|
| 01-what-is-crawllex.md | 1 (intro, Core Capabilities) | Platform Stack table excluded |
| 02-who-it-serves.md | 3 | |
| 03-product-principles.md | 4 | |
| 04-how-the-product-works.md | 5 | Flow diagram rewritten as steps; no internal wording |
| 05-access-and-governance.md | 6 | |
| 06-capabilities.md | 7.1–7.11 | 7.8: internal cache/sync wording replaced |
| 07-integrations.md | 8 | File storage and transactional email rows excluded (implementation-level) |

## Excluded
- Section 2 (The Problem): marketing text, not needed for user questions.
- Section 1 "Platform Stack": technology choices (implementation).
- `doc/` engineering files: api.md, architecture.md, rbac.md, migration.md, setup.md, service-tokens.md, assistant-ai.md, reports.md, roadmap-*.md, HANDOFF-product-plan-v2.md.
- `doc/source/product-plan-*`, `SEO Dashboard - By Modules`: not reviewed; not included.

## Known gaps
- Tables rebuilt as markdown (2026-11-03) in files 01, 02, 04, 05, 06, 07. Content unchanged; re-check against the source if the Product Manual changes.
- Not yet reviewed by the product owner. Sign-off needed before use in a customer bot.

## Scrub check
Terms checked (case-insensitive): MongoDB, Next.js, TypeScript, Cloudflare, R2, service account, API, REST, cache, Vercel, Hostinger, OpenRouter, database, endpoint, backfill, incremental, stack.
Result after fixes: no implementation hits. Password and login words are kept: they are user-facing features.
