# Oriel implementation status

Last updated: 2026-11-09.

## Summary
| Part | State |
|---|---|
| Hermes profile `oriel` on logibox | created, configured |
| Model | `gpt-5.6-luna` on `openai-codex` (ChatGPT subscription) |
| Codex login | done: OAuth credential #1, label `oriel` |
| API server | port 8643, bound to tailnet IP 100.90.184.0 only (`API_SERVER_HOST`), key in profile `.env` (mode 600) |
| Toolsets | all disabled (no terminal, file, web, memory, session search) |
| Gateway | RUNNING (2026-11-03) via `~/oriel-start.sh`, API on 100.90.184.0:8643 (tailnet only). Not a customer endpoint |
| Persona `SOUL.md` | assistant-only persona (2026-11-03). Scope, answer style, confidentiality rules. Needs owner review before customer use |
| Corpus loaded into Oriel | no (evaluation passes corpus excerpts per request, as RAG would) |
| Evaluation set | 35 cases in `evals/`. Baseline 35/35, release gate OK (2026-11-03) |
| Crawllex retrieval layer | built on branch `feature/oriel-retrieval` (ported to `feature/oriel-module`), commits `151fd44` and `73f125c` (pushed to origin 2026-11-03): corpus loader, BM25 retrieval, grounded answer, output guard, API route `POST /api/v1/projects/[id]/oriel/query` behind `ORIEL_ENABLED`. Unit tests 17/17. Live check passed (see CHANGELOG). Chat UI and threads not built |
| Chat UI | Oriel module at `/oriel` (`components/oriel/`), own sidebar entry. Delete one or all conversations. Dashboard shows a shortcut that opens Oriel with a question or a recent chat. Branch `feature/oriel-module` |
| Customer exposure | tailnet only (owner decision 2026-11-03) |
| Discord agent | not started (owner 2026-11-03: not yet; terminal stays off until confirmed) |

## SOUL.md integrity
- Path (logibox): `~/.hermes/profiles/oriel/SOUL.md`
- sha256: `8f4ae88ce17239a7fd3d858f52708d86d6d4934acd210d40e204e60ce866817b`
- Lines: 25
- The check tool compares this value with the live file. If the file changed, update this doc and the CHANGELOG in the same change.

## Known gaps (blocking customer use)
0. Evaluation passes on the current model only. Re-run after every persona, model, corpus or code change.
2. Retrieval layer exists in Crawllex but the chat UI is not built and the corpus is not owner-signed.
3. No prompt-injection defence layer, no output check for leaked system prompt, no canary.
4. No evaluation set (hallucination, injection, prompt extraction).
5. ChatGPT subscription use for a public product: terms not checked.
6. Corpus not yet reviewed by the product owner.
