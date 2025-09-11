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

  // Save toggle and tiny toast
  const [saveEnabled, setSaveEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const hasSaved = Boolean(readPersistedFilters())
    if (hasSaved) return true
    return getPersistFlag()
  })
  const [appliedSavedOnce, setAppliedSavedOnce] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'success' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ msg, type })
    window.setTimeout(() => setToast(null), 2600)
  }

  // Hydrate from saved once
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const saved = readPersistedFilters()
    if (saved) {
      try { setPersistFlag(true) } catch {}
      const patch: Partial<QueryState> = {}
      if (!sp.get('q') && saved.q !== undefined) patch.q = saved.q
      if (!sp.get('ingredients') && saved.ingredients) patch.ingredients = saved.ingredients.map(String)
      if (!sp.get('ingMode') && saved.ingMode) patch.ingMode = saved.ingMode
      if (!sp.get('alchLvl') && typeof saved.alchemyLevel === 'number') patch.alchLvl = saved.alchemyLevel
      if (Object.keys(patch).length) {
        setQueryState(patch)
        setAppliedSavedOnce(true)
        showToast('Restored your saved filters.', 'success')
      }
    }
  }, [setQueryState])

  // Safety net for SPA nav timing: apply once if still default
  useEffect(() => {
    if (!saveEnabled || appliedSavedOnce) return
    const isDefault = (queryState.q ?? '') === '' && (queryState.ingredients?.length ?? 0) === 0 && queryState.ingMode === 'any'
    if (!isDefault) return
    const saved = readPersistedFilters()
    if (!saved) return
    const patch: Partial<QueryState> = {}
    if (saved.q !== undefined) patch.q = saved.q
    if (saved.ingredients) patch.ingredients = saved.ingredients.map(String)
    if (saved.ingMode) patch.ingMode = saved.ingMode
    if (typeof saved.alchemyLevel === 'number') patch.alchLvl = saved.alchemyLevel
    if (Object.keys(patch).length) {
      setQueryState(patch)
      setAppliedSavedOnce(true)
    }
  }, [saveEnabled, appliedSavedOnce, queryState, setQueryState])

  // Persist on changes (when enabled)
  useEffect(() => {
    setPersistFlag(saveEnabled)
    if (!saveEnabled) {
      clearPersistedFilters()
      return
    }
    writePersistedFilters({
      q: queryState.q,
      ingredients: queryState.ingredients,
      ingMode: queryState.ingMode,
      alchemyLevel: Number(queryState.alchLvl) || 0,
    })
  }, [saveEnabled, queryState])

  return (
    <div className={`min-h-screen bg-background text-foreground ${className || ''}`}>
      <header className="pt-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">KCD2 Alchemy Scholar</h1>
            {/* Save view toggle in header */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--muted-2)]">Save view</span>
              <button
                type="button"
                role="switch"
                aria-checked={saveEnabled}
                aria-label="Toggle saving current view (search and filters) locally"
                onClick={() => {
                  const next = !saveEnabled
                  setSaveEnabled(next)
                  showToast(next ? 'Saving filters enabled.' : 'Saved filters cleared and disabled.', next ? 'success' : 'info')
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full border-2 bg-[var(--chip-bg)] focus-visible:ring-2 focus-visible:ring-[var(--link)] transition-colors ${saveEnabled ? 'border-[var(--link)]' : 'border-[var(--border)]'}`}
                title="When enabled, your current search, ingredient filters, and alchemy skill are saved and restored here."
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-[var(--card)] border border-[var(--muted)] transition-transform"
                  style={{ transform: saveEnabled ? 'translateX(16px)' : 'translateX(1px)' }}
                />
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-[var(--border)] text-[var(--muted-2)] hover:text-[var(--foreground)] bg-[var(--surface-hover)]"
                aria-label="Help: Save view"
                title="Saves your current search, ingredient filters, and alchemy level to this browser so they persist across visits."
              >
                ?
              </button>
            </div>
          </div>
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
              setQueryState({ q: '', ingredients: [], ingMode: 'any', alchLvl: 0 })
            }}
            alchemyLevel={Number(queryState.alchLvl) || 0}
            onChangeAlchemyLevel={(lvl) => setQueryState({ alchLvl: lvl })}
          />
          <div className="text-sm text-[var(--muted-2)]">{count} result{count === 1 ? '' : 's'}</div>
        </section>

        {loading && (
          <div className="text-sm text-[var(--muted-2)]">Loading data.</div>
        )}
        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && (
          <PotionList potions={results} selectedIngredientIds={selectedIngredientIds} playerAlchemyLevel={Number(queryState.alchLvl) || 0} />
        )}
      </main>

      {/* Tiny toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[100] min-w-[220px] max-w-[320px] text-xs px-3 py-2 rounded-md shadow-lg border bg-[var(--card)] border-[var(--border)]">
          <span className={toast.type === 'success' ? 'text-[var(--success)]' : toast.type === 'error' ? 'text-[var(--error)]' : 'text-[var(--info)]'}>
            {toast.type === 'success' ? '✔ ' : toast.type === 'error' ? '⚠ ' : 'ℹ '}
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

export { Kcd2Alchemy }

