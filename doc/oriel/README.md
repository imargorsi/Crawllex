# Oriel (Crawllex Insight assistant)

Docs for Oriel, the Crawllex chat assistant. Oriel has two parts: the Crawllex code (`lib/assistant/`) and the Hermes agent profile `oriel` on logibox.

## Folders
| Folder | What it holds |
|---|---|
| `implementation/` | What is built and running now: status, hosts, ports, profile config, runbook, change log |
| `rules/` | Business and language rules: NLP rules (how questions are read) and assistant rules (answer format, permissions, refusals) |
| `guides/` | How-to docs for Crawllex users and the maintenance procedure for these docs |
| `architecture/` | `current.md` (what exists) and `target.md` (what we are building) |
| `corpus/` | Functional-only Crawllex docs. The only text customers' answers may be grounded in |
| `tools/` | `check-oriel-docs.sh`: verifies docs and sync state |
| `evals/` | Evaluation set (35 cases) and runner: hallucination, injection, prompt extraction, grounding |

## Maintenance rule (mandatory)
Every change to Oriel, in code, profile config, persona, corpus or infrastructure, updates these docs in the same change:
1. The affected doc (rules, architecture, implementation, guides).
2. `CHANGELOG.md`, one dated entry.
3. Run `tools/check-oriel-docs.sh`. It must pass before the change is finished.

No doc change means the change is not finished.

## Scope rules
- `corpus/` is customer-facing: functional content only, no implementation.
- `implementation/` and `architecture/` are internal. They never go into the corpus or the bot.
- No secrets in any doc. Record locations and names only.

## Status
See `implementation/status.md`.
