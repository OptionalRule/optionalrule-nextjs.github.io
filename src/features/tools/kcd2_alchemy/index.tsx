'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FlaskRound, HelpCircle } from 'lucide-react'
import { useAlchemyData } from './hooks/useAlchemyData'
import { useFilterView } from './hooks/useFilterView'
import { usePotionFilters } from './hooks/usePotionFilters'
import { SearchBar } from './components/SearchBar'
import { FiltersPanel } from './components/FiltersPanel'
import { PotionList } from './components/PotionList'

export interface Kcd2AlchemyProps {
  className?: string
}

type ToastType = 'info' | 'success' | 'error'

const TOAST_DURATION_MS = 2600

export default function Kcd2Alchemy({ className }: Kcd2AlchemyProps) {
  const { loading, error, potions, ingredientOptions } = useAlchemyData()
  const liquidIds = useMemo(() => Array.from(new Set(potions.map((p) => String(p.ingredients.liquidId)))), [potions])
  const { view, update, saveEnabled, setSaveEnabled, restoredFromSave } = useFilterView(liquidIds)

  const { results, count } = usePotionFilters({
    potions,
    query: view.q,
    ingredientIds: view.ingredients,
    ingredientMode: view.matchMode,
  })

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null)
  const showToast = (msg: string, type: ToastType = 'info') => {
    setToast({ msg, type })
  }

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!restoredFromSave) return
    setToast({ msg: 'Restored your saved filters.', type: 'success' })
  }, [restoredFromSave])

  return (
    <div className={`min-h-screen bg-background text-foreground ${className || ''}`}>
      <header className="py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
                <FlaskRound className="w-5 h-5" />
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
          <SearchBar value={view.q} onChange={(q) => update({ q })} />
          <FiltersPanel
            ingredientOptions={ingredientOptions}
            selectedIngredientIds={view.ingredients}
            ingredientMode={view.matchMode}
            onChangeIngredients={(ids) => update({ ingredients: ids.map(String) })}
            onChangeIngredientMode={(matchMode) => update({ matchMode })}
            onClearAll={() => {
              update({ q: '', ingredients: [], matchMode: 'any', alchemyLevel: 0 })
            }}
            alchemyLevel={view.alchemyLevel}
            onChangeAlchemyLevel={(alchemyLevel) => update({ alchemyLevel })}
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
          <PotionList potions={results} selectedIngredientIds={view.ingredients} playerAlchemyLevel={view.alchemyLevel} />
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
