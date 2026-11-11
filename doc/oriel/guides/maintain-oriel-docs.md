# Maintaining Oriel docs

Applies to every Oriel-related change: code, Hermes profile, persona, corpus, infra.

## Steps (in order)
1. Before the change: read `implementation/status.md` and `architecture/current.md`.
2. Make the change. Verify with real commands (tests, `hermes ... config show`, curl), not assumptions.
3. Update the matching doc:
   - behaviour or answer rules → `rules/`
   - structure or new component → `architecture/` (current.md always; target.md if it changes the plan)
   - what is running, paths, ports, versions → `implementation/`
   - user-facing text → `corpus/` (functional only)
   - how-to for users → `guides/`
4. Add a dated line to `CHANGELOG.md`.
5. If `SOUL.md` changed on logibox: update the sha256 in `implementation/status.md`.
6. Run `doc/oriel/tools/check-oriel-docs.sh`. Fix until it passes.
7. Do not finish the change until steps 3–6 are done.

## Corpus rules
- Functional content only: what users do and what things mean.
- No: architecture, stack, database, API, cache, internal names, costs, hosts, secrets, or internal tool names.
- Every corpus file traces to a section in the Product Manual (see `corpus/MANIFEST.md`).

## Writing rules
- Plain English. Short sentences. Use the exact UI names.
- Facts you have checked in the code or the product. No guesses.
- Mark anything unverified as TODO, not as fact.
