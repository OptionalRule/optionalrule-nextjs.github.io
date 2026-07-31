# Dependency Upgrade Plan — 2026-07-31

Project: `optionalrule-blog` · Package manager: **npm** · Branch: `develop`
Node: v24.15.0 (`.nvmrc` = 24, `engines.node` = `>=24`)

## Baseline

All gates green before any changes:

| Gate | Result |
|---|---|
| `npm run build` | pass |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | pass — 213 files, 1749 tests |

**Security baseline (`npm audit`): 9 vulnerabilities — 2 low, 7 high.**

| Package | Severity | Advisory | Reachable via |
|---|---|---|---|
| `next` | high | (Next.js advisory) | direct dep |
| `postcss` <=8.5.17 | high | GHSA-r28c-9q8g-f849 — path traversal via sourceMappingURL | **pinned by our own `overrides`** |
| `sharp` <0.35.0 | high | GHSA-f88m-g3jw-g9cj — libvips CVEs | transitive (next) |
| `js-yaml` | high | GHSA-52cp-r559-cp3m — quadratic CPU | transitive (gray-matter) |
| `brace-expansion` | high | GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg — DoS | transitive |
| `esbuild` 0.27.3–0.28.0 | low | GHSA-g7r4-m6w7-qqqr — dev-server file read (Windows) | transitive (vite/vitest) |
| `@babel/core` <=7.29.0 | low | GHSA-4x5r-pxfx-6jf8 — arbitrary file read | transitive |

Note: `npm audit` is used in place of Snyk — Snyk CLI is not installed and no `SNYK_TOKEN` is present on this machine.

## Discovery

29 outdated packages: **17 patch**, **7 minor**, **5 major**.

## Notable findings

### TypeScript 7.0.2 — BLOCKED, do not upgrade

TypeScript 7 is the Go ("Corsa") rewrite. It ships **no stable programmatic compiler API** — that
is deferred to 7.1. `typescript-eslint` reads the compiler API, and its peer range is explicitly
`typescript: ">=4.8.4 <6.1.0"`, so npm will refuse the install outright. This is intentional
upstream, not a resolvable conflict.

`eslint-config-next` pulls typescript-eslint transitively, and this repo also pins
`@typescript-eslint/*` in `overrides`, so there is no way to keep linting working on TS 7.

**Decision: stay on TypeScript 6.0.3.** Revisit after TS 7.1 ships a stable API and
typescript-eslint widens its peer range. If the ~10x check speed is wanted sooner, the upstream
recommendation is to add `@typescript/native-preview` as a *separate* devDependency for
type-checking only, leaving `typescript` on 6.x for the lint toolchain — that is a separate task,
not a version bump.

### `postcss` override pins a vulnerable version

`overrides.postcss` is `8.5.15`. The active advisory covers `<=8.5.17`; latest is `8.5.25`.
The override is *causing* one of the 7 high-severity findings — `npm audit fix` cannot resolve it
because our own override forces the vulnerable version. Bumping the override is the fix.

### `@eslint/eslintrc` is a dead dependency

`eslint.config.mjs` is pure flat config and imports only `eslint-config-next` and
`@typescript-eslint/eslint-plugin`. Nothing in the repo imports `@eslint/eslintrc` or `FlatCompat`.
It is a leftover from the v8→v9 flat-config migration. Flagged for removal rather than bumping.

### `@types/node` — hold at the 25.x line

Latest is `26.1.2`, but this project's Node floor is 24 (`.nvmrc`, `engines.node`, and CI).
`@types/node` majors track Node majors; installing 26 types against a Node 24 runtime invites
type-checking against APIs that do not exist at runtime. Taking `25.9.5` (the `wanted` patch) instead.

### three.js r185 — clean for this codebase

r185 removes `AnamorphicNode`, `LWOLoader`, `SVGLoader.createShapes()`, `TiledLighting`; renames
several TSL functions and `LightProbeGrid*`; makes `SimplifyModifier` async; and changes
`toTrianglesDrawMode()` to mutate in place. **A grep of `src/` found zero usages of any affected
API.** three imports are architecturally confined to `viewer3d/` (enforced by a
`no-restricted-imports` lint rule), and that directory imports only `three` and `three-stdlib`.
`three-stdlib@2.36.1` peers `three: >=0.128.0`; `@react-three/drei` peers `>=0.159`;
`@react-three/fiber` peers `>=0.156`. All satisfied by 0.185.1.

### `@testing-library/jest-dom` 7.0.0

Breaking: `@testing-library/dom` becomes a **required** peer (`>=10 <11`), and Node floor rises to
22. Both already satisfied — `@testing-library/dom@10.4.1` resolves via `@testing-library/react`,
and we run Node 24. Low practical risk despite the major.

### ESLint 10.8.0

Breaking: legacy eslintrc config system fully removed; new config lookup algorithm (resolves from
each linted file's directory rather than cwd); `eslint-env` comments now error; `eslint:recommended`
updated; Node <20.19/21/23 dropped. This repo is already on flat config with no `eslint-env`
comments, so the main risk is rule-set drift from the updated `recommended` set.
`@typescript-eslint/parser` already declares `eslint: ^10.0.0` support, and
`eslint-config-next@16.2.12` peers `eslint: >=9.0.0`.

## Execution plan

Ordered patch → minor → major; within tier, least-coupled first.

| # | Group | Packages | Tier | Risk |
|---|---|---|---|---|
| 1 | React core | `react` `react-dom` 19.2.7→19.2.8; `@types/react` 19.2.17→19.2.18; `@types/react-dom` 19.2.3→19.2.4 | patch | **low** — patch-only, peers unchanged |
| 2 | Next.js | `next` `eslint-config-next` 16.2.7→16.2.12 | patch | **low** — patch, and clears a high-severity advisory |
| 3 | Tailwind / PostCSS | `tailwindcss` `@tailwindcss/postcss` 4.3.0→4.3.3; `@tailwindcss/typography` 0.5.19→0.5.20; **`overrides.postcss` 8.5.15→8.5.25** | patch | **low-med** — override edit is hand-written; clears a high-severity advisory |
| 4 | Testing infra | `vitest` `@vitest/coverage-v8` 4.1.8→4.1.10; `happy-dom` 20.10.1→20.11.1; `playwright` 1.60.0→1.62.1 | patch/minor | **low** — dev-only; happy-dom minors occasionally shift DOM behaviour |
| 5 | TS tooling | `@types/node` 25.9.1→25.9.5; `tsx` 4.22.4→4.23.1 | patch/minor | **low** — dev-only |
| 6 | Misc runtime | `fuse.js` 7.4.1→7.5.0; `globby` 16.2.0→16.2.2; `lucide-react` 1.17.0→1.28.0; `postprocessing` 6.39.1→6.39.4; `baseline-browser-mapping` 2.10.34→2.11.8 | minor | **low-med** — lucide spans 11 minors; v1 already dropped brand icons, so icon-name churn is the thing to watch |
| 7 | three.js | `three` 0.184.0→0.185.1; `@types/three` 0.184.1→0.185.1 | 0.x minor (breaking by convention) | **medium** — r185 drops deprecated code; grep shows no affected API in use |
| 8 | Testing majors | `@testing-library/jest-dom` 6.9.1→7.0.0; `jest-axe` 10.0.0→11.0.0 | major | **medium** — jest-dom peers already satisfied; jest-axe 11 may bundle a newer axe-core, which can surface *new* a11y violations in `test:a11y` |
| 9 | ESLint majors | `eslint` 9.39.3→10.8.0; `@typescript-eslint/{eslint-plugin,parser}` 8.60.1→8.65.0 (+ matching `overrides`) | major | **medium-high** — updated `recommended` set may introduce new errors; `lint:ci` runs `--max-warnings=0` |

**Deferred / not upgrading:**

- `typescript` 6.0.3 → 7.0.2 — blocked by typescript-eslint peer range (see above).
- `@types/node` 25.x → 26.1.2 — held to match the Node 24 floor.
- `@eslint/eslintrc` 3.3.5 → 3.3.6 — dead dependency; recommend removal instead of bumping.

## Version-range convention

`package.json` uses caret ranges throughout, **except** `eslint`, `@typescript-eslint/eslint-plugin`,
and `@typescript-eslint/parser`, which are pinned exact and mirrored in `overrides`. Group 9 must
update both the dependency entry and the `overrides` entry, keeping them exact.

## Gates

After **every** group, in order — stop on first failure:
`npm run build` → `npm run lint` → `npm run typecheck` → `npm test` → `npm audit`

On failure: `git checkout -- package.json package-lock.json && npm install`, then report and move on
to the next group rather than forcing the bump.

---

## Outcomes (executed 2026-07-31)

| # | Group | Result |
|---|---|---|
| 1 | React core | **applied** — all gates pass |
| 2 | Next.js | **applied** — all gates pass; cleared the Next.js advisory |
| 3 | Tailwind / PostCSS | **applied** — all gates pass; `overrides.postcss` → 8.5.25 cleared the postcss advisory |
| 4 | Testing infra | **applied** — all gates pass |
| 5 | TS tooling | **applied** — all gates pass |
| 6 | Misc runtime | **applied** — all gates pass; no lucide icon-name breakage |
| 7 | three.js r185 | **applied** — all gates pass; no affected API in use, as predicted |
| 8 | Testing majors | **applied** — all gates pass; axe-core 4.12.1 surfaced no new a11y violations |
| 9 | ESLint majors | **partial** — typescript-eslint 8.65.0 applied; **ESLint 10 rolled back** |

Also applied: `@types/mdx` 2.0.13 → 2.0.14; removed the unused `@eslint/eslintrc` devDependency.

Final gate run: `build` / `lint` / `lint:ci` (`--max-warnings=0`) / `typecheck` pass;
213 test files, 1749 tests pass.

### ESLint 10 — rolled back, blocked upstream

ESLint 10.8.0 installed cleanly but **crashed at lint time**, in two distinct ways, both originating
inside `eslint-config-next`'s own nested dependencies:

1. On `.ts`/`.tsx` files:
   `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function`
   — raised from `eslint-config-next/node_modules/eslint-plugin-react/lib/util/version.js`.
2. On `.mjs` files:
   `TypeError: scopeManager.addGlobals is not a function` — raised from ESLint 10's own
   `source-code.js`.

Root cause: `eslint-config-next@16.2.12` bundles `eslint-plugin-react@7.37.5`, whose peer range is
`^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7` — it does **not** support ESLint 10. These are ESLint 10's
removed deprecated context members biting a plugin that never migrated.

`eslint-config-next`'s declared peer range of `eslint: ">=9.0.0"` is unbounded and therefore
misleading — npm installs the combination happily and it fails only at runtime.

This is not resolvable from our side by version juggling; it needs an ESLint 10-compatible
`eslint-config-next` release from the Next.js team. **`eslint` stays pinned at 9.39.3.**

`@typescript-eslint/*` 8.65.0 was verified to work fine on ESLint 9 and was kept — its own peer
range already advertises `^10.0.0` for whenever the config catches up.

### Still outstanding after this pass

Remaining outdated (all deliberate holds):

- `eslint` 9.39.3 → 10.8.0 — blocked by `eslint-config-next` (above).
- `typescript` 6.0.3 → 7.0.2 — blocked by typescript-eslint peer range.
- `@types/node` 25.9.5 → 26.1.2 — held to the Node 24 floor.

Remaining vulnerabilities: **6 (2 low, 4 high)**, all transitive with no fix reachable from our
direct dependencies:

- `sharp` <0.35.0 (high) — via `next`; needs a Next release that bumps sharp.
- `js-yaml` (high) — via `gray-matter`, which is unmaintained on this axis.
- `brace-expansion` (high) — via typescript-eslint's `typescript-estree` and the root tree.
- `esbuild` 0.27.3–0.28.0 (low) — via vite/vitest; dev-server-only, Windows-only, not a
  production-build concern for a static export.
- `@babel/core` <=7.29.0 (low) — transitive.

`npm audit fix` cannot resolve these without a `--force` major downgrade/upgrade of `next`, which
would be a larger change than this pass intends.

---

## Follow-up pass — transitive vulnerabilities

Most of the "unreachable" transitive vulns above turned out to be reachable after all. The patched
versions already satisfied the existing semver ranges — they simply had not been pulled into the
lockfile. Plain `npm update` moved four of them with no override needed:

- `brace-expansion` 1.1.14 → 1.1.18
- `js-yaml` 3.14.2 → 3.15.0 (gray-matter's copy; the 4.x copy was already patched)
- `esbuild` 0.28.0 → 0.28.1
- `@babel/core` 7.29.0 → 7.29.7

One override was added:

- `sharp` → `0.35.3`. `next` pins `^0.34.5` and npm's only offered fix was downgrading next to
  14.2.35 (two majors). The override is safe here because `output: 'export'` plus
  `images.unoptimized: true` means sharp is never invoked in this build.

Also corrected in this pass: `eslint` 9.39.3 → **9.39.5**. The 9.x maintenance line was invisible to
`npm outdated` — because `eslint` is pinned exact, `wanted` reported 9.39.3 and `latest` reported
10.8.0, so the maintenance line fell in the gap. ESLint publishes it under the `maintenance`
dist-tag. 9.39.4 carried security content (minimatch → ^3.1.5 plus `ajv`/`@eslint/eslintrc`
advisory updates); 9.39.5 backports a v10.3.0 crash fix.

**General lesson: exact-pinned dependencies hide their own maintenance line from `npm outdated`.**
Check `npm view <pkg> dist-tags` for any pinned dependency.

### Reading `npm audit` counts correctly

npm's headline number counts **graph nodes**, not advisories. Measured across commits:

| State | npm headline | distinct advisories |
|---|---|---|
| `4420c3f` (before) | 9 | **17** |
| `fb45343` (after upgrades) | 6 | **7** |
| `ea4575e` (after this pass) | 9 | **1** |

The headline rose 6 → 9 while actual security exposure fell, because `npm update` moved `minimatch`
into a flagged range, so eight additional parent packages became "depends on vulnerable minimatch" —
all tracing to the same single advisory. The commit message on `ea4575e` says "6 → 1", which mixes
the two metrics; the accurate figure is **17 → 1 distinct advisories**. Not amended, since `develop`
history is not rewritten.

### The one remaining advisory

`brace-expansion` — GHSA-mh99-v99m-4gvg (high). **Unfixable on this branch.** The advisory range is
`<=5.0.7` with no lower bound, so every 1.x release matches it permanently; there is no patched 1.x.
Escaping requires `minimatch` 10 (which depends on brace-expansion 5.x), and that arrives with
`eslint` 10 — blocked by `eslint-config-next`. Same wall as the ESLint 10 upgrade above.

It is reached only through the ESLint toolchain, so it is dev-time only and never ships in the
static export.

### ESLint 10 — ecosystem status (checked 2026-07-31)

The blockage is not ecosystem-wide. ESLint 10-ready already:

| Package | ESLint 10 |
|---|---|
| `typescript-eslint` 8.65.0 | yes (`^10`) |
| `eslint-plugin-react-hooks` 7.1.1 | yes (`^10`) |
| `eslint-plugin-import-x` 4.17.1 | yes (`^10`) |
| `@next/eslint-plugin-next` 16.2.12 | yes (no eslint peer constraint) |

The stall is concentrated in the jsx-eslint org, and reads as drift rather than "not yet":

- `eslint-plugin-react` 7.37.5 — last published **2025-04-03**. ESLint 10 issue
  [#3977](https://github.com/jsx-eslint/eslint-plugin-react/issues/3977) open since Feb 2026, no
  assignee, no linked PR, no milestone, no v8 branch or prerelease.
- `eslint-plugin-jsx-a11y` 6.10.2 — last published **2024-10-26**.
- `eslint-plugin-import` 2.32.0 — superseded in practice by the maintained `eslint-plugin-import-x`
  fork, which is ESLint 10-ready.

`eslint-config-next` bundles all of these, so it inherits the weakest link. Tracking issue:
[vercel/next.js#91702](https://github.com/vercel/next.js/issues/91702), open since March 2026.

**Escape hatch if this becomes urgent:** drop `eslint-config-next` and compose the flat config
directly from `@next/eslint-plugin-next` + `typescript-eslint` + `eslint-plugin-react-hooks` +
`eslint-plugin-import-x`. That unblocks ESLint 10 today and would also clear the brace-expansion
advisory. Cost: loses `eslint-plugin-react`'s React rules and `jsx-a11y`'s static a11y rules — the
latter partly redundant here given the jest-axe a11y tests. Not measured yet whether the lost
`eslint-plugin-react` rules actually fire on this codebase; measure before deciding.

**Revisit trigger:** if #91702 is still open at the next dependency pass, or if `eslint-plugin-react`
stays silent much longer — depending on two apparently-unmaintained plugins is a bigger risk than
which ESLint major we run.
