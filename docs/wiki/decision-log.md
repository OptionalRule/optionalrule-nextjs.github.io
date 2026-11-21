# Decision log

- 2026-11-21 — Wiki at `docs/wiki/`. See [conventions](conventions.md).
- 2026-11-21 — Tracking via `docs/superpowers/{specs,plans}`, not GitHub issues.
- 2026-11-21 — #3 Tag Hook: **delete the `graphAware` path** (no user-visible change). As of `b18e4aa`, `GenerationOptions.graphAware` was set only by `scripts/audit-star-system-generator.ts` and `phase6On.test.ts`.
- 2026-11-21 — #1 Narrative Domain vocabulary: **land additively, byte-identical**. The substring-match bugs ("ai"⊂"maintenance", "sol"⊂"isolated", "old"⊂"gold") stay for now; any fix is a separate ADR-0001 version-break decision.

See [architecture-strong-items](architecture-strong-items.md).
