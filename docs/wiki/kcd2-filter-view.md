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
