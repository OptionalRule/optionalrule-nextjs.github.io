# KCD2 Alchemy filter view (#8)

Facts as of `b18e4aa` (2026-11-21, explorer report). Paths are under `src/features/tools/kcd2_alchemy/`.

- `QueryState` = `{q, ingredients, ingMode, alchLvl}` (hooks/useQueryState.ts:15). The persisted type uses `alchemyLevel` instead. `IngredientMatchMode` in lib/filter.ts is not reused.
- `ingMode` and `alchLvl` are **public URL param names**, so shared links depend on them. The glossary says to use "Match Mode" and "Alchemy Level".
- The URL parse is duplicated (initial state + popstate), and so is serialise (the no-change check + the write). index.tsx also reads the URL directly. Writes use replaceState.
- Storage keys are `kcd2Alchemy:saveEnabled` and `kcd2Alchemy:filters`, with no schema version. The only migration is `addLiquidsToLiquidlessOnlyFilter`, run from an effect with no deps that is guarded by a ref.
- Load precedence per field: URL, then saved, then default. An empty param counts as missing.
- Dead code: `hooks/usePersistentAlchemyState.ts` and all of `components/Toast.tsx`.
- No test round-trips URL + storage + hydration against the real modules. `Kcd2Alchemy.test.tsx` mocks four modules.

See [architecture-strong-items](architecture-strong-items.md).

## 2026-11-21 Lane C progress
- The worktree branch `worktree-agent-aaf3ff58757fdc938` holds `38da341` and `e2401da` (dead-code deletions) and `237fcb9` (the plan). Not merged.
- Bug found as of `712ffab`: the hydrate effect depends on `setQueryState`, whose identity changes on every edit, so it reruns. The restore toast reappears, and popstate refills params from saved filters. This waits on the user (Q19).
- The test env is happy-dom, not jsdom.

## 2026-11-21 #8 landed (`66de407`..`31e8257`)
- `useFilterView(liquidIds)` in `hooks/useFilterView.ts` owns the URL codec, the versioned saved filters (`version: 2`; unversioned saves still load) and the run-once liquid migration. `index.tsx` only consumes it. `useQueryState` and `lib/persist` are removed.
- Q19 is implemented. A save made while the migration is pending is written as version 1, so the migration isn't skipped.
- Tests: `filter-view.test.tsx` (30, real happy-dom history and storage). `Kcd2Alchemy.test.tsx` now mocks only `useAlchemyData`. 60 kcd2 tests.
- Still open (pre-existing): the restore toast's timer can hide the "Saving filters enabled." toast early.
- 2026-11-21: in the same push range, one toast timer now restarts on each toast, so each toast gets its full 2.6s.
