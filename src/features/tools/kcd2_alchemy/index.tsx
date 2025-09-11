
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useAlchemyData } from './hooks/useAlchemyData'
import { useQueryState, type QueryState } from './hooks/useQueryState'
import { usePotionFilters } from './hooks/usePotionFilters'
import { SearchBar } from './components/SearchBar'
import { FiltersPanel } from './components/FiltersPanel'
import { PotionList } from './components/PotionList'
import { getSaveEnabled as getPersistFlag, setSaveEnabled as setPersistFlag, readPersistedFilters, writePersistedFilters, clearPersistedFilters } from './lib/persist'

export interface Kcd2AlchemyProps {
  className?: string
}

export default function Kcd2Alchemy({ className }: Kcd2AlchemyProps) {
  const { loading, error, potions, ingredientOptions } = useAlchemyData()
  const [queryState, setQueryState] = useQueryState()

  const selectedIngredientIds = useMemo(() => queryState.ingredients, [queryState.ingredients])
  const ingredientMode = queryState.ingMode

  const { results, count } = usePotionFilters({
    potions,
    query: queryState.q,
    ingredientIds: selectedIngredientIds,
    ingredientMode,
  })

  const [alchemyLevel, setAlchemyLevel] = useState<number>(0)
  const [saveEnabled, setSaveEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    // If saved filters exist, show toggle as enabled; otherwise use persisted flag
    const hasSaved = Boolean(readPersistedFilters())
    if (hasSaved) return true
    return getPersistFlag()
  })
  const [appliedSavedOnce, setAppliedSavedOnce] = useState(false)

  // Local persistence integration
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const saved = readPersistedFilters()
    if (saved) {
      // Ensure flag is set for future loads
      try { setPersistFlag(true) } catch {}
      const patch: Partial<QueryState> = {}
      if (!sp.get('q') && saved.q !== undefined) patch.q = saved.q
      if (!sp.get('ingredients') && saved.ingredients) patch.ingredients = saved.ingredients.map(String)
      if (!sp.get('ingMode') && saved.ingMode) patch.ingMode = saved.ingMode
      if (Object.keys(patch).length) {
        setQueryState(patch)
        setAppliedSavedOnce(true)
      }
      if (typeof saved.alchemyLevel === 'number') setAlchemyLevel(saved.alchemyLevel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Safety net: if save is enabled and filters are still default, apply saved once.
  useEffect(() => {
    if (!saveEnabled || appliedSavedOnce) return
    const isDefault =
      (queryState.q ?? '') === '' &&
      (Array.isArray(queryState.ingredients) ? queryState.ingredients.length === 0 : true) &&
      queryState.ingMode === 'any'
    if (!isDefault) return
    const saved = readPersistedFilters()
    if (!saved) return
    const patch: Partial<QueryState> = {}
    if (saved.q !== undefined) patch.q = saved.q
    if (saved.ingredients) patch.ingredients = saved.ingredients.map(String)
    if (saved.ingMode) patch.ingMode = saved.ingMode
    if (Object.keys(patch).length) {
      setQueryState(patch)
      setAppliedSavedOnce(true)
    }
    if (typeof saved.alchemyLevel === 'number') setAlchemyLevel(saved.alchemyLevel)
  }, [saveEnabled, appliedSavedOnce, queryState.q, queryState.ingredients, queryState.ingMode, setQueryState])

  useEffect(() => {
    setPersistFlag(saveEnabled)
    if (!saveEnabled) {
      // Clear saved data when disabling the feature
      clearPersistedFilters()
      return
    }
    writePersistedFilters({
      q: queryState.q,
      ingredients: queryState.ingredients,
      ingMode: queryState.ingMode,
      alchemyLevel,
    })
  }, [saveEnabled, queryState.q, queryState.ingredients, queryState.ingMode, alchemyLevel, setQueryState])

  return (
    <div className={`min-h-screen bg-background text-foreground ${className || ''}`}>
      <header className="pt-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">KCD2 Alchemy Scholar</h1>
          <p className="text-[var(--muted-2)] mt-1">
            Browse and filter Kingdom Come: Deliverance 2 alchemy recipes.<br />
          </p>
          <p className="text-[var(--muted-2)] text-right italic">* Recipes by <a href="https://github.com/Omricon/Henrys-Moste-Potente-Potions" className="underline" target="_blank" rel="noopener noreferrer">Omricon</a>.</p>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-4">
        <section className="flex flex-col gap-3">
          <SearchBar value={queryState.q} onChange={(q) => setQueryState({ q })} />
          <FiltersPanel
            ingredientOptions={ingredientOptions}
            selectedIngredientIds={selectedIngredientIds}
            ingredientMode={ingredientMode}
            onChangeIngredients={(ids) => setQueryState({ ingredients: ids.map(String) })}
            onChangeIngredientMode={(mode) => setQueryState({ ingMode: mode })}
            onClearAll={() => {
              setQueryState({ q: '', ingredients: [], ingMode: 'any' })
              setAlchemyLevel(0)
            }}
            alchemyLevel={alchemyLevel}
            onChangeAlchemyLevel={setAlchemyLevel}
            saveEnabled={saveEnabled}
            onToggleSave={() => setSaveEnabled((v) => !v)}
          />
          <div className="text-sm text-[var(--muted-2)]">{count} result{count === 1 ? '' : 's'}</div>
        </section>

        {loading && (
          <div className="text-sm text-[var(--muted-2)]">Loading data…</div>
        )}
        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && (
          <PotionList potions={results} selectedIngredientIds={selectedIngredientIds} playerAlchemyLevel={alchemyLevel} />
        )}
      </main>
    </div>
  )
}

export { Kcd2Alchemy }
