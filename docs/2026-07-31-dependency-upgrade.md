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
