# KCD2 Filter View Module Implementation Plan (#8)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:test-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** One hook-backed module, `useFilterView`, owns the KCD2 Alchemy filter view: state, URL codec, hydration precedence, versioned Saved Filters (with the liquid migration as a run-once versioned step), and persistence. `index.tsx` becomes a thin consumer.

**Context:** [docs/wiki/kcd2-filter-view.md](../../wiki/kcd2-filter-view.md) (facts as of `b18e4aa`), decisions Q4, Q6, Q7, Q12, Q13, Q16 in [docs/wiki/decision-log.md](../../wiki/decision-log.md).

Root: `src/features/tools/kcd2_alchemy/`. All paths below are relative to it.

## Global constraints

- No user-visible behaviour change. Anything that would change one stops work and goes to the user.
- Public URL params stay `q`, `ingredients`, `ingMode`, `alchLvl`. Legacy `ingMode=all` still reads as `only` (Q12).
- Internal field names are `matchMode` and `alchemyLevel` (Q12). `matchMode` is typed `IngredientMatchMode` from `lib/filter.ts`.
- Storage keys stay `kcd2Alchemy:saveEnabled` and `kcd2Alchemy:filters`. The stored record keeps its field names (`q`, `ingredients`, `ingMode`, `alchemyLevel`) because it is a persisted wire format, like the URL. A `version` field is added. A record with no `version` is version 1 and still loads (Q13).
- No `any`. Unused params get a `_` prefix. No code comments.
- The test environment is the repo's Vitest unit config (happy-dom, with the in-memory Storage fallback in `src/test-setup.ts`). Tests use real `window.history`, `popstate` and `localStorage`. They do not mock the module under test.
- Dead code is deleted in its own commit, one per deletion (Q4).
- Commits use `refactor(kcd2_alchemy): …` / `test(kcd2_alchemy): …` / `chore(kcd2_alchemy): …` / `docs(kcd2_alchemy): …`.
- Gates: `npx vitest run --config vitest.unit.config.ts src/features/tools/kcd2_alchemy`, `npm run lint`, `npx tsc --noEmit`. Run `npm run graph:update` after src changes.

## Behaviour to preserve (pinned by tests)

1. **URL parse.** `q` = raw value or `''`. `ingredients` = comma-split, trimmed, empties dropped. `ingMode` = `only` if the value is `only` or `all`, else `any`. `alchLvl` = `Number(v)` if the value is non-empty and finite, else `0`.
2. **URL serialise.** This is patch-scoped: only the keys in the update are written. Other params, including unknown ones, are left as they are. `q` is trimmed and removed when empty. `ingredients` is joined with `,` and removed when empty. `ingMode` is removed when `any`. `alchLvl` is `Number(x) || 0` and removed when `<= 0`. Writes use `history.replaceState` on the current pathname.
3. **No-op guard.** If the patched fields equal the current state and the resulting query string equals the current one, nothing is written.
4. **Hydration precedence**, per field: URL, then saved, then default. A param counts as present only if `URLSearchParams.get` returns a non-empty string, so `?q=` counts as missing. A saved field counts as present when: `q` is a string (an empty string counts), `ingredients` is an array (an empty array counts), `ingMode` is a non-empty string, `alchemyLevel` is a number.
5. **Applying saved fields.** Any saved field that is applied is written into the URL once on mount. `restoredFromSave` is true if at least one saved field was applied, and `index.tsx` then shows the "Restored your saved filters." toast.
6. **saveEnabled.** It starts true if a saved record exists, otherwise it follows the `saveEnabled` flag. On mount, a saved record sets the flag. If save is enabled, the current view is written. If save is disabled, the flag and filters are cleared.
7. **Write order.** With save on, every update writes storage before it writes the URL (from `375ce47`).
8. **Back/forward.** `popstate` re-reads the whole view from the URL. Saved filters are not merged in. If save is on, the result is persisted.
9. **Toggle.** Turning save on sets the flag and writes the view. Turning it off removes the flag and the filters.
10. **Liquid migration** (`addLiquidsToLiquidlessOnlyFilter`, from `5bd571a`). It runs once, the first time a non-empty `liquidIds` is supplied, against the current view. With save on, the result is persisted.
    - Today it runs on every load, against whatever the view holds. Q13 makes it versioned for saved filters, so it is skipped when the ingredients came from a version 2 saved record.
    - It still runs when the ingredients came from the URL. URLs have no version, and old shared links must keep working. When they came from a version 1 (unversioned) record, it runs too.
    - Until the step has settled, records are written as version 1, so closing the tab before the data loads does not skip the migration. Once it settles, the record is rewritten as version 2.

11. **Defensive reads and writes.** Every `window` access is guarded for no-window rendering. Storage errors are swallowed. Saved `ingredients` go through `.map(String)`, because stored ids can be numbers. A saved `ingredients` counts as present when it is truthy (item 4 narrows this to an array only to drop malformed values). `q` is stored untrimmed, while the URL holds it trimmed.
12. **Migration settles at hydration when it can.** The ingredients source alone decides whether the migration is eligible; the `ingMode` source is ignored.
    - Ingredients from a version 2 record: settled at hydration, and the record is written as version 2. A current record is never downgraded.
    - Ingredients from the URL or a version 1 record: pending until `liquidIds` arrive. If the record was version 1 at load, it keeps being written as version 1 until then. A record that was version 2 at load is never written as version 1.
    - A user edit made before data loads does not settle the step (same as today).
    - If the data never loads, the step stays pending and the next load retries.
13. `index.tsx` memoizes `liquidIds` from `potions`, and the hook also guards with a run-once ref. `restoredFromSave` is fixed after mount.

## Resolved: hydration reruns (Q19)

The reviewer found, and a characterization test against the current code (`e2401da`) confirmed, that the hydrate effect in `index.tsx` does not run only once. It depends on `[setQueryState]`, and `useQueryState` recreates that callback on every state change, so the effect reruns after every change. With Save View on, this has two user-visible effects:

- **(a)** After an ordinary edit, the "Restored your saved filters." toast appears again. Measured: typing `ab` into search shows the toast.
- **(b)** Back/forward navigation refills any params missing from the target URL with values from the pre-navigation record. Measured: from `?q=mint&alchLvl=5`, popstate to `?ingMode=only` ends at `?ingMode=only&q=mint&alchLvl=5`.

A module that restores saved filters once at load (items 5 and 8 above) fixes both, which changes what users see. The choice is between:

- **Option 1:** fix both. Restore once at load; popstate shows exactly the URL.
- **Option 2:** preserve both bugs exactly.

**Decision (Q19, 2026-11-21): Option 1.** Items 5 and 8 stand as written. Tests pin the fix: the toast appears once and not again after edits, and popstate does not merge in saved fields.

## Design it twice

**A. Single React hook (chosen).**

```ts
export interface FilterView { q: string; ingredients: string[]; matchMode: IngredientMatchMode; alchemyLevel: number }
export interface FilterViewControls {
  view: FilterView
  update: (patch: Partial<FilterView>) => void
  saveEnabled: boolean
  setSaveEnabled: (enabled: boolean) => void
  restoredFromSave: boolean
}
export function useFilterView(liquidIds: readonly string[]): FilterViewControls
```

- The URL codec, the saved-record codec and versioning, and hydration are private functions in the same file.
- Callers learn five members. The caller passes `liquidIds` and the hook decides whether and when the migration runs, so ordering bugs like `375ce47` and `5bd571a` cannot reappear in `index.tsx`.
- Tests drive the hook through `renderHook` plus the real `history` and `localStorage`. That is the same seam the component uses.

**B. A framework-free store plus a thin `useSyncExternalStore` hook.** `createFilterViewStore({ location, history, storage })` exposes `getSnapshot/subscribe/update/setSaveEnabled/applyLiquidIds`.

- It injects history and storage, but there is only one adapter (the browser), so the seam would be hypothetical.
- The interface grows to two layers and about eight members. The migration timing moves back to the caller (`applyLiquidIds`).
- Tests could run without React, but the brief requires round-trips through real jsdom history and storage, which A covers just as well.

**Comparison.** A has the smaller interface and keeps all the ordering inside the module (locality). B's injection seam is not justified while there is only one adapter. **Choose A.**

## File map

- Create `hooks/useFilterView.ts`: the module.
- Create `__tests__/filter-view.test.tsx`: round-trip tests for the hook.
- Modify `index.tsx`: use `useFilterView`, keep the toast and UI, and compute `liquidIds` from `potions`.
- Rewrite `__tests__/Kcd2Alchemy.test.tsx`: mock only `useAlchemyData` (the data-fetch seam). Render the real children against real history and storage.
- Delete `hooks/useQueryState.ts`, `lib/persist.ts`, `__tests__/query-state.test.tsx`, `__tests__/query-state-alchLvl.test.tsx` and `__tests__/persist.test.ts`. They are absorbed into the module, and their tests move to `filter-view.test.tsx`.
- Delete `hooks/usePersistentAlchemyState.ts` (own commit) and `components/Toast.tsx` (own commit). Both are dead (Q4).
- Modify `docs/PLAN.md`: point the `useQueryState` references at `useFilterView`.
- Modify `GLOSSARY.md`: add **Filter View** and **Saved Filters** (Q6, domain-modeling).

## Tasks

### Task 1: Delete dead code (Q4)
- [ ] `git rm hooks/usePersistentAlchemyState.ts`. Confirm with grep that there are no importers. Run the tests. Commit `chore(kcd2_alchemy): delete unused usePersistentAlchemyState hook`.
- [ ] `git rm components/Toast.tsx`, then grep, test and commit `chore(kcd2_alchemy): delete unused Toast component`.

### Task 2: `useFilterView` via TDD
- [ ] Write `__tests__/filter-view.test.tsx` and confirm it fails because the module is missing. In `beforeEach`, `history.replaceState(null,'','/tools/kcd2_alchemy/')` and `localStorage.clear()`. Cases:
  - parse: all four params, legacy `ingMode=all` → `only`, a non-numeric `alchLvl` → 0, and an ingredients list with blanks
  - patch-scoped serialise: an unrelated param survives; `q` is trimmed; defaults remove their params
  - the no-op guard writes no history entry (spy on `history.replaceState` without mocking it)
  - precedence: URL beats saved; `?q=` counts as missing; saved beats default; applied saved fields appear in the URL; `restoredFromSave`
  - saveEnabled initial state from the record or the flag; disabling on mount clears the filters
  - an update with save on writes storage before the URL (assert storage inside a `replaceState` spy)
  - popstate re-reads the URL and persists
  - toggling off clears; toggling on writes
  - a legacy unversioned record loads, and the liquid migration runs and the record is rewritten as version 2
  - a version 2 record with Only and no liquids is not migrated
  - a URL with Only and no liquids is still migrated
  - the record stays version 1 while the migration is pending
  - the migration runs only once
- [ ] Implement `hooks/useFilterView.ts` until the tests pass. Commit `refactor(kcd2_alchemy): add useFilterView module owning URL, hydration and saved filters`.

### Task 3: index.tsx thin consumer
- [ ] Rewrite `__tests__/Kcd2Alchemy.test.tsx`. Mock only `useAlchemyData` and render the real children. Cover:
  - typing a search updates the URL and the result count
  - saved filters restore with the toast and show in the URL
  - a legacy saved Only filter gains liquids after data load
  - the Save View toggle writes and clears storage
  - the loading and error text
- [ ] Switch `index.tsx` to `useFilterView`. Remove the hydrate, migrate and persist effects, `setStateAndPersist` and `_appliedSavedOnce`.
- [ ] Delete `hooks/useQueryState.ts`, `lib/persist.ts` and their three test files (their cases now live in `filter-view.test.tsx`).
- [ ] Gates green. Commit `refactor(kcd2_alchemy): make index a thin consumer of useFilterView`.

### Task 4: Glossary
- [ ] Add **Filter View** and **Saved Filters** under a "Saving and sharing" heading. Commit `docs(kcd2_alchemy): define Filter View and Saved Filters`.

### Task 5: Review and land
- [ ] Have a fresh reviewer agent check the diff against CLAUDE.md and this plan, then fix its findings.
- [ ] Run `npm run graph:update`. Rebase onto `origin/develop`, retest, then push fast-forward only to `origin develop`.
