# Assistant AI (Crawllex Insight, read-only tools, Quick Lookup fallback)

**Status:** 2026-11-09: first questions use a code-built brief; follow-ups use Qwen3-4B Q4_K_M on logibox with a grounding check (was Qwen3-8B, then 1.7B tested). Earlier: branch `feature/logibox-llm` (2026-11-03): OpenRouter removed, local model on logibox over Tailscale (`LLM_BASE_URL`, `LLM_USER`, `LLM_PASSWORD`, `LLM_MODEL`). Behind `ASSISTANT_AI_ENABLED=true` + those vars. Previously live on `crawllex-dev` via OpenRouter (2026-10-20).
Production not released yet (see `doc/migration.md`).

## What it does

`POST /api/v1/projects/[id]/assistant/query` (and the streaming twin `…/assistant/query/stream`) first runs the rule-based parser (**Crawllex Quick Lookup**). A recognized question is answered at once, without the model.

Questions the parser does not understand go to the AI path (`lib/assistant/ai/*`). The server reads the project data first (`get_leads_count`, `get_analytics_overview`, `get_seo_activity_counts` for the 30 days ending yesterday, scoped by project and permission). Then:

- **First question in a conversation:** the structured answer is built in code (`lib/assistant/answer/brief.ts`). Sections are Search performance, Website traffic, Engagement, Leads and activity. Only sections with data appear; a failed tool is left out, never shown as zero. No model call, so figures and labels are exact. Answer in about 0.4 s.
- **Explanation or advice questions** ('why', 'what should', 'explain', 'recommend', ...) go to the model even when the rule parser matches a keyword.
- **Follow-up in the same conversation** (earlier turns exist): one model call with the last 4 exchanges, the data, and a follow-up instruction (figures only, at most 3 bullets, under 120 words, `max_tokens` 220). Model: Qwen3-4B Q4_K_M on logibox (`llama-server`, full GPU offload, systemd user unit `llama-qwen`). Replies are grounding-checked before they show (`lib/assistant/answer/grounding.ts`).
- **Questions in another script** (e.g. Arabic) go to the model, which replies in that language.

Thinking off (`chat_template_kwargs.enable_thinking: false`). Explanation or advice questions ('why', 'what should', 'explain', ...) always go to the model. Answers cached per user and normalized question for 5 minutes, first questions only. AI text streamed to the UI.

Measured on logibox with real dev project data (2026-11-09):

| Case | Model | First token | Total |
|---|---|---|---|
| Question, tool loop (before) | Qwen3-8B (deleted) | — | 31–59 s |
| Question, tool loop | Qwen3-4B | 2.5–4.7 s | 13–30 s |
| Question, one model call | Qwen3-4B | 2.5–4.7 s | 13–16 s |
| First question, code brief | none | — | 0.4 s |
| Follow-up, one model call (220 tokens cap) | Qwen3-1.7B Q8_0 (deleted from logibox) | 1.1–2.2 s | 3.9–5.3 s |
| Follow-up, one model call (no cap) | Qwen3-1.7B Q8_0 (deleted) | 1.1–2.0 s | 5–15 s, longer and generic |

Chat test (2026-11-09): Qwen3-1.7B gave a wrong figure ("decreased from 3 to 0"); Qwen3-4B printed literal "Metric:" labels and contradicted itself. Follow-up replies now pass a grounding check before they are shown (`lib/assistant/answer/grounding.ts`); a failed check gives the note "The project data does not explain this." plus the brief. Qwen3-4B is the only model on logibox (Qwen3-8B and Qwen3-1.7B deleted 2026-11-09). Known gap: judgment sentences ("the site isn't performing") are not checked.

Badge in the UI (`components/oriel/oriel-answer.tsx`, Oriel module at `/oriel`):
- **Crawllex Insight**: AI answer.
- **Crawllex Quick Lookup**: rule-based answer.

Names are product names only. Do not describe either path as an in-house model.

## Flow

1. Route guard: `dashboard.view`. Project comes from the route, never from model output.
2. Short greeting ("hi", "hey", "hello", "good morning", optional "there"/"Oriel") → fixed reply "Hey, I am Oriel. What can I help you with?". No data read, no model (`run-query.ts`, `GREETING`).
2b. "Up or down" style question (`isComparisonQuestion`, `lib/assistant/compare.ts`), not an explanation request → code comparison of two periods, no model. Default: this month so far against the same days of last month (1–9 Nov vs 1–9 Oct). Explicit period (date, named, last N days): the same number of days right before it. "All time" has no earlier period, so it uses the default. Denied without `analytics.view` → normal path.
3. Rule parser (`lib/assistant/nlp/*`). A recognized question that is not an explanation or advice request is answered at once, no model.
3. Otherwise the AI path, if `isAssistantAiEnabled()` (`ASSISTANT_AI_ENABLED=true` and all `LLM_*` set) and the circuit breaker is closed.
4. The server reads the project data in code (`get_leads_count`, `get_analytics_overview`, `get_seo_activity_counts`, 30 days ending yesterday, caller's project and permission). The model picks no tools.
5. Period: the question's own period, else the period of the last earlier question in the thread ("so far", then "is it up or down?" keeps all-time). Otherwise the default 30 days ending yesterday. First question of a conversation: the answer is built in code (`lib/assistant/answer/brief.ts`). Follow-up: one model call with the last 4 exchanges, reply capped at 220 tokens, then the grounding check (`lib/assistant/answer/grounding.ts`). A failed check shows the note "The project data does not explain this." plus the brief.
6. Any failure → the rule-based answer or the fixed unknown answer. Response `source` is `ai` or `nlp`.

## Tools (read-only)

| Tool | Permission | Returns |
|------|------------|---------|
| `get_leads_count` | `leads.view` | count of leads in `from`–`to`. No lead PII |
| `get_analytics_overview` | `analytics.view` | GSC + GA4 totals for `from`–`to` |
| `get_analytics_top_dimensions` | `analytics.view` | top N rows (≤ 25) of a dimension for a source |
| `get_seo_activity_counts` | `seo_activities.view` | counts by activity type, optional range |

No write tools exist. Denied permission → `{ error }` returned to the model. Bad tool arguments →
`{ error: "Invalid Tool Arguments." }`. Dates are validated (ISO, `from` ≤ `to`, span ≤ 366 days).

## Provider (local, logibox)

- Endpoint: `${LLM_BASE_URL}/v1/chat/completions` via Caddy basic auth (`/home/logibox/apps/llm-gateway`, tailnet IP only). llama-server injects its own key.
- Public as `https://oriel.logicalcreations.cloud` through the Cloudflare tunnel `logibox` (since 2026-11-09). Unauthenticated requests get 401. Vercel `crawllex-dev` and production use it with `ASSISTANT_AI_ENABLED=true` and the `LLM_*` vars. Tailnet IP still works for local dev.
- Speed (measured 2026-11-03 from workstation): short answer ~5 s, one tool call ~12 s, ~150-word answer ~31 s. Timeout 180 s.
- Data stays on logibox. Lead PII rule still applies (tools return counts only).

## Provider (OpenRouter, removed on this branch)

- Endpoint: OpenAI-compatible `chat/completions` with `tools`. Key sent as `Authorization: Bearer`, never in URL or logs.
- Default model: `dots-studio/dots-3-note-preview:free`. Only free model that returned a valid tool call in
  testing (2026-10-20). Others tested: `google/gemma-4-31b-it:free` and `poolside/laguna-s-2.1:free` rate-limited,
  `nvidia/nemotron-3-super-120b-a12b:free` 404, `minimax/minimax-m3.1-flash:free` blocked by account data policy,
  `thinkingmachines/inkling:free` agentic-harness only, `cohere/north-mini-code:free` answered without a tool call.
- `temperature` 0, `max_tokens` 1024, timeout 25 s per call, route `maxDuration` 60 s.
- One retry after 2 s on HTTP 429. Fallback log: `[assistant-ai] Falling back to NLP. Reason: <reason> (HTTP <status>).`
- Circuit breaker: 3 consecutive failures → AI off for 5 min, per server instance.
- Gemini was removed (2026-10-20): free-tier quota exhausted and latency over 25 s per call.

## Data rule

Free OpenRouter models are run by third-party providers. Some may log or train on prompts. Therefore:
- Lead records (names, emails, phones, messages) are **never** sent to the model. Tools return counts only.
- Analytics rows (search queries, page URLs, countries, devices) are sent. Confirm the data policy of the
  chosen model before using it with client data.
- Account privacy settings on OpenRouter filter which free models are usable (seen as 404 "guardrail restrictions").

## Safety

- Tool results are data. System instruction says to ignore instructions found inside them.
- Tool errors go back to the model as data, not as exceptions.
- Logs: failure reason and HTTP status only. Never the question, the key, or tool results.
- Gaps: prompt-injection defence is prompt-level only. Tool data includes search queries and page URLs,
  which can contain attacker text.

## Config

| Env | Default | Meaning |
|-----|---------|---------|
| `ASSISTANT_AI_ENABLED` | `false` | master switch (no OpenRouter key any more) |
| `LLM_BASE_URL` | (none) | `https://oriel.logicalcreations.cloud` (public tunnel, basic auth). Local dev may use `http://100.90.184.0:8092`. Server-only |
| `LLM_USER` / `LLM_PASSWORD` | (none) | gateway basic auth. Server-only |
| `LLM_MODEL` | `qwen3-4b` | sent to llama-server (ignored by it, one model loaded) |

Hosting (Vercel `crawllex-dev`, Hostinger): set `ASSISTANT_AI_ENABLED=true` and the `LLM_*` vars. The gateway is public at `https://oriel.logicalcreations.cloud` (Cloudflare tunnel, basic auth). Vercel is set and redeployed 2026-11-09; Hostinger production env still to set by hand. `OPENROUTER_*` and `GEMINI_API_KEY` are no longer used and must be removed from every environment.

## Known gaps

- No eval set yet (30–50 golden questions with expected numbers).
- No integration test for the AI → Quick Lookup switch in `run-query.ts` (unit tests cover the loop, client, breaker and fallback).
- Free-model reliability (429, provider changes) not measured beyond a handful of calls.
- No per-project or per-user AI quota. Upstream free quota is shared.
- Breaker is per instance, not global.
- Arabic answers not reviewed.
- Answer rendering is plain text. No markdown support in the UI.

## Tests

`tests/assistant-ai.test.ts` (tools, OpenRouter client, tool loop, breaker, fallback, date prompt),
`tests/assistant-query-variants.test.ts`, `tests/assistant-nlp.test.ts`, `tests/assistant-intent.test.ts`.

> Oriel (chat assistant) docs: `doc/oriel/README.md`. Maintenance rule and checker: `doc/oriel/guides/maintain-oriel-docs.md`, `doc/oriel/tools/check-oriel-docs.sh`.
