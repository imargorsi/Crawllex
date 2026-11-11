#!/usr/bin/env bash
# Verify Oriel docs: required files, SOUL.md sha on logibox, corpus scrub, no secret-looking values.
# Usage: doc/oriel/tools/check-oriel-docs.sh   (run from anywhere)
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fail=0
ok()  { echo "ok    $1"; }
bad() { echo "FAIL  $1"; fail=1; }

for f in README.md CHANGELOG.md implementation/status.md implementation/logibox-runbook.md \
         implementation/crawllex-code.md rules/nlp-rules.md rules/assistant-rules.md \
         architecture/current.md architecture/target.md guides/README.md \
         guides/maintain-oriel-docs.md corpus/MANIFEST.md evals/README.md evals/cases.jsonl evals/run-evals.py; do
  [ -f "$ROOT/$f" ] && ok "exists $f" || bad "missing $f"
done

# corpus files: functional only
banned='mongo|next\.?js|typescript|cloudflare|\bR2\b|service account|\bapi\b|cache|vercel|hostinger|openrouter|database|endpoint|backfill|incremental|tailscale|logibox|llama|hermes'
hits=$(grep -n -i -E "$banned" "$ROOT"/corpus/0*.md 2>/dev/null || true)
[ -z "$hits" ] && ok "corpus scrub" || { bad "corpus scrub"; echo "$hits" | cut -c1-160; }

# no secret-looking values in any oriel doc
secret='(API_SERVER_KEY|LLM_PASSWORD|OPENROUTER_API_KEY|sk-[A-Za-z0-9]{12,})=?[A-Za-z0-9_\-]{12,}'
hits=$(grep -rn -E "$secret" "$ROOT" 2>/dev/null || true)
[ -z "$hits" ] && ok "no secret values in docs" || { bad "secret-looking value in docs"; echo "$hits" | cut -c1-120; }

# SOUL.md sha on logibox must match the value recorded in status.md
want=$(grep -o -E 'sha256: `[0-9a-f]{64}`' "$ROOT/implementation/status.md" | grep -o -E '[0-9a-f]{64}' | head -1)
have=$(timeout 30 ssh -o BatchMode=yes logibox-ts 'sha256sum ~/.hermes/profiles/oriel/SOUL.md' 2>/dev/null | cut -d' ' -f1)
if [ -z "$have" ]; then bad "logibox unreachable: SOUL.md sha not checked"
elif [ "$want" = "$have" ]; then ok "SOUL.md sha matches status.md"
else bad "SOUL.md changed on logibox: update implementation/status.md + CHANGELOG"; fi

# changelog has at least one dated entry
grep -q -E '^\| 20[0-9]{2}-[0-9]{2}-[0-9]{2} ' "$ROOT/CHANGELOG.md" && ok "changelog has entries" || bad "changelog empty"

[ $fail -eq 0 ] && echo "PASS" || echo "FAILED"
exit $fail
