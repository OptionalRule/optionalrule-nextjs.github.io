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

## 2026-11-21 round 5 (user: "yes to all")
- Q26: A single `isPublished` rule is used everywhere (content, feeds, sitemap, search index, enhance-post). Drafts are excluded from every build regardless of `NODE_ENV` and appear only under `npm run dev`. One sitemap source. Posts and pages handle read errors the same way. rss/sitemap are regenerated. Top priority.
- Q27: Merge `develop`→`main` (which deploys) as soon as the draft fix passes CI. This releases all of today's work.
- Q28: #5 Seed URL gets one typed option codec and one seed-link builder used at all 5 sites, plus a `v` param (missing means v2). No output change.
- Q29: The substring fix, plus the other traps (ore, war, law, …), ships as `GENERATOR_VERSION = 3`. The v2 classifier is kept, so `v=2` and links without `v` reproduce exactly. New ADR. Comes after Q28.
- Q30: #4 hook variety ships inside v3. First, split `hooks.ts` into its three jobs with no output change. The variety design needs its own grilling session about how it feels at the table.
- Q31: The star system audit gets a committed per-code error baseline and fails only when a count rises (a ratchet).

## 2026-11-21 round 6 (user: "yes to all")
- Q32: In v3, GU and Bleed are active only when the system has GU or Bleed features. No baseline seeding.
- Q33: v3 keeps the per-category counts (1/2/1/3/1). Variety comes from bias and resonance.
- Q34: In v3, encounters feed resonance and rumors prefer the resonant terms.
- Q35: A subagent drafts about 12 new settlement Tag Hook templates. The user approves them before merge.
- Q36: All the hook variety changes ship in the same GENERATOR_VERSION 3. The release hold on `main` stays until they land.

## 2026-11-21 Q37 (user: "yes to all")
Approved v3 settlement Tag Hook pool: the 4 existing templates plus the 12 below. They apply in v3 only; v2 keeps its 4. Draft #4 was changed to end with ":" instead of ", because" so it never repeats "because".
1. Ask about {obviousTag} and you get the brochure; ask about {deeperTag} and you learn that {deeperText}
2. Every manifest lists {obviousTag}, but crews who stay long enough learn about {deeperTag}: {deeperText}
3. Under the {obviousTag} reputation runs a harder current called {deeperTag}, where {deeperText}
4. Locals will talk about {obviousTag} all night, but mention {deeperTag} and the room goes quiet: {deeperText}
5. {deeperTag} sits under {obviousTag} like a cracked hull seal: {deeperText}
6. The trade guides file this place under {obviousTag}; the people who live here file it under {deeperTag}: {deeperText}
7. Nobody here denies {obviousTag}, but the real arguments are about {deeperTag}, since {deeperText}
8. Strip away {obviousTag} and what remains is {deeperTag}: {deeperText}
9. {obviousTag} explains how the place looks; {deeperTag} explains how it works, and the short version is that {deeperText}
10. If {obviousTag} is what brings ships in, {deeperTag} is what crews talk about on the way out: {deeperText}
11. Any broker will mention {obviousTag}; only a local will warn you about {deeperTag}, and the warning is blunt: {deeperText}
12. The registry says {obviousTag}, but the incident logs keep circling {deeperTag}: {deeperText}

## 2026-11-21 Q38 (user: "yes")
- v3 ships once the Tag Hook templates land: the substring fix, the v3 hook profile and 16 templates. Bigger variety work (new pool entries, tone weighting) is deferred to a future v4 and starts with a grilling on tone weighting. The release hold lifts after the templates pass CI.

## 2026-11-21 defect-sweep triage, Q39–Q56 (user: "yes to all")
Rows refer to [the defect ledger](../superpowers/plans/2026-11-21-defect-ledger.md) as of `f0411a0`.
- Q39: Fix all 19 user-visible rows (C1, C3, D5, F1–F8, G15, H1–H6, H11), each starting with a failing test. F4–F8 become "won't fix" if they can't be reproduced.
- Q40: For C3, the table-of-contents links change to match the page's heading ids. Existing `#anchor` links stay stable.
- Q41: Fix all 48 internal rows, batched per lane (includes G1 `lint:ci` and G2 build/coverage/validate-config in develop CI).
- Q42: Delete the 18 verified-dead items, one commit per area.
- Q43: After the fix lanes merge, remove the 14 agent worktrees and their merged branches, plus the stale dependabot `next-16.3.0` and `tsx-4.23.11` branches.
- Q44: Defer D1, D2, D3 and K1 (all change generator output) to a future v4.
- Q45: Fold D4 into the parked v4 hook-variety work (K6).
- Q46: Keep `baseline-browser-mapping` (B5b).
- Q47: Declare the phantom deps (B7) in package.json at their lockfile versions.
- Q48: Defer the cleanup of about 170 unneeded `export` keywords (B15).
- Q49: The deploy's `npm audit` uses `--omit=dev --audit-level=high` and fails the build (G11).
- Q50: Delete the `/test-pagination/` route; its test moves to Pagination (G14).
- Q51: The coordinator drafts tags (H7) and descriptions of at most 160 characters (H8) for user approval before merge. Drafts stay untouched (H9).
- Q52: Untrack `.claude/settings.local.json` and gitignore it (I1).
- Q53: Keep `.cursor/plans/`, `tasks/` and `prompt_archive/` (I7).
- Q54: Defer the eslint 10, TypeScript 7 and @types/node 26 majors to a separate upgrade task. Their PRs stay open (I8).
- Q55: Document the worktree no-fetch constraint only; no hook (K5).
- Q56: Release the exact CI-green SHA to `main` once all lanes land, then check the live site with `curl`.

## 2026-11-21 Q57–Q59 (user: "yes to all")
- Q57: H7 — the site-migration post gets the tags `Community` and `Philosophy`.
- Q58: H8 — the five drafted descriptions are approved as written (drafts held in the coordinator's session scratchpad; applied in the commit that closes H8).
- Q59: Fix "buiding" → "building" in the MUD post's title only; the slug and URL stay unchanged.
