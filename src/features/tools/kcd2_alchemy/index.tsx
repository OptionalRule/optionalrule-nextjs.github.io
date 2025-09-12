'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FlaskConical, HelpCircle } from 'lucide-react'
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
  const [_appliedSavedOnce, setAppliedSavedOnce] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'success' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ msg, type })
    window.setTimeout(() => setToast(null), 2600)
  }

  // Persist immediately before URL change to avoid remount restoring stale saved state
  const setStateAndPersist = (patch: Partial<QueryState>) => {
    if (saveEnabled) {
      const future: QueryState = { ...queryState }
      if (patch.q !== undefined) future.q = patch.q
      if (patch.ingredients !== undefined) future.ingredients = patch.ingredients
      if (patch.ingMode !== undefined) future.ingMode = patch.ingMode
      if (patch.alchLvl !== undefined) future.alchLvl = patch.alchLvl
      writePersistedFilters({
        q: future.q,
        ingredients: future.ingredients,
        ingMode: future.ingMode,
        alchemyLevel: Number(future.alchLvl) || 0,
      })
    }
    setQueryState(patch)
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

  // Removed safety net re-apply to allow intentional clearing of all filters/search when Save View is on.

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
      <header className="py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">KCD2 Alchemy Scholar</h1>
                <p className="text-[var(--text-tertiary)] text-xs">
                  Search and filter Kingdom Come: Deliverance 2 alchemy recipes • Recipes by{' '}
                  <a 
                    href="https://github.com/Omricon/Henrys-Moste-Potente-Potions" 
                    className="text-[var(--link)] hover:text-[var(--link-hover)] underline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Omricon
                  </a>
                </p>
              </div>
            </div>
            
            {/* Compact save view toggle */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--text-secondary)] font-medium">Save view</span>
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
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  saveEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--surface-2)]'
                }`}
                title="When enabled, your current search, ingredient filters, and alchemy skill are saved and restored here."
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full transition-transform bg-white shadow-sm ${
                    saveEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <button
                type="button"
                className="flex items-center justify-center w-4 h-4 rounded-full bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:bg-[var(--surface-3)] hover:text-[var(--text-secondary)] transition-colors"
                aria-label="Help: Save view"
                title="Saves your current search, ingredient filters, and alchemy level to this browser so they persist across visits."
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-3">
        <section className="flex flex-col gap-3">
          <SearchBar value={queryState.q} onChange={(q) => setStateAndPersist({ q })} />
          <FiltersPanel
            ingredientOptions={ingredientOptions}
            selectedIngredientIds={selectedIngredientIds}
            ingredientMode={ingredientMode}
            onChangeIngredients={(ids) => setStateAndPersist({ ingredients: ids.map(String) })}
            onChangeIngredientMode={(mode) => setStateAndPersist({ ingMode: mode })}
            onClearAll={() => {
              setStateAndPersist({ q: '', ingredients: [], ingMode: 'any', alchLvl: 0 })
            }}
            alchemyLevel={Number(queryState.alchLvl) || 0}
            onChangeAlchemyLevel={(lvl) => setStateAndPersist({ alchLvl: lvl })}
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
