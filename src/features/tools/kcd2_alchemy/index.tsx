'use client'

import React, { useMemo } from 'react'
import { useAlchemyData } from './hooks/useAlchemyData'
import { useQueryState } from './hooks/useQueryState'
import { usePotionFilters } from './hooks/usePotionFilters'
import { SearchBar } from './components/SearchBar'
import { FiltersPanel } from './components/FiltersPanel'
import { PotionList } from './components/PotionList'

export interface Kcd2AlchemyProps {
  className?: string
}

export default function Kcd2Alchemy({ className }: Kcd2AlchemyProps) {
  const { loading, error, potions, ingredientOptions, effectQualities } = useAlchemyData()
  const [queryState, setQueryState] = useQueryState()

  const selectedIngredientIds = useMemo(() => queryState.ingredients, [queryState.ingredients])
  const selectedEffects = useMemo(() => queryState.effects, [queryState.effects])

  const { results, count } = usePotionFilters({
    potions,
    query: queryState.q,
    ingredientIds: selectedIngredientIds,
    effectQualities: selectedEffects,
  })

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
            effectOptions={effectQualities}
            selectedIngredientIds={selectedIngredientIds}
            selectedEffects={selectedEffects}
            onChangeIngredients={(ids) => setQueryState({ ingredients: ids.map(String) })}
            onChangeEffects={(effects) => setQueryState({ effects })}
            onClearAll={() => setQueryState({ q: '', ingredients: [], effects: [] })}
          />
          <div className="text-sm text-[var(--muted-2)]">{count} result{count === 1 ? '' : 's'}</div>
        </section>

        {loading && (
          <div className="text-sm text-[var(--muted-2)]">Loading data…</div>
        )}
        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && <PotionList potions={results} />}
      </main>
    </div>
  )
}

export { Kcd2Alchemy }
