# Decision log

- 2026-11-21 — Wiki at `docs/wiki/`. See [conventions](conventions.md).
- 2026-11-21 — Tracking via `docs/superpowers/{specs,plans}`, not GitHub issues.
- 2026-11-21 — #3 Tag Hook: **delete the `graphAware` path** (no user-visible change). As of `b18e4aa`, `GenerationOptions.graphAware` was set only by `scripts/audit-star-system-generator.ts` and `phase6On.test.ts`.
- 2026-11-21 — #1 Narrative Domain vocabulary: **land additively, byte-identical**. The substring-match bugs ("ai"⊂"maintenance", "sol"⊂"isolated", "old"⊂"gold") stay for now; any fix is a separate ADR-0001 version-break decision.

See [architecture-strong-items](architecture-strong-items.md).

## 2026-11-21 grilling round (user: "Yes to all")
- Q1: Lanes A/B/C run in parallel in git worktrees. Each item is merged to `develop` one at a time, once green.
- Q2: #2 is rejected if any golden seed hash changes. Fork labels must stay identical.
- Q3: The golden guard uses about 200 generated seeds covering all option combinations, plus edge-case seeds.
- Q4: Verified dead code is deleted inside the candidate that touches it, one commit per deletion.
- Q5: The audit script only stops passing `graphAware`. No rework.
- Q6: Candidate subagents add new module names to the feature GLOSSARY via `domain-modeling`. The user reviews them afterwards.
- Q7: One reviewer agent per item before it merges, checking CLAUDE.md and the item's plan.
- Q8: The Narrative stage covers facts → graph → Conflicts → reshape → System Story → hooks. Debris attach, the Companion remap and `runNoAlienGuard` stay outside it.
- Q9: `fact` moves to a leaf `lib/generator/fact.ts`. All importers are updated, with no lasting re-export.
- Q10: Deleting `graphAware` removes everything it gates: phenomenonNote, settlementHookSynthesis, `rewriteFourthSentence`, and their tests. The `whyHere` rewrite stays.
- Q11: The spine matrix snapshot tests switch to flags off, and their snapshots are regenerated.
- Q12: The KCD2 URL params `ingMode`/`alchLvl` stay as they are. Internal fields are renamed to `matchMode`/`alchemyLevel`.
- Q13: KCD2 saved filters get a schema version. The liquid migration becomes a versioned, run-once step at load.
- Q14: Asteroids collision rules return domain outcomes. Splitting and its RNG stay in the engine; no seeded RNG.
- Q15: Under simulated time, saucer spawn, respawn and the Level Transition timers freeze while paused. This is an accepted gameplay change.

## 2026-11-21 grilling round 2 (user: "yes to all")
- Q16: The user approves only the #2 Narrative stage plan. All other plans proceed once a reviewer agent passes them.
- Q17: The #1 closed domain set is the union of domains the current regexes can return. Bank `domains:` literals and `CONTROL_DOMAINS`/`CRISIS_*` are typed against it. Mismatches that would change output are reported to the user, not fixed.
- Q18: Retro runs after the first item that hits trouble in any lane, plus about 1 in 5 of the rest. Improvements are applied without asking unless they change what users see.
- Grilling closed; the user confirmed shared understanding. Lanes A/B/C dispatched.

## 2026-11-21 round 3 (user: "yes to all")
- Q19: KCD2 restores saved filters once at load. The toast shows once, and back/forward shows exactly the URL. This fixes the bug where the hydrate effect reran.
- Q20: #2 Narrative stage plan approved (Option A, `runNarrativeStage`), with the golden guard as the merge gate.
- Q21: Add GitHub Actions CI running test and lint on pushes to `develop`, on Node 24.
- Q22: Asteroids High Score updates live; the reset-high-score button is hidden while a game is in progress.
- Q23: Level Transition and Respawn timers wait while the tab is hidden (part of Q15).

## 2026-11-21 round 4 (user: "yes to all questions")
- Q24: Asteroids ignores keys while the reset dialog is open, so Escape no longer starts a game.
- Q25: Add project worktree setup so agent worktrees start from `origin/develop` with `node_modules` linked.
- Follow-ups approved: the companionStar `./index` cycle; dead `settlementSpineEdgeIds`; the meaningless audit graph-aware metrics; graph rules matching domain words in prose (must stay byte-identical); `gu.json` domain drift; the KCD2 toast timer; a shared canvas fake for tests.
- Approved to explore next: the review's "Worth exploring" items #4 (hook variety), #5 (Seed URL), #9 (Draft rule), plus the substring-bug fix. These get grilled before design. The substring fix still needs an explicit ADR-0001 version-break decision.
- A weekly wiki lint schedule is approved.
