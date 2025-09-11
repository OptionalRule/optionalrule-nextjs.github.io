'use client'

import type { IngredientId } from '../types'
import type { IngredientMatchMode } from '../lib/filter'

export interface FiltersPanelProps {
  ingredientOptions: { id: IngredientId; name: string }[]
  selectedIngredientIds: IngredientId[]
  ingredientMode: IngredientMatchMode
  onChangeIngredients: (ids: IngredientId[]) => void
  onChangeIngredientMode: (mode: IngredientMatchMode) => void
  onClearAll?: () => void
}

function ToggleChip({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`text-sm px-2 py-1 rounded-full border transition-colors ${
        active
          ? 'border-[var(--link)] text-[var(--link)] bg-[color-mix(in_oklab,var(--link)_15%,transparent)]'
          : 'border-[var(--border)] bg-[var(--surfaceHover)] text-[var(--muted)]'
      }`}
    >
      {label}
    </span>
  )
}

export function FiltersPanel({
  ingredientOptions,
  selectedIngredientIds,
  ingredientMode,
  onChangeIngredients,
  onChangeIngredientMode,
  onClearAll,
}: FiltersPanelProps) {
  const toggleIngredient = (id: IngredientId) => {
    const set = new Set<string>(selectedIngredientIds.map(String))
    const key = String(id)
    if (set.has(key)) set.delete(key)
    else set.add(key)
    onChangeIngredients(Array.from(set))
  }

  return (
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Filters</h2>
        {onClearAll && (
          <button
            type="button"
            className="text-sm text-[var(--link)] hover:underline"
            onClick={onClearAll}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium m-0">Ingredients</h3>
            <div className="flex items-center gap-1 text-xs" role="group" aria-label="Ingredient match mode">
              <button
                type="button"
                className={`px-2 py-0.5 rounded border transition-colors ${
                  ingredientMode === 'any'
                    ? 'border-[var(--link)] text-[var(--link)] bg-[color-mix(in_oklab,var(--link)_12%,transparent)]'
                    : 'border-[var(--border)] text-[var(--muted)]'
                }`}
                onClick={() => onChangeIngredientMode('any')}
                aria-pressed={ingredientMode === 'any'}
              >
                Any
              </button>
              <button
                type="button"
                className={`px-2 py-0.5 rounded border transition-colors ${
                  ingredientMode === 'all'
                    ? 'border-[var(--link)] text-[var(--link)] bg-[color-mix(in_oklab,var(--link)_12%,transparent)]'
                    : 'border-[var(--border)] text-[var(--muted)]'
                }`}
                onClick={() => onChangeIngredientMode('all')}
                aria-pressed={ingredientMode === 'all'}
              >
                All
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ingredientOptions.map((opt) => {
              const active = selectedIngredientIds.map(String).includes(String(opt.id))
              return (
                <button
                  key={String(opt.id)}
                  type="button"
                  onClick={() => toggleIngredient(opt.id)}
                  className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--link)] rounded ${active ? 'data-[active=true]' : ''}`}
                  aria-pressed={active}
                  data-active={active}
                >
                  <ToggleChip active={active} label={opt.name} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
