# KCD2 Alchemy Scholar — Implementation Plan (PLAN)

This plan defines the implementation approach for the client‑side tool “KCD2 Alchemy Scholar”, aligning with repository conventions in README.md, documentation/PRD.md, documentation/TDD.md, and documentation/STANDARDS.md. The feature is delivered as a static, client-only experience under the Interactive section.

## 1) Directory Structure (initial scaffolding)

Create the following structure to keep routing and feature code isolated and consistent with the existing Asteroids game pattern:

```
src/
  app/
    (interactive)/
      tools/
        kcd2_alchemy/
          page.tsx                 # Route entry: `/tools/kcd2_alchemy/`
          Kcd2AlchemyClient.tsx    # Dynamic import wrapper (ssr: false)
  features/
    tools/
      kcd2_alchemy/
        index.tsx                  # Tool root: header + filters + list
        types.ts                   # Tool-local types matching JSON schema
        README.md                  # Dev notes and usage
        components/
          FiltersPanel.tsx         # Level, ingredient, effect filters
          SearchBar.tsx            # Debounced search (URL-sync, no navigation)
          PotionList.tsx           # List, empty/loading states, result count
          PotionCard.tsx           # Recipe details + collapsible instructions
          QuantityTable.tsx        # Quantity/perk matrix
        hooks/
          useAlchemyData.ts        # Fetch/validate/normalize JSON, memoized
          usePotionFilters.ts      # Apply filter predicates + derive sets
          useQueryState.ts         # Sync state <-> URL query params
        lib/
          schema.ts                # Narrow validator for JSON shape
          filter.ts                # Pure filter predicates (testable)
          normalize.ts             # Case-normalization + indices
        __tests__/                 # Unit + a11y smoke tests
          schema.test.ts
          filter.test.ts
          query-state.test.ts
          a11y.test.tsx
        docs/
          PRD.md                   # Product Requirements Document for this tool
          PLAN.md                  # This plan
public/
  tools/
    kcd2_alchemy/
      potions.json                 # Data source (static asset)
```

Notes
- File names TypeScript + React, PascalCase for components, consistent with STANDARDS.md.
- Client-only rendering for the feature via dynamic import, like Asteroids.
- No server routes; static export compatibility is mandatory (trailingSlash true).

## 2) Routing & Integration

- Route: `/tools/kcd2_alchemy/` under `src/app/(interactive)/tools/kcd2_alchemy/page.tsx`.
- Client wrapper: `Kcd2AlchemyClient.tsx` uses `next/dynamic` with `ssr: false` and a loading state.
- URL helper: extend `src/lib/urls.ts` with `tool: (name: string) => "/tools/${name}/"` plus tests in `src/lib/urls.test.ts`.
- Header navigation: update `src/components/Header.tsx` “Tools” dropdown to link to the new tool via `urlPaths.tool('kcd2_alchemy')`.
- Metadata: `generateMetadata({ title, description, canonical: urlPaths.tool('kcd2_alchemy'), image })` with an optional splash image at `public/images/interactive/kcd2_alchemy-splash.webp`.

## 3) Data & Schema

- Source: `public/tools/kcd2_alchemy/potions.json` loaded client-side with `fetch`.
- Given schema (from request), represented as TypeScript types in `types.ts`.
- Validation: implement a narrow, dependency-free validator in `lib/schema.ts` (mirroring local `z` style but scoped to this tool). Avoid external deps to preserve static export and bundle hygiene.
- Normalization: `lib/normalize.ts` performs case-folding (lowercase) for ingredients/effects, derives indices (ingredient set, effect keywords), and supplies safe defaults for optional fields.
- Level filtering: the provided schema lacks a root-level brewing requirement. Proposal for optional extension:
  - `requiredLevel?: number` on the recipe root for “filter by alchemy skill level”. If absent, default behavior includes the recipe regardless of selected level; the “Optimized” tab is enabled only when `instructions.optimized?.minLevel <= level`.
  - Document this as an optional field in this tool’s PRD and README. The UI clearly indicates “N/A” for missing required level.

## 4) UX & Components

- Tool Root (`index.tsx`)
  - Header (title + description), controls row (SearchBar + FiltersPanel), results area (PotionList), and footnotes.
- SearchBar
  - Debounced input; updates `?q=` via `router.replace` (preserve trailing slash), no page navigation.
- FiltersPanel
  - Level filter: numeric input or slider (0–20 default; configurable). Shows current selection.
  - Ingredient multi-select: includes base `liquid` and item names; chip UI with clear individually and “Reset all”.
  - Effect filter: free-text with suggestion chips derived from `effects[].description` and `effects[].quality`.
  - Results summary: count and active-filter summary; clear all action.
- PotionList
  - Displays result count, empty state with guidance, and list of `PotionCard`s. Consider simple list first; virtualize later if dataset grows.
- PotionCard
  - Header: name with badges (base liquid; level if present), optional “optimized available at level X”.
  - Ingredients: base liquid + items with quantities.
  - Effects: quality badge + description list.
  - QuantityTable: toggles for perks and computed quantity mode.
  - Instructions: tabs or segmented control for Default vs Optimized (if present), with optimized requirement hint.
  - Notes: collapsible area to keep the card compact.

Accessibility
- All controls labeled, keyboard operable; maintain visible focus outlines.
- Collapsible sections use `aria-expanded` and proper button semantics.
- Color contrast via existing Tailwind tokens; badges readable in dark/light.

## 5) Filtering & URL State

Filter semantics (implemented in `lib/filter.ts`, orchestrated by `usePotionFilters.ts`)
- Text query: case-insensitive substring match across `name`, `ingredients.liquid`, `ingredients.items[].name`, `effects[].description`.
- Level: include recipe if `requiredLevel` is undefined or `requiredLevel <= selectedLevel`.
- Ingredients: include recipe if any selected ingredient matches base liquid or any item name (case-insensitive).
- Effects: include recipe if any selected effect keyword or quality matches `effects` entries.
- Sorting (initial): by name asc; optionally add “level asc” toggle in a later iteration.

URL sync (implemented in `useQueryState.ts`)
- Params: `q`, `level`, `ingredients` (comma-separated), `effects` (comma-separated).
- Read on mount; write on changes with `router.replace` to avoid history spam; always keep the route `/tools/kcd2_alchemy/` with trailing slash.
- Default values produce a minimal URL (omit empty params).

## 6) Performance

- Feature dynamic import (`ssr: false`) to isolate bundle cost.
- Debounced search, `useMemo` for filtered results; O(n) filters expected to be sufficient.
- Cache JSON in memory per session; avoid refetching when navigating within the tool.
- Defer list virtualization unless the dataset becomes large.

## 7) Testing Strategy

Unit (Vitest)
- `schema.test.ts`: valid/invalid shapes, optional fields handling, error messaging.
- `filter.test.ts`: individual predicates + composition (query + level + ingredients + effects).
- `query-state.test.ts`: query param round-trip (parse -> state -> URL string).

A11y (jest-axe)
- `a11y.test.tsx`: mount root and core components (FiltersPanel, PotionCard) and ensure no critical violations.

Integration
- `src/lib/urls.test.ts`: add tests for `urlPaths.tool('kcd2_alchemy')`.
- SSG/build checks: ensure no server-only APIs used and route compiles under static export.

## 8) Documentation & Stories

- Tool PRD: `src/features/tools/kcd2_alchemy/docs/PRD.md` covering overview, users, goals, schema, UX flows, performance, a11y, acceptance criteria, and risks. Model after `documentation/asteroids/PRD.md` and repository `documentation/PRD.md`.
- README: quickstart, JSON contract, known limitations, and contribution notes.
- Storybook: stories for `PotionCard` (default/optimized/missing fields), `FiltersPanel` (interactive), and `SearchBar`.

## 9) Milestones & Tasks

M1 — Scaffolding & Docs
- [ ] Create directories (app route + feature module + docs).
- [ ] Add `page.tsx` and `Kcd2AlchemyClient.tsx` with `ssr: false` dynamic import.
- [ ] Draft `docs/PRD.md` (skeleton) and `README.md` for the tool.
- [ ] Add `urlPaths.tool()` and tests.

M2 — Data Types, Validation, Normalization
- [ ] Define `types.ts` from the provided schema.
- [ ] Implement `lib/schema.ts` validator (no external deps); decide on `requiredLevel?` extension and document it.
- [ ] Implement `lib/normalize.ts` and test derived indices.

M3 — UI & Filtering
- [ ] Build `SearchBar`, `FiltersPanel`, `PotionList`, `PotionCard`, `QuantityTable`.
- [ ] Implement `useAlchemyData`, `usePotionFilters`, `useQueryState`.
- [ ] Wire URL sync; ensure trailing slash semantics.

M4 — Tests, A11y, Stories
- [ ] Unit tests green for schema/filter/query-state.
- [ ] A11y smoke tests pass with `jest-axe`.
- [ ] Add Storybook stories; basic visual review.

M5 — Integration & Polish
- [ ] Update `Header.tsx` Tools menu to link to the tool.
- [ ] Add metadata image and finalize metadata.
- [ ] Validate `npm run test:all` and `npm run build` locally per STANDARDS.md.

## 10) Acceptance Criteria (DoD)

- Route `/tools/kcd2_alchemy/` renders client-side without SSR; no console errors.
- Data loads from `public/tools/kcd2_alchemy/potions.json` and renders list entries with:
  - Name, base liquid, ingredients with quantities, effects (quality + description), quantities table, notes.
  - Instructions tabbed: Default; Optimized when present with min level hint.
- Filters function as specified:
  - Text search narrows across name/ingredients/effects (case-insensitive).
  - Level: when `requiredLevel` exists, recipes above selected level are excluded; when missing, recipes remain visible but “optimized” tab respects `minLevel`.
  - Ingredient and effect filters include matching recipes; clear/reset restores defaults.
- URL query params reflect filters; reload restores state.
- A11y checks pass (keyboard operable, labeled controls, adequate contrast).
- `urlPaths.tool('kcd2_alchemy')` returns `/tools/kcd2_alchemy/` and tests pass.
- Repository gates pass locally: `npm run lint`, `npm run test:all`, `npm run build`.

## 11) Risks & Mitigations

- Schema ambiguity for level requirement: mitigate by optional `requiredLevel?` with clear UI/Docs; retain functionality without it.
- Large datasets: start with simple list; add virtualization when needed.
- Effect taxonomy: if free-text descriptions are inconsistent, consider a curated effect tag map in a future iteration.

## 12) Future Enhancements (post-MVP)

- Sorting controls (name, required level, base liquid).
- Saved presets (localStorage) for common filter combinations.
- Tag chips for common effects with curated synonyms.
- Print-friendly view of a recipe.
- Import alternate JSON datasets or versions.

## 13) References

- Repo PRD: `documentation/PRD.md`
- Repo TDD: `documentation/TDD.md`
- Standards: `documentation/STANDARDS.md`
- Asteroids reference:
  - Route: `src/app/(interactive)/games/asteroids/page.tsx`
  - Feature: `src/features/games/asteroids/`

---
Maintainers should follow Conventional Commits, keep modules small and focused, use `@/*` path aliasing, and ensure all URLs include trailing slashes to satisfy static export requirements.
