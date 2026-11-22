# Defect ledger: one-pass sweep

Date: 2026-11-21. Base commit: `cca9439` (= origin/develop). Source: Phase 1 of [2026-11-21-defect-sweep-handoff.md](2026-11-21-defect-sweep-handoff.md). Decisions Q1–Q38 in `docs/wiki/decision-log.md` are binding; nothing they decided is listed as a defect.

2026-11-21: Phase 3 complete; statuses filled at fadf290.

The raw sweep outputs lived in a session scratchpad that is not durable, so the key numbers are kept inline below.

## Row counts

| Sweep | Rows | Notes |
|---|---|---|
| A. Type/contract drift | 0 | every flagged site guarded; known `BodyVisual.surface` item carried as K7 |
| B. Dead code / unused exports | 16 | B5b split out of B5 for the judgment call |
| C. Rules decided in several places | 8 | |
| D. Substring/regex traps | 6 | 4 change generator output |
| E. Tests that don't test | 16 | |
| F. Browser/side-effect hygiene | 8 | |
| G. Build, CI, tooling | 20 | 3 are dups of B/E |
| H. Content | 19 | |
| I. Repo hygiene | 8 | I8 lifted from the sweep's branch table |
| Already known (K) | 7 | |
| **Total** | **108** | 4 marked `dup` |

## Sweep stats (condensed)

**A.** `tsc` with temporary flags: prod `--noUncheckedIndexedAccess` 333 errors (SSG 251, scripts 46, asteroids 20), `--exactOptionalPropertyTypes` 102; test config 940 / 127. Baseline test typecheck 0.
Casts: `as unknown as` 14 outside tests (4 JSON data casts in SSG `data/*.ts`), 50 in tests; 196 other `as T` in prod; 5 prod `!` assertions, all guarded.
JSON casts checked with `satisfies`: hooks/stellar/narrative fail only on JSON widening, no data drift today (same class as K3).

**B.** `npx knip` one-off: 111 unused files (105 are `content/**/*.mdx` false positives), 8 unused deps, 7 files with unlisted deps, 42 files with unused exports, 39 with unused types, 4 duplicate exports.
About 35 symbols dead everywhere (B8–B14); about 170 are export-only noise (B15). No removal touches generator output.

**C.** Q26 `isPublished` single rule holds (102 of 104 posts published; only `NODE_ENV` check is `publication.ts:13`).
8 duplicated-rule rows; 2 user-visible today (C1, C3), rest latent drift.

**D.** v3 released (origin/main `94dc4fd`). Only `narrative/domainClassifier.ts` is version-pinned (ADR-0003); graph rules, `bodyInterest.ts`, settlement naming and `hooks/terms.ts` are shared by v2 and v3, so D1–D4 need v4 via `GeneratorRules`.
`containsWord` is word-safe (0 body-name collisions in 2000 systems); no plural support but 0 missed edges. Probe corpus: seeds `sweepd-0..N`, all option sets.

**E.** `npm run test:coverage`: 225 files / 2078 tests pass; 0 skip/only/todo. Coverage 84.0 stmts / 82.6 branches / 80.5 funcs / 85.4 lines (thresholds 60/45/55/60).
`expect.hasAssertions()` probe: 6 tests in 5 files pass with no assertions (E2–E5). ~30 tests return early behind data guards (E6).
Lowest-covered logic: `useAlchemyData` 0%, viewer3d `index`/`HoverTooltip`/`BodyDetailCard`/`CameraRig` 0%, `mdx-components` 14.3%, `ViewerModal` 42.6%, `useGameClock` 60.4%. `src/features/games/**` excluded from coverage.

**F.** Audited 14 addEventListener, 11 timer, 5 RAF, 3 matchMedia, 2 subscription, 15 localStorage sites and ~30 three.js dispose effects. All listeners removed; all viewer3d materials disposed.
Q15/Q23 Asteroids timers verified dt-driven. Repros via scratch vitest tests (F1–F3).

**G.** `next build --webpack` OK, 173 pages, no warnings except `cpus: 1` experiment. `lint:ci` 0/0. `typecheck` clean. `npm audit` 0 vulns.
`validate-config` 60 warnings (all hard-coded host). Test noise: 1 THREE CJS, 2 happy-dom iframe traces; coverage run 53 PARSE_ERROR traces. `npm run start` fails. Last deploy run 44964284242 green.

**H.** `find-empty-links` 0. Frontmatter (104 posts): 1 missing tags, 1 missing draft, 2 drafts with placeholders, 1 slug≠filename, 5 SEO text >160 chars. All featured images exist.
Internal links: 7 broken targets in 4 posts plus 3 found by hand, all 404 live. 114 body image paths exist. Stale-doc scan found the handoff's removed modules only in historical docs.

**I.** 14 linked worktrees (1.9 GB) all clean, all HEADs in origin/develop (`git cherry` 0 unique); 11 locked by the live session. 15 worktree/lane branches and local `main` fully merged.
Dependabot: 2 stale (next, tsx), 3 major bumps (eslint 10, typescript 7, @types/node 26). 1124 tracked files, no build output or secrets tracked.

## Ledger

Classes: `visible`, `output` (needs GENERATOR_VERSION 4 + ADR), `internal`, `delete`, `judgment`, `recorded`, `deferred`, `dup`. Lanes: `ssg`, `asteroids`, `kcd2`, `torch`, `site`, `tooling`, `repo`.

| id | sweep | file:line | defect (one line) | evidence | user-visible? | changes generator output? | fix size S/M/L | proposed fix (one line) | class | lane | status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| K1 | known | scripts/star-system-audit-baseline.json | SSG audit baseline carries 722 errors (default profile) | default by code: hydrosphere-path 204, ARCH_MINIMUM_UNSATISFIED 110, ENV_EXTREME_HOT_HYDROSPHERE 77, bodies-path 72, SETTLEMENT_MISSING_BODY 50, settlements.bodyId 50, ENV_COLD_CLIMATE 40, climate 40, other ≤22 | yes | yes | L | Fix per code in v4; deep 3455 / quick 226 shrink with it | output | ssg | deferred (Q44) |
| K2 | known | scripts/audit-star-system-generator.ts (ratchet) | Ratchet counts codeless findings by path, so a rise can hide behind an equal drop on the same path | 404 of 722 baseline findings are path-only (no code) | no | no | S | Key codeless findings by path + message (or give them codes) | internal | tooling | fixed 76a3bf4, c040f7e |
| K3 | known | src/features/tools/star_system_generator/lib/generator/data/gu.json | `gu.json` domain drift caught only by a test; JSON imports widen to `string` | handoff; sweep A: hooks/stellar/narrative JSON casts have the same widening, no drift today | no | no | S | Validate JSON data with a typed guard/`satisfies` at load or in a dedicated data test | internal | ssg | fixed f522707 |
| K4 | known | src/features/games/asteroids (ConfirmModal) | Reset dialog captures Escape, blocking other page-wide Escape handlers while open | Accepted under Q24 | no | no | – | None (accepted, Q24) | recorded | asteroids | recorded (Q24) |
| K5 | known | worktree setup (`worktree.baseRef: head`) | `baseRef: head` doesn't fetch, so the main checkout must stay on up-to-date `develop` | handoff; Q25 setup | no | no | S | Choice: document the constraint only, or add a fetch step to the worktree setup | judgment | tooling | fixed: already documented in docs/wiki/lane-brief-checklist.md (Q55) |
| K6 | known | docs/wiki/worth-exploring-items.md | v4 hook variety (new pool entries, tone weighting) parked | Q38; starts with a tone-weighting grilling | yes | yes | L | Deferred to v4; see worth-exploring-items.md | deferred | ssg | deferred (Q38) |
| K7 | known (A) | src/features/tools/star_system_generator/viewer3d/types.ts:124,137; scene/Body.tsx:59-76,167 | `BodyVisual.surface` is required in the type but `Body.tsx` treats it as optional (`body.surface?.…`, `body.surface ?`) | grep; sweep A found no runtime fault | no | no | S | Decide one contract: drop the optional chaining, or make `surface` optional in the type | internal | ssg | fixed 1fb6fa8 |
| B1 | B | simple-test.js, test-content.js | Tracked root debug scripts from the 2025-08 migration, unreferenced | knip unused files; `git grep` no hits | no | no | S | Delete both | delete | repo | fixed a18dd4b |
| B2 | B | scripts/convert-ingredients-to-ids.ts, scripts/update-potion-base-values.ts | One-time KCD2 migration scripts; second reads a nonexistent `tmp_local/` CSV | knip; not in package.json/CI | no | no | S | Delete (or archive if wanted) | delete | kcd2 | fixed 86c60c3 |
| B3 | B | star_system_generator/components/ConfidenceLegend.tsx:12, ConfidenceBadge.tsx:19 | Dead UI components (Legend unused; Badge used only by Legend) | knip; `git grep ConfidenceLegend` → own file only | no | no | S | Delete both (+ PLAN.md mentions) | delete | ssg | fixed 7c02a3a |
| B4 | B | src/components/HeadingAnchorDemo.tsx, HeadingIdDemo.tsx, LinkExamples.tsx | Demo components imported only by their own tests | importer scan excluding tests → none | no | no | S | Delete the 3 components and their tests | delete | site | fixed 199d804 |
| B5 | B | package.json:68-95 | Unused deps: rehype-highlight, remark, turndown, @types/turndown, playwright, ts-node, tsconfig-paths; plus baseline-browser-mapping | knip; `git grep` only package.json. baseline-browser-mapping added on purpose in d47ed50 | no | no | S | Uninstall the 7; ask user about baseline-browser-mapping (B5b) | delete | tooling | fixed 802829f |
| B5b | B | package.json (`baseline-browser-mapping`) | Flagged unused, but added deliberately to silence browserslist staleness warning | d47ed50 "baseline-browser update" | no | no | S | Choice: keep (warning silencer) or remove | judgment | tooling | won't fix: kept deliberately (Q46) |
| B6 | B | vitest.shims.d.ts:1 | Storybook leftover referencing uninstalled `@vitest/browser` types; hidden by skipLibCheck | `tsc --ignoreConfig vitest.shims.d.ts` → TS2688 | no | no | S | Delete the file | delete | tooling | fixed 47d7456 |
| B7 | B | src/lib/rehype-sanitize.ts:1-2, mdx-options.ts:2, viewer3d/scene/CameraRig.tsx:6, src/__tests__/mdx-sanitize.test.ts | Phantom deps: `unist-util-visit` (runtime), `@types/hast`, `unified`, `remark-*` resolve only via hoisting | knip unlisted deps; `npm ls unist-util-visit` nested only | no | no | S | Add them to package.json at lockfile versions (adds manifest entries; user approval per dep rule) | judgment | tooling | fixed 127c5ec |
| B8 | B | ssg lib/generator/validation.ts:215,219,226,541 | Dead validators incl. `validateMoonAnchors` (never called by `validateSystem`) | `git grep -w` → declaration only | no | no | S | Delete the 4 functions | delete | ssg | fixed a1d7351 |
| B9 | B | ssg lib/generator/environmentCompatibility.ts:192-403 | 6 dead predicates (`isDryHydrosphere`, `worldClassHasTag` copy, …) | `git grep -w` → declaration only | no | no | S | Delete the 6 symbols | delete | ssg | fixed aa07ad2 |
| B10 | B | ssg eras.ts:79, worldClassMetadata.ts:142, motion.ts:32, renderAssets.ts:15, visual.tsx:209 | 5 dead SSG symbols; `moonMaterial` allocates a THREE material at module load | `git grep -w` → declaration only | no | no | S | Delete the 5 symbols (+ README mention) | delete | ssg | fixed 7e98dbd |
| B11 | B | torch_tracker selectors.ts, types.ts:113, useTorchTrackerState.ts:478, catalog.ts:50, time.ts:10, index.tsx:283 | Dead torch API (3 selectors, aggregate, settings hook, helpers, alias) | `git grep -w` → declaration only | no | no | S | Delete; keep `selectSettings`/`selectCentralTimer` | delete | torch | fixed a5f0e33 |
| B12 | B | src/lib/utils.ts:40; src/lib/content.ts:154 | Dead `utils.generatePostUrl` (stale copy of urls.ts) and `getAllPostsMetaWithDrafts` | `git grep` → no importers; overlaps C6 | no | no | S | Delete both | delete | site | fixed d0a6e4d |
| B13 | B | asteroids config.ts:224-241; constants.ts:9-10; types.ts:218,225 | Dead `AUDIO`/`DEBUG` config + types; duplicate `GAME_CONFIG` alias | `git grep`; knip duplicate exports | no | no | S | Delete blocks, types and config.ts alias | delete | asteroids | fixed 2d78a9f |
| B14 | B | torch_tracker components (CircularCountdownTimer, TorchTrackerHeader, index.ts); src/lib/zod.ts | Duplicate named+default exports; unused barrel re-exports | knip duplicate/unused exports | no | no | S | Drop unused defaults and barrel re-exports (zod.ts only if shim allows) | delete | torch | fixed 96dbb7c, c2fec00 |
| B15 | B | ~25 files (SSG lib barrels, kcd2, src/lib, test-utils) | Export-only noise; truly dead `LevelConfig` (asteroids/types.ts:59), `UrlPath` (urls.ts:181) | knip + in-file use counts | no | no | M | One hygiene commit dropping unused `export`s, or defer | judgment | tooling | deferred (Q48) |
| C1 | C | src/lib/feeds.ts:77,81 | Sitemap tag URLs use `toLowerCase()`, so 7 of 17 contain spaces and 404 | `out/sitemap.xml`: `/tag/game development/` vs `out/tag/game-development` | yes | no | S | Use `urlPaths.tag` + sitemap test that every `<loc>` is a route | visible | site | fixed 448474d |
| C2 | C | src/lib/content.ts:202; src/lib/utils.ts:119 | Tag lookup reverses slugs via `tagSlugToName`, not inverse of `createTagSlug`; punctuation tags 404 | `D&D 5e` → `dd-5e` → `dd 5e` matches nothing; current 17 tags OK | no (latent) | no | S | Match `createTagSlug(t) === slug` | internal | site | fixed 3a9fbe1 |
| C3 | C | src/components/HeadingAnchor.tsx:8-9 vs src/lib/utils.ts:64-72 | Two heading-id rules disagree; non-string children give `id="object-object"` | 15 of 502 headings differ; `### **Spells**` → `object-object` | yes | no | S | `HeadingAnchor` uses `generateHeadingId` on extracted text | visible | site | fixed 019c8e9 |
| C4 | C | scripts/generate-search-index.ts:21-62 | Re-implements slug + post-meta mapping instead of `getAllPostsMeta` | diff vs content.ts:33-47 → only comments differ | no | no | S | Build index from `getAllPostsMeta()` (pairs with E9) | internal | site | fixed a358c29 |
| C5 | C | src/lib/feeds.ts:51-55,65 | Sitemap hard-codes `/pages/about/` and page size 10 | matches today; drifts on new page/size change | no | no | S | Use `getAllPageSlugs()` and `POSTS_PER_PAGE` | internal | site | fixed 448474d |
| C6 | C | seo.ts, Pagination.tsx, SearchInput.tsx, tag pages, post/page routes (~10 sites) | URL building hand-rolled despite `urls.ts` | outputs match today; `seo.ts:156` default canonical wrong shape (unused) | no | no | M | Route all through `urlPaths` | internal | site | fixed 48615ae |
| C7 | C | src/lib/content.ts:16; utils.ts:2-8,35-37; feeds.ts:11,25 | Dates parsed 3 ways; schema accepts any string | `2024-03-15T10:00` → `/NaN/NaN/NaN/slug/`; all posts YYYY-MM-DD today | no | no | S | Regex-constrain `date`; use `parseDateToUTCDate` everywhere | internal | site | fixed 3a9fbe1 |
| C8 | C | src/app/layout.tsx:123-127; src/components/Header.tsx:129 | Theme storage key/values hard-coded twice | identical literals today | no | no | S | Export `THEME_STORAGE_KEY` and interpolate | internal | site | fixed 1436059 |
| D1 | D | ssg graph/rules/dependsOnRules.ts:14-19,38-40,86-88 | DEPENDS_ON substring match: `ice`⊂office/lattice, `ration`⊂operation/calibration | 10 of 68 edges false in 2000 systems (e.g. sweepd-185) | yes | yes (v2+v3) | M | v4 whole-word + plural match via `GeneratorRules` | output | ssg | deferred (Q44) |
| D2 | D | ssg lib/generator/bodyInterest.ts:362 | `isGuTouched` `/GU/i` matches "irregular", "Rogue" | 763 of 2364 GU-touched bodies only via those words (1500 systems) | yes | yes (v2+v3) | S + v4 | v4 `/\bGU\b/` case-sensitive | output | ssg | deferred (Q44) |
| D3 | D | ssg lib/generator/index.ts:3506-3510 + data/names.json | `lab` substring names debt-labor sites "Laboratory" | 7 of 26 debt-labor settlements (2000 systems) | yes | yes (v2+v3) | S + v4 | v4 whole-word match or `labor` rule first | output | ssg | deferred (Q44) |
| D4 | D | ssg hooks/terms.ts:30,37 | `\bsilence\b`, `\bblade\b` too loose for Sol Silence / Shiab terms | drops Sol Silence in 68, Shiab in 53 of 2000 systems | yes | yes (v2+v3) | S + v4 | v4 tighter per-version patterns; could fold into K6 | output | ssg | deferred (Q45) |
| D5 | D | ssg viewer3d/lib/guBleedClassifier.ts:149-167 | "Gas giant radiation belt" hits `belt` before `gas giant`; bleed volume anchors on asteroid belt | sweepd-108: anchor radius 37.54 = belt, giant at 45.60 | yes | no (viewer) | S | Reorder rules or longest-keyword match | visible | ssg | fixed cc190cf |
| D6 | D | src/lib/content.ts:202 | Same as C2 (hyphen/punctuation tags 404) | dup of C2 | no | no | S | See C2 | dup | site | dup of C2 |
| E1 | E | package.json:31-33 | `test:static` only prints a success message; `test:build`/`test:all` verify nothing | script body is a `console.log` | no | no | S | Check real `out/` files or delete with `test:build` | internal | tooling | fixed ac03186 |
| E2 | E | ssg __tests__/BodyDetailPanel-region.test.tsx:16; OrbitalTable-debrisRegion.test.tsx:17 | Debris-region tests pass with zero assertions (seed no longer qualifies) | hasAssertions run → FAIL both | no | no | S | New seed/fixture; replace guard with assertion | internal | ssg | fixed 699bb9e |
| E3 | E | ssg __tests__/population-derivation.test.ts:120 | prominentForm test never asserts | hasAssertions run → FAIL | no | no | S | Fixture with both band sides; count precondition | internal | ssg | fixed 699bb9e |
| E4 | E | ssg viewer3d/lib/__tests__/sceneGraph-moonEnvelope.test.ts:43,57 | Moon-envelope regression tests vacuous | hasAssertions run → both FAIL | no | no | S | Pin qualifying seed; `expect(...).toBeNull()` for sweep | internal | ssg | fixed 699bb9e |
| E5 | E | ssg viewer3d/lib/__tests__/sceneGraph.test.ts:122 | gu-fracture guAccent test never asserts | hasAssertions run → FAIL | no | no | S | Fracture fixture; assert unconditionally + negative | internal | ssg | fixed 699bb9e |
| E6 | E | ssg graph/__tests__/controlsRules.test.ts:136…, contestsRules, ~20 more guards | Latent vacuous tests (`expect(true).toBe(true); return` on missing fixture) | assert today; E2–E5 show 4 already decayed | no | no | S | Precondition assertions; optional global `expect.hasAssertions()` | internal | ssg | fixed d3ed6d3 |
| E7 | E | src/__tests__/ssg.test.ts:319 | Metadata test asserts only on its own literals | never calls `@/lib/seo` | no | no | S | Delete or call `generatePostMetadata` | internal | site | fixed 65fb1c0 |
| E8 | E | src/__tests__/ssg.test.ts:177 | Tag URL test reimplements slug inline | `tag.toLowerCase().replace(...)` in test | no | no | S | Use real `urlPaths.tag`, include `D&D 5e` | internal | site | fixed 65fb1c0 |
| E9 | E | src/__tests__/integration.test.ts:291; scripts/generate-search-index.ts | Search-index test never runs the generator; script untested | hand-written `mockSearchIndex` | possible | no | M | Move builder to `src/lib`, test slugs vs `getAllPostsMeta` (pairs with C4) | internal | site | fixed a358c29 |
| E10 | E | src/app/(content)/…/[slug]/page.test.tsx:77; (pages)/pages/[slug]/page.test.tsx:54 | Tests mock nonexistent `@/stories/mdx-components`; real MDX map never tested | `ls src/stories` fails; mdx-components 14.3% | no | no | S | Drop stale mock; test `mdxComponents.h2` anchors | internal | site | fixed 2613570 |
| E11 | E | vitest.unit.config.ts:33-34 | Coverage excludes all of `features/games/**`; `(interactive)` exclude is a no-op glob | 0 paths under games, 11 under `(interactive)` | no | no | S | Drop games exclude; escape route-group glob | internal | tooling | fixed aaf5e06 |
| E12 | E | vitest.unit.config.ts:36-41 | Thresholds 20–38 points below actual | 60/45/55/60 vs 84.0/82.6/80.5/85.4 | no | no | S | Ratchet to ~2 below current | internal | tooling | fixed 2dc144b |
| E13 | E | kcd2_alchemy/hooks/useAlchemyData.ts:16-71; lib/normalize.ts:58 | KCD2 data load path and shipped JSON untested | 0/35 coverage; hook mocked in Kcd2Alchemy.test.tsx:7 | possible | no | S | Test public JSON through parse/integrity/resolve; hook test with mocked fetch | internal | kcd2 | fixed 4946bed |
| E14 | E | torch_tracker/hooks/useGameClock.ts:45-79; useTorchTrackerState.ts:425-481 | Live timer path and bound actions never run in tests | 0 function hits; 60.4% stmts | no | no | M | `renderHook` + fake timers (covers F3 regression) | internal | torch | fixed b10cd6b |
| E15 | E | ssg viewer3d/chrome/ViewerModal.tsx:36-69 | Keys 1–4 layer toggles and Tab focus trap untested | lines 38-69 uncovered | no | no | S | RTL tests for keys and focus wrap | internal | ssg | fixed bcbb286 |
| E16 | E | src/lib/content.ts:235-261 | `getPage`/`getAllPageSlugs` never run in tests | 0 calls; route test mocks `@/lib/content` | no | no | S | Add content.test.ts cases | internal | site | fixed 3a9fbe1 |
| F1 | F | src/app/(content)/search/page.tsx:25 + src/components/SearchInput.tsx:46-53 | Search page re-runs search every 300 ms forever; loading flicker | scratch test: 21 `performSearch` calls in 6 s idle | yes | no | S | `useCallback` / ref for `onSearch`; skip unchanged query | visible | site | fixed cd85b13 |
| F2 | F | src/components/SearchInput.tsx:35-43 | On /search/?q=foo the query can't be edited (URL sync resets it each keystroke) | scratch test: typed `foob` → value `foo` | yes | no | S | Sync from URL only when `searchParams` changes | visible | site | fixed cd85b13 |
| F3 | F | torch_tracker/hooks/useGameClock.ts:61-87 + index.tsx:161-164 | Re-renders restart the interval and drop elapsed time; frequent actions stop the clock | scratch test: 9 s wall → 0 s ticked | yes | no | S | Hold `onTick` in a ref; don't reset `lastTickRef` | visible | torch | fixed b10cd6b |
| F4 | F | torch_tracker/index.tsx:131,144,154,158 | `window.localStorage` getter read outside try; throws when storage blocked → crash | reasoning; KCD2/Asteroids guard it | yes (storage blocked) | no | S | `getStorage(): Storage \| null` wrapper | visible | torch | fixed 82e2a85 |
| F5 | F | asteroids/engine/AsteroidsEngine.ts:13-20 | Corrupt stored high score loads as NaN; never updates, reset hidden | reasoning: `parseInt` without `Number.isFinite` | yes (after corruption) | no | S | Return 0 unless finite non-negative int | visible | asteroids | fixed 7a6664a |
| F6 | F | ssg viewer3d/scene/CameraRig.tsx:23-83 | Fly-to / frame-system RAF loops never cancelled; overlapping loops fight | reasoning: RAF ids not stored or cancelled | yes | no | S | One `animRef`; cancel on restart and cleanup | visible | ssg | fixed a72075f |
| F7 | F | ssg components/SeedControl.tsx:53-55 | "Copy link" reports copied when Clipboard API is missing | `navigator.clipboard?.writeText` resolves undefined; ExportPanel handles it | yes | no | S | Throw when clipboard undefined, like ExportPanel | visible | ssg | fixed 5d7e309 |
| F8 | F | src/components/Header.tsx:113-122 | Click-outside uses `closest('.relative')`, which matches the header itself; dropdown won't close | `<header>` at :249 has `relative`; 13 files use it | yes (touch) | no | S | Ref on dropdown wrapper + `contains` | visible | site | fixed c667181 |
| G1 | G | .github/workflows/ci.yml:29 | develop CI runs `lint`, deploy runs `lint:ci`; warnings only block on main | ci.yml vs deploy.yml:31; `lint:ci` passes today | no | no | S | Use `lint:ci` in ci.yml | internal | tooling | fixed 33adc67 |
| G2 | G | .github/workflows/ci.yml:46-58 | develop CI never builds, skips coverage and `validate-config` | deploy.yml:65-76 runs them only on main | no | no | S | Add build job; test job runs `validate-config` + `test:coverage` | internal | tooling | fixed 33adc67 |
| G3 | G | .github/workflows/deploy.yml:68-73 | `test:integration`/`test:ssg`/`test:a11y` re-run after `test:coverage` | vitest include already covers them; job 3m5s | no | no | S | Delete the three steps | internal | tooling | fixed bd79a8c |
| G4 | G | package.json:13 (`start`) | `npm run start` fails under `output: 'export'`; CLAUDE.md documents it | `next start` error message | no | no | S | Remove or serve `out/`; fix CLAUDE.md/AGENTS.md | internal | tooling | fixed 70c84dc |
| G5 | G | package.json:31-32 | Same as E1 (fake `test:static`) | dup of E1 | no | no | S | See E1 | dup | tooling | dup of E1 |
| G6 | G | package.json:26,33 | `test:ci` matches neither workflow; `test:all` runs `test:a11y` twice | package.json vs deploy.yml | no | no | S | `test:ci` = typecheck+lint:ci+validate-config+test:coverage; trim `test:all` | internal | tooling | fixed 5b1ac71 |
| G7 | G | vitest.unit.config.ts:22 | Coverage `include: src/**/*` logs 53 PARSE_ERROR traces (.md/.html) | `test:coverage` log (also E stats) | no | no | S | `src/**/*.{ts,tsx,js,jsx}` | internal | tooling | fixed aaf5e06 |
| G8 | G | scripts/validate-config.ts:100-128 | Hard-coded-host check: 60 warnings, nearly all false positives | `validate-config` output; `*.test.ts` not skipped | no | no | S | Skip tests; allowlist schema/namespace/embed hosts | internal | tooling | fixed 3d8285c, 592765e |
| G9 | G | next.config.ts:6-11 | `experimental {workerThreads:false, cpus:1}` with false comment; warning every build | build log "Experiments … cpus: 1" | no | no | S | Remove block; confirm 173 pages | internal | tooling | fixed a24528f |
| G10 | G | src/components/__tests__/MediaEmbed.test.tsx; viewer3d tests | Test noise: 2 happy-dom iframe traces, 1 THREE CJS warning (also E stats) | `npm run test` stderr; THREE source not pinned | no | no | S | happy-dom iframe settings; `server.deps.inline` | internal | tooling | fixed 48a4505 |
| G11 | G | .github/workflows/deploy.yml:87-89 | Audit uses deprecated `--production` with `continue-on-error`, can never fail | CI log `Use --omit=dev` | no | no | S | `--omit=dev --audit-level=high`; choice: gate or stay advisory | judgment | tooling | fixed a50bc65 |
| G12 | G | package.json:47; scripts/audit-env.ts | `audit:env` is a star-system frequency report, not an env audit | scripts/audit-env.ts:1-40 | no | no | S | Rename (e.g. `audit:star-system-environments`) | internal | tooling | fixed 78537a0 |
| G13 | G | eslint.config.mjs:6-13 | Main-checkout lint descends into `.claude/worktrees/` (8.2k files, build chunks) | `isPathIgnored` false for worktree `out/` chunk; 15 errors | no | no | S | Ignore `.claude/**`, `**/out/**`, `**/.next/**` | internal | tooling | fixed 6c4c779 |
| G14 | G | src/app/(content)/test-pagination/page.tsx:1 | Debug "Pagination Test Page" ships live, indexable | live URL → 200; `robots: index, follow` | yes | no | S | Choice: delete route (move test to Pagination) or keep but noindex | judgment | site | fixed 2f3a8be |
| G15 | G | src/app/ (no not-found.tsx) | 404 is Next's unstyled default, no chrome or home link | `curl` bad URL → default 404 title | yes | no | S | Add `src/app/not-found.tsx` | visible | site | fixed 1e599d9 |
| G16 | G | scripts/tsconfig.json:6; scripts/README.md:17-29,196 | scripts tsconfig errors under TS 6; README says `ts-node` (fails) | `tsc -p scripts` → TS5107; `npx ts-node` → ERR_MODULE_NOT_FOUND | no | no | S | Delete scripts/tsconfig.json; README/shebangs → `node --import tsx/esm` (jekyll part = H15) | internal | tooling | fixed 77c752a |
| G17 | G | package.json:84,90,91; vitest.shims.d.ts | Unused ts-node, tsconfig-paths, playwright + shim | dup of B5/B6 | no | no | S | See B5/B6 | dup | tooling | dup of B5/B6 |
| G18 | G | public/{file,globe,next,vercel,window}.svg, 341106_rss_icon.svg, rss-svgrepo-com.svg | Unused scaffold assets deploy to the site | `grep` src/content → no matches | no | no | S | Delete | delete | site | fixed be7d855 |
| G19 | G | simple-test.js, test-content.js | Stray debug scripts | dup of B1 | no | no | S | See B1 | dup | repo | dup of B1 |
| G20 | G | .github/workflows/deploy.yml:74-90 | No `.next/cache` caching; npm `allowScripts` warning for esbuild/unrs-resolver | CI log run 44964284242 | no | no | S | Add `actions/cache`; approve the two install scripts | internal | tooling | fixed a2fbe20 |
| H1 | H | content/posts/2021-01-12-rotf-remix-foaming-mugs.mdx:157-161 | Malformed ref defs; 5 links render as literal `[text][1]` plus junk paragraph | live page shows literal `[Thugs][4]` | yes | no | S | Rewrite defs as `[n]: /url/` | visible | site | fixed bbe8911 |
| H2 | H | same file :158 | `[2]: /tag/rotf/` → no such tag | `curl` → 404 | yes | no | S | `/tag/rime-of-the-frostmaiden/` (with H1) | visible | site | fixed bbe8911 |
| H3 | H | content/posts/2026-03-23-ibo-design-diary-the-progressive-resolution-system.mdx:11 | Link to nonexistent `/2026/03/10/ibo-design-log-…/` | `curl` 404; real post /2026/03/12/ibo-design-diary-characters/ | yes | no | S | Fix the URL | visible | site | fixed d88e095 |
| H4 | H | content/posts/2026-03-06-ibo-devlog-locks-ranges-and-revamps.mdx:11 | Relative link missing leading slash | resolved URL `curl` → 404 | yes | no | S | Add `/` | visible | site | fixed 7858f62 |
| H5 | H | 2023-06-10-campaign-pitch-decks.mdx:70; 2024-08-26-expanded-herb-list-for-shadowdark.mdx:122 | Download links use `/assets/downloads/…`; files are in `/downloads/` | `curl` 404 vs 200 | yes | no | S | Change to `/downloads/<file>` | visible | site | fixed 43388a4 |
| H6 | H | 2021-01-17-thoughts-on-the-first-issue-of-arcadia.mdx:18,62-63 | Jekyll-era `/category/…` links | `curl` → 404 | yes | no | S | Use `/tag/…`; drop unused defs | visible | site | fixed 60cd781 |
| H7 | H | 2025-08-15-site-migration-complete.mdx:1-9 | `tags` missing; post on no tag page | fm.mjs `missing:tags`; schema optional | yes | no | S | Choice of tags (suggested Community, Game Development) | judgment | site | fixed eb9023b |
| H8 | H | 5 posts (2021-03-01, 2026-01-20, 2026-08-31, 2026-09-29, 2026-10-12) | SEO description >160 chars (excerpt fallback) | fm.mjs `seo-len` 161–472 | yes | no | S | Add `description` ≤160 chars each (author wording) | judgment | site | fixed eb9023b |
| H9 | H | 2025-09-05-ashlight-setting-primer.mdx:5-6; 2025-09-30-shedding-light-on-darkness-in-dnd.mdx:5-6 | Drafts carry template excerpt and `tag1/2/3` | fm.mjs `placeholder`; both `draft: true` | dev only | no | S | Author writes real excerpt/tags before publishing | judgment | site | deferred (Q51) |
| H10 | H | 2025-09-12-kcd2-alchemy-tool-and-nostalgia-for-ttrpg-crafting.mdx:2 | Frontmatter slug ≠ filename slug | fm.mjs; URL from frontmatter | no | no | S | Rename file to match slug | internal | site | fixed 8448414 |
| H11 | H | 2026-10-15-introducing-grimshaw.mdx:13 | Featured image filename has a space; JSON-LD emits raw space URL | live page `"url":"…Grimshaw_ RuinedFortress…"` | yes (structured data) | no | S | Rename image; update frontmatter | visible | site | fixed 1b0bd20 |
| H12 | H | 2021-01-12-rotf-remix-foaming-mugs.mdx:1-12 | `draft` field missing | fm.mjs; harmless at runtime | no | no | S | Add `draft: false` | internal | site | fixed bbe8911 |
| H13 | H | README.md:130-136 | Claims CSP nonces via middleware; no middleware, static export | no middleware file; `output: 'export'` | no | no | S | Delete or describe actual CSP | internal | repo | fixed 3bc50c1, 1516e61 |
| H14 | H | README.md:74-82,127 | Says image optimization enabled, `imageWidth/Height` needed | `unoptimized: true`; fields unread | no | no | S | Correct the text | internal | repo | fixed 3bc50c1, 1516e61 |
| H15 | H | scripts/README.md:9-50,79-96,116-160 | Documents nonexistent `import-jekyll-posts` and `or_logo.png` | removed in 1a77155 | no | no | S | Remove the sections | internal | tooling | fixed 77c752a |
| H16 | H | docs/TDD.md:3,32,109 | Refers to `documentation/PRD.md`, `src/stories/mdx-components.tsx` | paths don't exist | no | no | S | Update paths | internal | repo | fixed 3bc50c1 |
| H17 | H | src/features/games/asteroids/README.md:31-42 | Structure lists nonexistent systems/hooks and `documentation/` links | `ls engine/systems`, `hooks/` | no | no | S | Update structure and links | internal | asteroids | fixed 6eae078 |
| H18 | H | src/features/tools/kcd2_alchemy/README.md:22 | Points to `documentation/STANDARDS.md` | moved to `docs/` | no | no | S | Fix path | internal | kcd2 | fixed 368626b |
| H19 | H | src/features/tools/star_system_generator/README.md:94,98 | Describes removed `narrativeVariablePools` sections | narrative.json keys; grep → none | no | no | S | Remove or update clauses | internal | ssg | fixed 3b71a05 |
| I1 | I | .claude/settings.local.json | Local-only settings file is tracked | `git ls-files .claude`; no secrets | no | no | S | Choice: untrack + gitignore, or keep intentionally | judgment | repo | fixed 9eb815a |
| I2 | I | public/images/cache/*, public/images/third_party/* | Byte-identical duplicate images (two 7.6 MB copies, etc.) | md5 dup scan | no | no | S | Drop the unreferenced copy after reference check | delete | site | fixed 3d640d9 |
| I3 | I | public/images/hitpoints/*, public/games/asteroids/sounds/asteroid_destruction_{1,3}.mp3 | More identical-content duplicates | md5 match | no | no | S | Dedupe only if references allow (low priority) | delete | site | partially fixed 69f25b0 (asteroid sounds kept: both referenced) |
| I4 | I | .gitignore | `.claude/worktrees/`, `.claude/scheduled_tasks.lock` ignored only via local `.git/info/exclude` | `git check-ignore -v` | no | no | S | Add both to .gitignore | internal | repo | fixed 9eb815a |
| I5 | I | .claude/worktrees (14, 1.9 GB) + worktree-agent-*/lane-a branches | Stale agent worktrees/branches, all merged; 11 locked by live session | `git cherry` 0 unique each | no | no | S | After the sweep: unlock, remove, delete merged branches; ff local `main` | delete | repo | done 2026-11-22: 18 worktrees + merged branches removed after release (Q43) |
| I6 | I | origin/dependabot/npm_and_yarn/{next-16.3.0,tsx-4.23.11} | Stale dependabot branches older than package.json | next ^16.4.6, tsx ^4.23.15 | no | no | S | Close PRs / delete branches | delete | repo | done 2026-11-22: both remote branches deleted (Q43) |
| I7 | I | .cursor/plans/, tasks/, prompt_archive/ | Tool/plan scratch files tracked | `git ls-files` | no | no | S | Choice: keep as history or remove | judgment | repo | won't fix: kept as history (Q53) |
| I8 | I | origin/dependabot/npm_and_yarn/{eslint-10.8.0,typescript-7.0.2,types/node-26.1.2} | Open major-version dependabot bumps | develop pins eslint 9.39.5, TS ^6.0.3, @types/node ^25.9.9 | no | no | M | Choice: take each major (separate lane) or close and defer | judgment | tooling | deferred (Q54) |
| N1 | new | src/features/tools/star_system_generator/viewer3d/lib/sceneGraph.ts:~531 | Outer moons can land past a wide companion | seeds 17, 75; hand-built inputs only, no generator output change | no | no | S | Deferred | deferred | ssg | deferred (Q61) |
| N2 | new | places-of-power, april-2021-experimental-house-rules | Duplicate heading ids within a page | found in Phase 3 | yes | no | S | Unique heading ids | visible | site | fixed fadf290 (Q62) |
