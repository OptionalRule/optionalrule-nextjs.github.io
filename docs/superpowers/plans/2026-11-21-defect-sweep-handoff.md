# Handoff: one-pass defect sweep

Written 2026-11-21 by the chief-of-staff session. `develop` was at `fd2faef` or later. The user's instruction was: "let's stop turning up one defect at a time. Create a handoff to find them in a pass so we can finish this up."

## Goal

Find every remaining defect in one discovery pass, triage them with the user in **one** decision round, then fix them in batches. Do not fix anything during discovery. The work is finished when the ledger is empty or every remaining row has been explicitly deferred by the user.

## Read first

- `CLAUDE.md`: commits, no `any`, `_` for unused parameters, no comments, `npm run graph:update` after `src/` edits.
- `docs/wiki/index.md`, then `decision-log.md`. The decision log records every user decision, Q1–Q38, and they are binding. Also read `lane-brief-checklist.md` and `ci.md`.
- `src/features/tools/star_system_generator/docs/adr/0001`, `0002` and `0003`. A shared seed link must reproduce exactly. Any change to generator output needs a new `GENERATOR_VERSION` in `lib/generator/rules.ts` and an ADR. **Never regenerate the v2 golden fixture.**
- The user is on SSH. Never open a browser. All reports are markdown or plain text.

## Phase 1: discovery (parallel, read-only)

Run one agent per sweep below, all in parallel. None of them edits `src/`. Each one appends rows to the ledger at `docs/superpowers/plans/2026-11-21-defect-ledger.md` (the coordinator merges them to avoid write races). Each row has these columns:

`id | sweep | file:line | defect (one line) | evidence (command/output or reasoning) | user-visible? | changes generator output? | fix size S/M/L | proposed fix (one line)`

Only list a defect with concrete evidence. Style preferences are not defects.

| Sweep | Method |
|---|---|
| A. Type/contract drift | Run `tsc -p tsconfig.test.json --noEmit` with `--noUncheckedIndexedAccess`, then separately with `--exactOptionalPropertyTypes` (temporary command-line flags only), and record the counts and the real bugs they reveal. Also grep for `as unknown as`, `as `+type casts in tests, and `!` non-null assertions. Known: `BodyVisual.surface` is required in its type but treated as optional in `viewer3d` `Body.tsx`. |
| B. Dead code and unused exports | Use the graph first (`graphify` queries; see CLAUDE.md), then grep. `npx knip` may run once as a one-off report; **do not add it as a dependency** without user approval. |
| C. Rules decided in several places | Look for the pattern the draft rule had: one rule re-implemented in several files (env checks, date/slug generation, URL building, storage keys, sanitization). Known: `scripts/generate-search-index.ts` duplicates `generatePostSlug`. |
| D. Substring/regex traps on prose | Every regex or `includes` run over human text anywhere in `src/` and `scripts/` (same class as ADR-0003). For star_system_generator: `CRISIS_*` keywords and the `containsWord` sites, and whether they are v2-pinned. Anything that changes output goes into the ledger marked "changes generator output". |
| E. Tests that don't test | Fake tests (e.g. `test:static` in package.json only prints a message), heavy mocks or casts into internals, skipped/`.only`/todo tests, assertions that can't fail, and important paths with no test. Also look at the coverage report (`npm run test:coverage`) for untested modules with logic. |
| F. Browser/side-effect hygiene | Uncleaned listeners, timers, RAF, subscriptions and `localStorage` access without guards, across all interactive tools and games (`src/features/**`). This is the class of the Asteroids Level Transition timer bug. |
| G. Build, CI and tooling | Warnings from `npm run build` (use `next build --webpack` in agent worktrees), `npm run lint:ci`, test-log noise (three.js CJS, happy-dom iframe), `npm audit`, and scripts in package.json that are broken or misleading. CI runs `lint`; check whether it should run `lint:ci`. |
| H. Content | `npm run find-empty-links`, frontmatter placeholders and missing fields (use the `editing-post-frontmatter` skill's checks), broken internal links and image paths in `content/`, and stale docs that name removed modules (e.g. `useQueryState`, `CollisionSystem`, `graphAware`, `lib/persist`). |
| I. Repo hygiene | `git worktree list` showed 13 leftover agent worktrees and `worktree-agent-*` branches on 2026-11-21. List each with whether its commits are already in `origin/develop`. **Do not delete during discovery.** |

### Already known, put these in the ledger as-is

- The star_system_generator audit has a baseline of 722 errors (`scripts/star-system-audit-baseline.json`). Group them by code, and mark them as changing output (fixing them needs v4).
- The audit ratchet counts findings without a code by path, so a rise can be hidden by an equal drop on the same path.
- `gu.json` domain drift is caught only by a test (JSON imports widen to `string`).
- The Asteroids reset dialog catches Escape in the capture phase, so it blocks any other page-wide Escape handler while it is open. This is accepted; record it, don't fix it.
- `worktree.baseRef: head` doesn't fetch, so the main checkout must stay on an up-to-date `develop`.
- Parked: v4 hook variety (new pool entries, tone weighting). Record it as deferred, with a pointer to `docs/wiki/worth-exploring-items.md`.

## Phase 2: triage (one round with the user)

Group the ledger rows by class, not one by one: "fix all S that aren't user-visible", "the user-visible ones", "output-changing → v4 or defer", "deletions". Use the `grilling` skill format: number each question, give a recommendation, and word every question so "yes" accepts the recommendation. The user has answered "yes to all" throughout; keep the questions small enough that this is safe. Record the decisions in `docs/wiki/decision-log.md` as Q39 onward.

## Phase 3: batched fixes

- One worktree agent per area (star_system_generator, asteroids, kcd2_alchemy, content/lib, tooling/CI). They can run in parallel.
- Each agent fixes its rows with TDD, then a fresh **general-purpose** reviewer (it needs Bash) runs `git diff origin/develop...HEAD`. After that: `npm run typecheck`, `npm run lint`, targeted tests, golden tests, `git pull --rebase origin develop`, then a fast-forward push. Never force-push.
- Each agent marks its ledger rows fixed with the commit hash, or "won't fix" with a reason.
- Output-changing rows only proceed if the user approved a v4 in Phase 2.
- To release: merge the exact CI-green SHA into `main` from a temporary worktree (see `lane-brief-checklist.md`), then check the live site with `curl`.

## Done when

- Every ledger row is fixed (with a commit), won't-fix (with a reason) or deferred (with the user's Q number).
- CI is green on `develop` and the result is released to `main`.
- The wiki has a dated summary of the sweep: counts per sweep, what was fixed, and what was deferred.
