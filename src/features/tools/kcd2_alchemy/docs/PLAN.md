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
          FiltersPanel.tsx         # Ingredient and effect filters
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
      potions.json                 # Potions dataset (references ingredient IDs)
      ingredients.json             # Controlled ingredient list (id -> name)
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

- Sources:
  - `public/tools/kcd2_alchemy/ingredients.json` — controlled ingredient catalog `{ id: string | number, name: string }[]`.
  - `public/tools/kcd2_alchemy/potions.json` — potions dataset that references ingredient IDs.
- Types (defined in `types.ts`):
  - `Ingredient`: `{ id: string | number; name: string }`.
  - `PotionItem`: `{ id: string | number; quantity: number }`.
  - `PotionRecipe`: matches the provided schema with `ingredients.items: PotionItem[]` and no `requiredLevel`.
- Relationship: each `PotionRecipe.ingredients.items[].id` must match an `Ingredient.id` from `ingredients.json`. The UI maps IDs to display names via the catalog.
- Validation: implement a narrow, dependency-free validator in `lib/schema.ts` (scoped to this tool). Validate cross-file referential integrity (every item id exists in `ingredients.json`).
- Normalization: `lib/normalize.ts` builds fast lookup maps (id -> Ingredient), lowercases effect text for filtering, and derives ingredient options for the multi-select.

## 4) UX & Components

- Tool Root (`index.tsx`)
  - Header (title + description), controls row (SearchBar + FiltersPanel), results area (PotionList), and footnotes.
- SearchBar
  - Debounced input; updates `?q=` via `router.replace` (preserve trailing slash), no page navigation. Text search matches recipe `name` and `effects[].description` only.
- FiltersPanel
  - Ingredient multi-select: built from `ingredients.json` (IDs mapped to names). Selecting IDs filters recipes where any `ingredients.items[].id` is selected. Chip UI with clear individually and "Reset all".
  - Effect filter: selection or chips derived from `effects[].quality` and/or curated keywords. Text filter already covers `effects[].description`.
  - Results summary: count and active-filter summary; clear all action.
- PotionList
  - Displays result count, empty state with guidance, and list of `PotionCard`s. Consider simple list first; virtualize later if dataset grows.
- PotionCard
  - Header: name with badges (base liquid; level if present), optional “optimized available at level X”.
  - Ingredients: base liquid + items with quantities.
  - Effects: quality badge + description list.
  - QuantityTable: toggles for perks and computed quantity mode.
  - Instructions: tabs or segmented control for Default vs Optimized (if present). If `instructions.optimized` exists, render the tab label as `Optimized (Lvl {minLevel})`.
  - Notes: collapsible area to keep the card compact.

Accessibility
- All controls labeled, keyboard operable; maintain visible focus outlines.
- Collapsible sections use `aria-expanded` and proper button semantics.
- Color contrast via existing Tailwind tokens; badges readable in dark/light.

## 5) Filtering & URL State

Filter semantics (implemented in `lib/filter.ts`, orchestrated by `usePotionFilters.ts`)
- Text query: case-insensitive substring match across `name` and `effects[].description`.
- Ingredients: include recipe if any selected ingredient ID matches any `ingredients.items[].id` in the recipe.
- Effects: include recipe if any selected effect keyword or quality matches `effects` entries.
- Sorting (initial): by name asc.

URL sync (implemented in `useQueryState.ts`)
- Params: `q`, `ingredients` (comma-separated IDs), `effects` (comma-separated).
- Read on mount; write on changes with `router.replace` to avoid history spam; always keep the route `/tools/kcd2_alchemy/` with trailing slash.
- Default values produce a minimal URL (omit empty params).

## 6) Performance

- Feature dynamic import (`ssr: false`) to isolate bundle cost.
- Debounced search, `useMemo` for filtered results; O(n) filters expected to be sufficient.
- Cache JSON in memory per session; avoid refetching when navigating within the tool.
- Defer list virtualization unless the dataset becomes large.

## 7) Testing Strategy

Unit (Vitest)
- `schema.test.ts`: valid/invalid shapes, referential integrity with `ingredients.json`, optional fields handling, error messaging.
- `filter.test.ts`: individual predicates + composition (query + ingredients + effects).
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
- [x] Create directories (app route + feature module + docs).
- [x] Add `page.tsx` and `Kcd2AlchemyClient.tsx` with `ssr: false` dynamic import.
- [x] Draft `docs/PRD.md` (skeleton) and `README.md` for the tool.
- [x] Add `urlPaths.tool()` and tests.

M2 - Data Types, Validation, Normalization
- [x] Define `types.ts` from the updated schema (items reference ingredient IDs; no `requiredLevel`).
- [x] Implement `lib/schema.ts` validator (no external deps) with cross-file ingredient ID checks.
- [x] Implement `lib/normalize.ts` and test derived indices from `ingredients.json`.

M3 - UI & Filtering
- [x] Build `SearchBar`, `FiltersPanel` (ingredients + effects), `PotionList`, `PotionCard`, `QuantityTable`.
- [x] Implement `useAlchemyData` (load potions + ingredients), `usePotionFilters`, `useQueryState`.
- [x] Wire URL sync; ensure trailing slash semantics.

M4 — Tests, A11y
- [x] Unit tests green for schema/filter/query-state.
- [x] A11y smoke tests pass with `jest-axe`.

M5 — Integration & Polish
- [x] Update `Header.tsx` Tools menu to link to the tool.
- [x] Add metadata image and finalize metadata.
- [x] Validate `npm run test:all` and `npm run build` locally per STANDARDS.md.

M6 - Filter & Search Improvements
- [x] Remove filter Effect Quality functionality and remove the filter option.
- [x] Ingredients filter should have an option to filter for potions with all of the ingredients or any of the ingredients as a clickable toggle next to the Ingredients label.
- [x] When an ingredient filter is selected, the applicable ingredient in the potion card should be highlighted.
- [x] The Text Search box should include a small X inside the input that clears the search text when clicked.
- [x] Update PRD.md as nessisary to relfect these changes and improvements.

M7 - Improved Ingredient Filter
- [x] Ingredient filter 'any' option return all potions that contain at least one of the ingredients provided in the argument list.
- [x] ingredient filter 'all' option should be renamed 'only' and return all potions whose recipes are composed exclusively from the ingredients provided in the argument list. The potion's ingredient list must be a subset of the provided ingredients.
- [x] Ingredient filter should use a toggle slider to select between 'any' or 'only' options instead of the current buttons and should default to 'any'.

M8 - Instructions by Alchemy Skill 
- [ ] Add a dropdown box to select the characters Alchemy Skill Level.
- [ ] The default instructions are selected if the player's alchemy skill is below the instructions.optimized.minLevel.
- [ ] The optimized instructions are selected if the players alchemy skill is at or above the instructions.optimized.minLevel.

M9 - Local Save of State
- [ ] Add toggle to save current filters.
- [ ] Add feature to save locally.
- [ ] Add ? icon to hover over for help text on feature.
- [ ] Add option to clear all searcha nd filter.

M10 - Data Enrichment
- [ ]  Have AI summarize option effects briefly and add to card.
- [ ]  Add base price data to potions and ingredients.
- [ ]  Add data about where and how to find an ingredient to ingredients list.

Other Tasks & Improvements
- [ ] Give each potion card title a background color.
- [ ] Effect pills should have some color scheme.

## 10) Acceptance Criteria (DoD)

- Route `/tools/kcd2_alchemy/` renders client-side without SSR; no console errors.
- Data loads from `public/tools/kcd2_alchemy/potions.json` and renders list entries with:
  - Name, base liquid, ingredients with quantities, effects (quality + description), quantities table, notes.
  - Instructions tabbed: Default; Optimized when present with min level hint.
- Filters function as specified:
  - Text search narrows results across `name` and `effects[].description` (case-insensitive).
  - Ingredient multi-select includes recipes with any matching ingredient ID; effect filters include matching recipes; clear/reset restores defaults.
- URL query params reflect filters; reload restores state.
- A11y checks pass (keyboard operable, labeled controls, adequate contrast).
- `urlPaths.tool('kcd2_alchemy')` returns `/tools/kcd2_alchemy/` and tests pass.
- Repository gates pass locally: `npm run lint`, `npm run test:all`, `npm run build`.

## 11) Risks & Mitigations

- Ingredient ID consistency: ensure data pipelines keep `ingredients.json` and `potions.json` in sync; validate cross-file references at runtime/load.
- Large datasets: start with simple list; add virtualization when needed.
- Effect taxonomy: if free-text descriptions are inconsistent, consider a curated effect tag map in a future iteration.

## 12) Future Enhancements (post-MVP)

- Sorting controls (name, base liquid).
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
