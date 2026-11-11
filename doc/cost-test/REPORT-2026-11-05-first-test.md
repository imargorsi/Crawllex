# DataForSEO first test: LLM Mentions and Local SEO (GBP)

Date: 2026-11-05. Site: https://logicalcreations.net/. Budget: $1.00 free credit. Spent: $0.1094. Balance now: $0.8906.
Raw responses: `/mnt/projects/Crawllex/doc/cost-test/raw/`. Cost log: `/mnt/projects/Crawllex/doc/cost-test/costs.csv`.

## Calls and cost

| # | Endpoint | Input | Items | Cost (USD) | Plan assumed (USD) |
|---|---|---|---|---|---|
| 01 | LLM Mentions `search_mentions/live` | domain logicalcreations.net (incl. subdomains), keywords "AI automation", "website development", location Saudi Arabia (2682), limit 10 | 0 | 0.1000 | 0.10 + 0.001/row (match) |
| 02 | SERP Google Maps `live/advanced` | "web development company", Lahore (1011082), depth 20 | 20 | 0.0020 | 0.0006 per SERP (Standard queue) |
| 03 | Business Data `my_business_info/live` | "Logical Creations", Lahore, Punjab, Pakistan | 1 | 0.0054 | 0.0015 per profile |
| 04 | SERP Google Maps `live/advanced` | "web development company", Jeddah (1012089), depth 20 | 20 | 0.0020 | 0.0006 per SERP (Standard queue) |

Notes:
- Call 02 batch of 2 tasks failed (`40000 You can set only one task at a time`); live endpoints take one task per call. The failed task cost $0. Call 04 re-ran Jeddah separately.
- Live mode is $0.002 per Maps SERP. The plan's $0.0006 is Standard queue (task_post). Live is ~3.3x. Nightly jobs must use task_post.
- LLM Mentions charged $0.10 with 0 results. The task fee is a floor even when nothing matches.

## Data findings

### LLM Mentions (AI visibility)
- logicalcreations.net: 0 mentions across ChatGPT and Google AI for the target set (domain + "AI automation" + "website development", Saudi Arabia, English).
- Result: no AI visibility data for this site at this scope. Expected for a small agency site, but it means the LLM feature will need a broader keyword set or competitor targets to show value.
- Not yet tested: competitor domains from prod record (whetstonez.com, telenoc.org) on the same endpoint. Candidate for the next small test (~$0.10).

### Local SEO: GBP profile (live)
- Title: Logical Creations. Category: Software company. Claimed: yes.
- Address: Plot 106, Block H Phase 2, Johar Town, Lahore, 54000, Pakistan.
- Rating: 4.4 from 15 votes. Distribution: 5 stars 12, 4 stars 1, 1 star 2.
- Website: logicalcreations.net. Photos: 6.
- Identifiers: CID 8518707324733764769, place_id ChIJbbo3KYABGTkRoTRGhC2HOHY.
- Work hours and place topics present in the raw response.
- Note: the 1-star reviews (2) are worth reading with the client. Review text was not pulled in this test.

### Local SEO: Maps rank for "web development company"
- Lahore, top 20: Logical Creations is not in the top 20. Leaders are Lahore agencies with 59 to 263 reviews (e.g. GenXe Technologies 4.9, 263 reviews; Webiconz 4.9, 167 reviews).
- Jeddah, top 20: Logical Creations is not in the top 20. Whetstonez (a prod competitor) ranks #8 with 4.9/5 (rating 5.0, 50 reviews).
- Value: the API shows the exact map pack gap per keyword and city. This is the core local-SEO output for the seniors.

## Not verified or missing
- Business Data Google Reviews: no live endpoint. Needs task_post, so a separate test.
- Search volume and Labs: not in this test (out of scope for $1 budget).
- LLM Mentions: no positive result yet, so the value case rests on the GBP and Maps data for now.

## Recommendation for the $50 approval
- Use this as proof of data quality for local SEO (GBP profile and Maps rank are populated and useful).
- Show LLM Mentions as a zero result, with the cost floor noted. Ask for the competitor test (~$0.10) before the $50 request if the senior needs an AI visibility example.
- Update §5.7 with live vs Standard pricing and the $0.10 LLM floor.

## Second round (same day, remaining credit)

Spent a further $0.6132 (balance $0.8906 to $0.2774). Total spent across both rounds: $0.7226. Full log: `costs.csv`, raw JSON in `raw/`.

### Price checks (planned vs actual)
| Endpoint | Mode | Actual | Plan |
|---|---|---|---|
| Maps SERP, 20 results | Standard task_post | $0.0006 | $0.0006 (confirmed) |
| Maps SERP, 20 results | Live | $0.0020 | $0.0006 (wrong, Live is $0.002) |
| GBP profile | Standard task_post | $0.0015 | $0.0015 (confirmed) |
| GBP profile | Live | $0.0054 | $0.0015 (wrong) |
| GBP reviews, depth 50 | Standard task_post, 15 returned | $0.00375; task_get free | $0.00075 per 10 (consistent) |
| LLM Mentions, any endpoint | Live | $0.10 to $0.11 per task, even with 0 rows | $0.10 + $0.001/row (floor confirmed) |
| Labs domain overview / ranked keywords / competitors | Live | $0.012 per task, 0 items | $0.012 + $0.00012/item (confirmed) |
| Keywords Data search_volume | Live | $0.09 per task, 8 keywords | $0.06 Standard, $0.09 Live (confirmed) |
| Backlinks summary | Live | $0.024 | $0.024 (confirmed) |

### Data findings
- **Keyword volume, Saudi Arabia (Google Ads):** "website development" 12,100/mo, CPC $3.84, low competition. "mobile app development company" 210/mo, CPC $42.10. "AI automation" 390/mo, CPC $7.02. "web development company" 90/mo, CPC $12.79. "AI automation agency" 30/mo.
- **Keyword ideas (Pakistan seeds):** 146,577 total ideas. Top returned: "ai" 368,000/mo, "website design" 6,600/mo, "ai website builder" 3,600/mo, "ai automation" 2,900/mo.
- **Backlinks (logicalcreations.net):** 254 backlinks, 93 referring domains, 0 broken.
- **GBP reviews (15 total, redacted):** 12 five-star, 1 four-star, 2 one-star. Dates 2025-09-23 to 2026-01-29. Zero owner replies. Review text not reproduced in this report.
- **LLM top cited domains, Google AI, SA, for "AI automation" and "website development":** youtube.com (29 mentions), coursera.org (15), reddit.com (15), wikipedia (13), geeksforgeeks (13). No Crawllex-relevant agency domain in the top 10. Competitors in the same citation space are generic learning sites.
- **LLM top cited pages, Google AI, Pakistan, for "software house" and "web development company":** 10 rows returned (not yet reviewed in detail).
- **Labs domain and ranked keywords:** empty in both SA and PK locations. The site has no measurable organic keyword footprint in Labs for these markets.

### Limits
- Labs and LLM Mentions are the weak spots. For this site they return empty or generic data, which is itself a finding for the senior report.
- ChatGPT-platform LLM Mentions rejected the location field (`40000` / `Invalid Field`). Not charged. Needs a fix before the full test.
- Balance kept at $0.2774 for the full test.
