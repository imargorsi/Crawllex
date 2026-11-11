# Oriel on logibox: runbook

No secret values in this file.

## Paths
- Profile: `~/.hermes/profiles/oriel/` (config.yaml, .env mode 600, SOUL.md, state)
- Hermes CLI: `~/.local/bin/hermes` (needs `export PATH=$HOME/.local/bin:$PATH` over ssh)

## Commands
| Task | Command (run on logibox) |
|---|---|
| List profiles | `hermes profile list` |
| Show config | `hermes -p oriel config show` |
| Set model | `hermes -p oriel config set model.default gpt-5.6-luna` and `config set model.provider openai-codex` |
| Tools state | `hermes -p oriel tools list` (expect 0 enabled) |
| Auth status | `hermes -p oriel auth status openai-codex` |
| Add login | `hermes -p oriel auth add openai-codex --type oauth --no-browser --label oriel` (device flow; owner completes in browser) |

## Gateway
Not started. Start only after: SOUL.md replaced, corpus reviewed, toolsets still disabled. Record the start in CHANGELOG.

## Other services on logibox (not Oriel)
- `llama-qwen.service` (user unit, enabled, lingering): Qwen3-4B Q4_K_M on 127.0.0.1:8091, `-ngl 99`, the only model on logibox since 2026-11-09. Model files on disk: `~/models/Qwen3-4B-Q4_K_M.gguf` only (Qwen3-8B and Qwen3-1.7B deleted 2026-11-09). Backup unit for the 8B was deleted.
- `llm-gateway` (Docker, `~/apps/llm-gateway`): Caddy basic auth on 100.90.184.0:8092 (tailnet). Public as `https://oriel.logicalcreations.cloud` via the Cloudflare tunnel `logibox`; the tunnel sends `Host: 100.90.184.0` so Caddy's auth site applies.
- `cloudflared-logibox.service` (user unit, enabled, lingering): tunnel `logibox` (id 338d03ce-…). Routes `render.logicalcreations.cloud` → 127.0.0.1:8788 and `oriel.logicalcreations.cloud` → 100.90.184.0:8092. Binary `~/.local/bin/cloudflared`. Credentials in `~/.cloudflared/` (600). Logs: `journalctl --user -u cloudflared-logibox`.
- `pm-assistant` profile: separate Hermes profile, separate port and credentials.
