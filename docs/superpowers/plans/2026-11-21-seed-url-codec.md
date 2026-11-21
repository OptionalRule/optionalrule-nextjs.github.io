# Seed URL Codec Implementation Plan (#5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. TDD: each task writes its failing test first.

**Goal:** One typed codec owns parse, serialise, defaults and equality for Generation Options, and one Seed Link builder is used by all five sites that build seed URLs. Seed Links gain a `v` (Generator Version) param. No generator output change; the golden fixture must not change.

**Architecture:** `lib/seedUrl.ts` becomes the codec module. Its interface is:

```ts
export interface SeedLink { options: GenerationOptions; generatorVersion: GeneratorVersion }
export const OPTION_DEFAULTS: Omit<GenerationOptions, 'seed'>
export function decodeSeedLink(search: string | URLSearchParams): SeedLink
export function buildSeedLink(link: SeedLink): string            // '?seed=…[&option=…][&v=N]'
export function sameGenerationOptions(a: GenerationOptions, b: GenerationOptions): boolean
```

Behind the seam: a private `OPTION_SCHEMA` mapped over `Exclude<keyof GenerationOptions, 'seed'>`, where each entry is `{ defaultValue, values: Record<Union, true> }`. The `Record<Union, true>` type makes the value set exhaustive and closed against the unions in `types.ts` at compile time, so the unions are not repeated by hand. `OPTION_DEFAULTS`, parsing, serialising and equality all iterate the schema. Adding an option means adding it to `GenerationOptions` (the generator needs it anyway) and one schema entry; the mapped type makes forgetting the entry a compile error.

Paths are relative to `src/features/tools/star_system_generator/`.

## Binding decisions

- **Q28:** one codec, one builder for 5 sites, `v` param, missing `v` means version 2. No output change.
- **Q29 (context):** a later change ships `GENERATOR_VERSION = 3` and keeps the v2 classifier; it will dispatch on the decoded version. This change only carries the version in state.
- **Golden fixture must not change.** Never regenerate it.
- `normalizeSeed` is untouched and still applied to the decoded `seed`.
- Project rules: no `any`, no comments, Conventional Commits scope `star_system_generator`, `npm run graph:update` at the end. Do not edit `docs/wiki`.

## Design it twice

- **A. Flat state** (`GenerationOptions & { v }`): fewer type names, but `v` would leak into `generateSystem` inputs and `system.options`, which the golden hash covers. Rejected.
- **B. Nested `SeedLink { options, generatorVersion }`** (chosen): `GenerationOptions` stays the generator input; the version sits beside it. The hook keeps returning `options` as before and adds the version as a third tuple element, so `index.tsx` and `SeedControl` are unchanged.
- **C. Per-site helpers** (`linkedSystemHref(system, seed)`, `parentHref(seed)`): shallower; each new link kind adds an entry point. Rejected for one `buildSeedLink(SeedLink)` that every site calls with `{ options: { ...system.options, seed }, generatorVersion: system.generatorVersion }`.

## Version policy

- `GeneratorVersion` type lives in `types.ts` (`export type GeneratorVersion = 2`). `GeneratedSystem.generatorVersion` is narrowed from `number` to it (same value, type-only). `GENERATOR_VERSION` in `lib/generator/index.ts` is typed `GeneratorVersion`.
- Supported versions: a private `SUPPORTED_GENERATOR_VERSIONS: readonly GeneratorVersion[] = [2]` in the codec. `LEGACY_GENERATOR_VERSION = 2` is the version implied by a link without `v`.
- **Missing `v`** decodes as 2 (every link shared before this change was made by v2).
- **Unknown, future, malformed or empty `v`** (`v=3` today, `v=99`, `v=02`, `v=abc`, `v=`) decodes as the current `GENERATOR_VERSION`. No crash, no error UI. Rationale: an old deploy cannot reproduce a newer version, and a garbled value names no version; the current generator is the most useful fallback. The URL is then rewritten with the resolved `v`, so the address bar shows what was actually generated. Only canonical positive integers (`/^[1-9]\d*$/`) are matched.
- **Edits adopt the current version.** The decoded version persists while the link is viewed unchanged. Any `setQueryState` that changes seed or an option sets `generatorVersion = GENERATOR_VERSION`. A no-op update returns the same state object.
- **Linked/parent links carry the version of the system they came from** (`system.generatorVersion`), so a companion opened from a v2 system is also v2. Today `generateSystem` stamps the constant; **Q29 must stamp the version it dispatched on**, otherwise companion links from a v2 link would be written as v3.
- Option values are matched with `Object.hasOwn` against the schema's value record (so `constructor`/`__proto__` fall back to the default) and read with `params.get` (first duplicate wins), as before.
- Rewriting an unsupported `v` (e.g. a v3 link on a stale cached v2 deploy) is deliberate: the rewritten link reproduces exactly what the viewer saw, so re-sharing it is honest.

### Review findings applied

Plan review: Q29 stamping requirement recorded above; hasOwn/first-value parsing made explicit; typed construction uses an explicit-key `mapOptions(pick)` (the mapped return type enforces completeness) plus a `hasOwn` type guard, and version matching uses `find` over the supported list, so no casts beyond `Object.keys`.
- `buildSeedLink` always writes `v` (last param). Option params keep their current order and omit defaults.

## Behaviour notes for the 5 sites

`buildSeedHref(seed)` read `window.location` and swapped `seed`, returning `pathname?search`. The new builder takes options from `system.options`, which is the state the URL was written from, and returns a relative `?query`, which resolves against the current path. Differences: unrelated extra query params are no longer copied, SSR output now includes options (previously `?seed=` only), and links gain `v`. None are user-visible beyond `v`.

## Tasks

### Task 1: Codec (`lib/seedUrl.ts`)

- [ ] Rewrite `lib/__tests__/seedUrl.test.ts` (failing first):
  - `buildSeedLink` for all-default options returns `?seed=abc123&v=2`; non-default options only; param order `seed, distribution, tone, gu, settlements, v`; percent-encodes `abc123:c1`.
  - Round trip: for every combination of option values, `decodeSeedLink(buildSeedLink(link))` deep-equals `link`.
  - **Legacy table:** a frozen copy of the old `readOptionsFromLocation` parsers in the test file, plus an explicit table of legacy search strings (`?seed=7F3A9C2E&tone=cinematic`, omitted defaults, explicit defaults, every valid value, invalid values such as `REALISTIC`, `hub ` with space, empty, `constructor`, `__proto__`, duplicated params, an `abc123:c1` seed, odd seed characters). Assert decoded `options` equals both the explicit expectation and the legacy reference; `generatorVersion` is 2.
  - Missing `seed` still yields a random normalised seed (`/^[0-9a-f]+$/`).
  - Version table: missing → 2; `2` → 2; `3`, `99`, `02`, `abc`, `''`, `-1`, `2.0` → `GENERATOR_VERSION`.
  - `sameGenerationOptions` true for equal, false when any single field differs.
  - `OPTION_DEFAULTS` equals the old literal.
- [ ] Implement the codec. Remove `buildSeedParams` and `buildSeedHref`. Delete `__tests__/seedUrl.test.ts` (it tested `buildSeedHref` window behaviour that no longer exists).
- [ ] `types.ts`: add `GeneratorVersion`; narrow `GeneratedSystem.generatorVersion`. `lib/generator/index.ts`: type `GENERATOR_VERSION`.

### Task 2: Hook (`hooks/useGeneratorQueryState.ts`)

- [ ] Extend `__tests__/query-state.test.tsx`: an unversioned URL is rewritten to include `v=2`; the hook exposes the decoded version; an edit sets the current version; existing tests unchanged.
- [ ] State becomes `SeedLink`; read via `decodeSeedLink(window.location.search)` (SSR fallback unchanged: `0000000000000000` + defaults, current version); write via `buildSeedLink`; equality via `sameGenerationOptions`; return `[options, setQueryState, generatorVersion]`. Hand-written parsers deleted.

### Task 3: The five sites

- [ ] `lib/export/markdown.ts:148`: `buildSeedLink({ options: { ...system.options, seed }, generatorVersion: system.generatorVersion })`. Extend `markdown-companion.test.ts` to assert `v=2`.
- [ ] `components/SystemOverview.tsx` (parent and linked companion), `viewer3d/chrome/StarDetailCard.tsx`, `viewer3d/scene/Scene.tsx` (anchor and mesh `onClick`, which assigns the built href to `window.location.href`).
- [ ] `grep -rn "searchParams.set('seed'\|buildSeedHref\|buildSeedParams"` returns nothing.

### Task 4: Docs

- [ ] `GLOSSARY.md`: add **Seed Link** and **Generator Version** under Generation (via domain-modeling).
- [ ] `docs/adr/0002-seed-links-carry-generator-version.md`: links carry `v`; missing means 2; unknown falls back to current; edits adopt current. One-line pointer added to ADR-0001's consequences.

### Verification

- [ ] `npx vitest run --config vitest.unit.config.ts src/features/tools/star_system_generator` (includes golden), `npm run lint`, `npx tsc --noEmit`.
- [ ] `git diff origin/develop -- src/features/tools/star_system_generator/__tests__/__fixtures__` is empty.

## Non-goals

- `components/GeneratorControls.tsx` keeps its own value/label lists (UI labels are a separate concern).
- No dispatch on version in the generator (Q29).
