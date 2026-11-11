# Crawllex code map (Oriel-related)

Repo: `/mnt/projects/Crawllex`. Branch with current AI work: `feature/logibox-llm` (pushed to origin, commit 3958993).

| File | Role |
|---|---|
| `lib/assistant/detect-intent.ts` | intent from parse; permission per intent |
| `lib/assistant/nlp/*.ts` | NLP parser: normalize, filler strip, typo correction, lexicon, dates, durations, windows, engine (see `rules/nlp-rules.md`) |
| `lib/assistant/handle-intent.ts` | answer text for each intent; unknown and denied messages |
| `lib/assistant/run-query.ts` | entry: AI first (if enabled), then NLP |
| `lib/assistant/ai/run-ai-query.ts` | AI tool loop, system instruction, circuit breaker |
| `lib/assistant/ai/llm-client.ts` | HTTP client to the logibox gateway (Basic auth, reasoning off, 180 s timeout, lowercase JSON Schema types) |
| `lib/assistant/ai/tools.ts` | four read-only tools and their schemas |
| `tests/assistant-ai.test.ts` | client, tool loop, schema, fallback tests |

Env (in `.env.local`, gitignored): `ASSISTANT_AI_ENABLED`, `LLM_BASE_URL`, `LLM_USER`, `LLM_PASSWORD`, `LLM_MODEL`.

Note: `AGENTS.md` and `doc/` are excluded from git in this repo (`.git/info/exclude` and `.gitignore`).

## Oriel retrieval layer (branch feature/oriel-retrieval, commit 151fd44, pushed)
| File | Role |
|---|---|
| `lib/oriel/config.ts` | flags and settings: `ORIEL_ENABLED`, `ORIEL_CORPUS_DIR`, `ORIEL_BASE_URL`, `ORIEL_API_KEY`; top-k 3, min score 1.5, 500 chars, 120 s timeout, 20 req/min |
| `lib/oriel/corpus.ts` | loads `*.md` from the corpus folder (MANIFEST excluded); chunks by `#`/`##`/`###`; keeps heading path |
| `lib/oriel/retrieve.ts` | tokenizer (stopwords incl. "crawllex", crude stemming) and BM25 scoring; a chunk needs 2 matched query terms (1 if the query has one term) |
| `lib/oriel/answer.ts` | `answerGuideQuestion`: no hits → fixed sentence, no model call; hits → grounded prompt; leak in output → fixed sentence |
| `lib/oriel/output-guard.ts` | internal-term list for answers (same family as the eval leak list) |
| `lib/oriel/client.ts` | Bearer call to the Oriel API on logibox; errors carry reason codes only |
| `lib/oriel/rate-limit.ts` | per-user sliding window (per instance) |
| `schemas/oriel.ts` | request schema |
| `app/api/v1/projects/[id]/oriel/query/route.ts` | auth guards, `dashboard.view` permission, rate limit, flag check, safe errors (503 when unavailable) |
| `tests/oriel.test.ts` | 17 unit tests (corpus, retrieval, answers, guards, rate limit, client) |

Local settings (`.env.local`, gitignored): `ORIEL_ENABLED`, `ORIEL_BASE_URL`, `ORIEL_API_KEY`.
Known limit: Latin-script keyword retrieval only. Arabic and other-language questions get no hits and receive the English fixed sentence.

## Oriel module, shortcut and conversation threads (2026-11-09, branch feature/oriel-module)
| File | Role |
|---|---|
| `models/AssistantQueryHistory.ts` | `threadId` (default null for legacy rows), `answer` (max 4000) |
| `lib/assistant/history.ts` | thread list (aggregate, 30), thread messages (100, own rows only), retention 500 per user and project, title = first question (60 chars), delete one thread or all threads of a user in a project |
| `lib/assistant/run-query.ts` | accepts optional `threadId`; returns `threadId`; stores answer text |
| `schemas/assistant.ts` | optional `threadId` (8–64 chars, `[A-Za-z0-9-]`) |
| `app/api/v1/projects/[id]/assistant/threads/route.ts` | GET own thread list; DELETE all own threads in the project |
| `app/api/v1/projects/[id]/assistant/threads/[threadId]/route.ts` | GET and DELETE one own thread, 404 if not found |
| `features/assistant/assistant.api.ts` | thread list, thread, query, delete-one and delete-all hooks |
| `app/(dashboard)/oriel/page.tsx`, `sections/oriel-section.tsx` | Oriel page (`/oriel`) |
| `lib/frontend/oriel/handoff.ts` | one-shot sessionStorage hand-off (question or conversation id) from the dashboard shortcut to Oriel |
| `components/oriel/*` | workspace (data flow), sidebar, conversation list, thread, message, composer, suggestions, answer renderer (`oriel-answer.tsx`) |
| `components/dashboard/dashboard-oriel-shortcut.tsx` | dashboard shortcut: question box, suggestions, recent chats; every action opens `/oriel` |
| `sections/dashboard-home-section.tsx` | dashboard keeps pulse, trend grid, export and date filter; the shortcut replaces the old assistant panel |
| `lib/frontend/layout/sidebar-nav.ts`, `route-access.ts`, `dashboard-breadcrumbs.ts` | Oriel nav item, `dashboard.view` route rule, breadcrumb |
| `locales/en.ts`, `locales/ar.ts` | `oriel.*` strings; `home.assistant.*` pruned to the strings still used (greeting, suggestions) |
| removed | dashboard-assistant-panel, -greeting, -question-list, assistant-neon-outline, `assistant-ai-well` CSS, `use-typing-placeholder` hook, `assistantTypingPhrases`, `GET assistant/history` route and its hook |
| `tests/assistant-threads.test.ts`, `tests/assistant-thread-delete.test.ts`, `tests/oriel.test.ts` | title and id schema, delete scoping (own rows only), Oriel retrieval and guards |

