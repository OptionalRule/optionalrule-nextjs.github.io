# Dependency Upgrade — 2026-11-21

Package manager: npm. Audit tool: `npm audit` (Snyk not installed). Node floor: 24 (`engines`, `.nvmrc`).

## Baseline

Build, test (1772), lint, typecheck all pass. `npm audit`: **40 distinct advisories** — 5 critical (all `next`), 14 high, 19 moderate, 2 low.

Direct-dependency sources: `next` (17 advisories, incl. 5 critical RCEs fixed by 16.4.5+), `happy-dom` (3, needs 21.0.4), `vitest`/`@vitest/mocker` (2, fixed in 4.1.12), `sharp` (2, pinned by our own `overrides` at 0.35.3; fixed in 0.35.5). The rest are transitive (`brace-expansion`, `js-yaml`, `minimatch`, `nanoid`, `fflate`, `postcss-selector-parser`, `source-map-js`, `zod`, `vite`).

## Groups

| # | Group | Packages | Tier | Risk |
|---|---|---|---|---|
| 1 | Patch sweep | `tailwindcss` `@tailwindcss/postcss` 4.3.3→4.3.5; `@testing-library/react` 16.3.2→16.3.3; `@testing-library/user-event` 14.6.1→14.6.13; `@types/node` 25.9.5→25.9.9; `tsx` 4.23.1→4.23.15; `turndown` 7.2.4→7.2.5; `globby` 16.2.2→16.2.4; `baseline-browser-mapping` 2.11.8→2.11.39; **`overrides.sharp` 0.35.3→0.35.5** | patch | low — sharp is unreachable at runtime (`output: 'export'`, `images.unoptimized`) but the override pins a vulnerable version |
| 2 | Next.js + React | `next` `eslint-config-next` 16.2.12→16.4.6; `react` `react-dom` 19.2.8→19.3.1; `@types/react` `@types/react-dom` →19.3.0 | minor | medium — clears all 5 critical advisories; 16.4 changes are additive (Cache Components opt-in, `ensureStatic`). Static export must still build |
| 3 | 3D viewer | `three` `@types/three` 0.185→0.187; `@react-three/fiber` 9.6.1→9.8.2; `@react-three/drei` 10.7.7→10.7.9; `@react-three/postprocessing` 3.0.4→3.2.2; `postprocessing` 6.39.4→6.39.6 | 0.x minor | medium — r186/r187 rename/remove APIs (`Source`→`TextureSource`, `LightProbeGrid*`, `PCFSoftShadowMap` on WebGPU, `CubeUVReflectionMapping`, `setViewport`/`setScissor` pixel-ratio change); grep shows none in use. PMREM change may shift material look slightly. Peers all satisfied (`postprocessing` caps three `<0.188`) |
| 4 | Misc minor | `lucide-react` 1.28→1.77; `playwright` 1.62.1→1.65.1; `typescript-eslint` pair 8.65.0→8.73.0 (+ matching `overrides`, kept exact) | minor | low |
| 5 | Testing majors | `vitest` `@vitest/coverage-v8` 4.1.10→5.1.1; `@testing-library/jest-dom` 7.0.0→8.0.0; `happy-dom` 20.11.1→21.0.4 | major | medium — Vitest 5: `clearMocks` defaults on (setup already clears per test), `vi.mock` must be top-level (all are), `coverage.include/exclude` now root-relative (CI runs `test:coverage` with thresholds — gate on it). jest-dom 8 only drops Vitest <5. happy-dom 21 disables CSS/iframe loading by default (tests don't depend on it) |
| 6 | Transitive | `npm update` for remaining flagged transitives; targeted `overrides` only if a parent pins below the fix | — | low |

Extra gates for this repo: `npm run lint:ci` (CI uses `--max-warnings=0`) and `npm run test:coverage` (CI thresholds).

## Deliberate holds

- `eslint` 9.39.5 → 10.15.0 — `eslint-config-next` 16.4.6 still bundles `eslint-plugin-react` 7.37.5, whose peer range stops at `^9.7`; ESLint 10 crashed it last pass. Already on the `maintenance` tag (9.39.5).
- `typescript` 6.0.3 → 7.0.2 — `typescript-eslint` 8.73.0 still peers `typescript <6.1.0`.
- `@types/node` 25 → 26 — Node floor is 24; staying on the 25.x types line.

## Results

| # | Group | Outcome | Advisories after |
|---|---|---|---|
| 1 | Patch sweep | **applied** — all gates pass; `overrides.sharp` 0.35.5 cleared both sharp advisories | 38 |
| 2 | Next.js + React | **applied** — React 19.3 is outside `@react-three/fiber` 9.6.1's peer range (`<19.3`), so the react-three packages from group 3 moved here (fiber 9.8.2 allows `<19.4`). No peer overrides needed | 22 |
| 3 | 3D viewer | **applied** — three r187; all gates pass. The WebGL viewer has no runtime test coverage, so a manual look at `/tools/star_system_generator/` is worth doing for the r187 PMREM change | 22 |
| 4 | Misc minor | **applied** — typescript-eslint 8.73.0 in both `devDependencies` and `overrides`, exact | 21 |
| 5 | Testing majors | **applied** — Vitest 5 began counting `__snapshots__/*.snap` files as coverage sources (root-relative `coverage.include` of `src/**/*`); added `src/**/__snapshots__/**` to `coverage.exclude`. Same 1772 tests; coverage 83.07% vs 83.00% baseline | 10 |
| 6 | Transitive | **applied** — `npm update` cleared `brace-expansion`, `js-yaml`, `nanoid`, `fflate`, `source-map-js`, `zod` within existing ranges. `@tailwindcss/typography` 0.5.20 (latest) pins `postcss-selector-parser` exactly at 6.0.10, so added `overrides.postcss-selector-parser` 6.1.6 (the `legacy-v6` patch line); typography CSS verified in build output | **0** |

Gates per group: `build`, `lint:ci`, `typecheck`, `test:coverage`; plus `validate-config` at the end.

`npm audit`: **40 → 0** distinct advisories.

Remaining outdated, all deliberate holds (see above): `eslint` 10, `typescript` 7, `@types/node` 26.

New override to revisit: `postcss-selector-parser` 6.1.6 — drop it once `@tailwindcss/typography` stops pinning 6.0.10.
