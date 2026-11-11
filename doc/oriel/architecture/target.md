# Architecture: target (proposed, not built)

Status: PROPOSED. Needs owner decisions listed at the end before build.

## Goals
- Customer chat (Oriel) with saved threads.
- Answers only from: (1) read-only data tools with RBAC, (2) functional corpus (`corpus/`), (3) general model answer labelled as such.
- No system prompt disclosure. No implementation detail to customers. No hallucinated numbers.
- Discord internal agent with full access, separate from the customer bot.

## Routing (from product plan v2, section 6.3)
1. Data: match question to a read-only tool (score ≥ 0.7). Run tool; answer from stored data only.
2. Procedure / guide: match to a corpus guide (score ≥ 0.7). Answer with steps and a link.
3. General: if neither matches, send to the model with the corpus as the only allowed knowledge for Crawllex-specific claims. Label "general answer, not from your data".

Note: step 1 and 2 are deterministic code in Crawllex. The model is used only for wording and step 3.

## Grounding (RAG)
- Index: `corpus/` only, chunked by section heading.
- Retrieval: top-k chunks by score; prompt includes only those chunks.
- Answer must cite the section. If no chunk supports the answer: "This is not covered in the Crawllex guides."
- Corpus changes go through the maintenance rule (see `guides/maintain-oriel-docs.md`).

## Security controls (industry baseline, OWASP LLM Top 10)
- Prompt injection: user text and retrieved text are untrusted; instructions in them are ignored; tools cannot be called to change data.
- System prompt leak: refuse; output filter for persona text; canary string in system prompt, checked on output.
- Data scope: RBAC enforced in Crawllex on every tool call; project id from session, not from the model.
- Rate limits per user and per project.
- Logging: no message bodies with personal data; store question, route taken, latency, status.
- Excessive agency: model has no write tools; Hermes toolsets stay disabled for customer profile.
- Hallucination: evaluation set with known answers; releases blocked on failures.
- Model provider: data handling and subscription terms verified before use with client data.

## Components (target)
| Part | Where | Notes |
|---|---|---|
| Router + tools + RBAC | Crawllex (Next.js route) | deterministic |
| Corpus index | Crawllex build step | from `corpus/` |
| Model | Hermes `oriel` (logibox) or paid API | decision pending |
| Threads | Crawllex DB | per user and project |
| Public access | tunnel + Cloudflare Access, or Vercel-hosted proxy | decision pending |
| Discord agent | separate Hermes profile | owner-only allowlist; terminal scope decision pending |

## Owner decisions needed
1. Public exposure path for the customer bot.
2. Model provider for customers (subscription terms vs paid API).
3. Discord bot token and terminal scope.
4. Corpus sign-off.
