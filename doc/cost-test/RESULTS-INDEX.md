# DataForSEO test results index

Client: logicalcreations.net. Test date: 2026-11-05. Raw responses are in `raw/`, one file per call. Costs are in `costs.csv`. Summary in `REPORT-2026-11-05-first-test.md`. Senior PDF: `DataForSEO-test-report-2026-11-05.pdf`.

Free calls (no charge): `00_locations_PK.json`, `00_locations_SA.json` (location codes). Failed calls, not charged: `19_llm_search_chatgpt_pk.json` (40000, location field rejected).

| File | Endpoint | Mode | Cost (USD) | Key result |
|---|---|---|---|---|
| 01_llm_mentions_search.json | ai_optimization/llm_mentions/search_mentions | Live | 0.10 | 0 mentions, logicalcreations.net, SA |
| 02_serp_maps.json | serp/google/maps/live/advanced, Lahore (1011082) | Live | 0.002 | 20 results; logicalcreations.net not in top 20 |
| 03_gbp_info.json | business_data/google/my_business_info/live | Live | 0.0054 | Logical Creations: 4.4 from 15 votes, CID 8518707324733764769 |
| 04_serp_maps_jeddah.json | serp/google/maps/live/advanced, Jeddah (1012089) | Live | 0.002 | 20 results; Whetstonez #8 |
| 05_labs_domain_overview.json | dataforseo_labs/google/domain_rank_overview, SA | Live | 0.012 | 0 items |
| 06_labs_keyword_ideas.json | dataforseo_labs/google/keyword_ideas, PK, 3 seeds | Live | 0.0156 | 146,577 total; 30 returned |
| 07_search_volume.json | keywords_data/google_ads/search_volume, SA, 8 kw | Live | 0.09 | Volumes 30 to 12,100/mo |
| 08_llm_top_domains.json | llm_mentions/top_mentioned_domains, SA | Live | 0.11 | youtube 29, coursera 15, reddit 15 |
| 09_llm_competitors_search.json | llm_mentions/search_mentions, whetstonez.com + telenoc.org | Live | 0.10 | 0 mentions |
| 10_maps_standard_task_post.json | serp/google/maps/task_post, Lahore (Standard) | Standard | 0.0006 | task submitted |
| 10_maps_standard_task_get.json | serp/google/maps/task_get/advanced | free result | 0.0006 | 20 results, same as live |
| 11_gbp_reviews_task_post.json | business_data/google/reviews/task_post, depth 50 | Standard | 0.00375 | task submitted |
| 11_gbp_reviews_task_get.json | business_data/google/reviews/task_get | free result | 0 | 15 reviews: 12 five-star, 1 four-star, 2 one-star; 0 owner replies |
| 12_gbp_info_task_post.json | business_data/google/my_business_info/task_post | Standard | 0.0015 | task submitted |
| 12_gbp_info_task_get.json | business_data/google/my_business_info/task_get | free result | 0 | same listing as live |
| 13_labs_ranked_keywords.json | dataforseo_labs/google/ranked_keywords, SA | Live | 0.012 | 0 items |
| 14_labs_competitors.json | dataforseo_labs/google/competitors_domain, SA | Live | 0.012 | 0 items |
| 15_backlinks_summary.json | backlinks/summary/live | Live | 0.024036 | 254 backlinks, 93 referring domains, 0 broken |
| 16_llm_top_brands.json | llm_mentions/top_mentioned_brands, SA | Live | 0.10 | 0 items |
| 17_labs_domain_overview_pk.json | domain_rank_overview, PK | Live | 0.012 | 0 items |
| 18_labs_ranked_keywords_pk.json | ranked_keywords, PK | Live | 0.012 | 0 items |
| 20_llm_top_pages_pk.json | llm_mentions/top_mentioned_pages, PK | Live | 0.11 | 10 rows, not yet reviewed in detail |

Totals: 19 charged calls. Spent $0.7226 across both rounds. Balance $0.2774.

Not yet done: review the 10 rows in `20_llm_top_pages_pk.json`. Reviews text was not extracted (redacted for the report).
