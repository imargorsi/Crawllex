# Architecture: current (as of 2026-11-09)

```
User question (Oriel module at /oriel, POST /api/v1/projects/[id]/assistant/query)
  │
  ├─ run-query.ts
  │    ├─ if ASSISTANT_AI_ENABLED and LLM config set and breaker closed:
  │    │    run-ai-query.ts  ──tools──► tools.ts (read-only data, RBAC by project access)
  │    │         │
  │    │         └─ llm-client.ts ──HTTPS Basic auth over Tailscale──► logibox
  │    │                 Caddy :8092 (tailnet IP only) ──► llama-server 127.0.0.1:8091 (Qwen3-4B)
  │    │    on failure → log reason + HTTP status → fall back
  │    └─ NLP: nlp/* parse → detect-intent (permission) → handle-intent (answer text)
  └─ history: appendAssistantHistory (per user, project and thread)
```

## Components
| Component | Host | Notes |
|---|---|---|
| Crawllex app | workstation (dev), Vercel (crawllex-dev, prod) | Vercel cannot reach logibox |
| Dev server | workstation :3000 | needs tailnet to reach logibox |
| Gateway | logibox `llm-gateway` (Docker) | tailnet only, 100.90.184.0:8092 |
| Model server | logibox `llama-qwen.service` | loopback only, 127.0.0.1:8091 |
| Hermes profile `oriel` | logibox | configured; API on tailnet 100.90.184.0:8643; called by the Crawllex retrieval route |
| Oriel retrieval route | Crawllex app | `POST /api/v1/projects/[id]/oriel/query`, flag `ORIEL_ENABLED`; corpus retrieval then grounded call to Oriel |

## Dashboard and Oriel (2026-11-09)
Dashboard home shows a shortcut (`dashboard-oriel-shortcut.tsx`): question box, suggestions and recent chats. All of it opens `/oriel`, which runs the conversation (`components/oriel/*`). Threads are per user and project. Users can delete one or all of them. Guide answers through the Oriel route are not yet wired into the chat.

## Known limits
- AI path timeout 180 s; Vercel route maxDuration is 60 s. The AI path cannot work on Vercel as is.
- Qwen3-4B on logibox (2026-11-09, only model on the server): follow-up answers take about 13–20 s; first questions are built in code (about 0.4 s). Replies are checked against the data before they are shown. Qwen3-8B (31–59 s with the tool loop) and Qwen3-1.7B (wrong figures in the chat test) were removed from logibox.
- Oriel (Hermes) and the Crawllex AI path (`assistant/query`) are separate. The Oriel route is not yet used by the Oriel chat.
- Oriel call time: about 35 s for a grounded answer on the subscription model (measured 2026-11-03).
