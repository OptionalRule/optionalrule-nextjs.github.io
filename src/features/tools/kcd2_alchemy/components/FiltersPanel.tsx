'use client'

import type { IngredientId } from '../types'
import type { IngredientMatchMode } from '../lib/filter'
import { AlchemyLevelSelect } from './AlchemyLevelSelect'

export interface FiltersPanelProps {
  ingredientOptions: { id: IngredientId; name: string }[]
  selectedIngredientIds: IngredientId[]
  ingredientMode: IngredientMatchMode
  onChangeIngredients: (ids: IngredientId[]) => void
  onChangeIngredientMode: (mode: IngredientMatchMode) => void
  onClearAll?: () => void
  alchemyLevel?: number
  onChangeAlchemyLevel?: (level: number) => void
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
  alchemyLevel = 0,
  onChangeAlchemyLevel,
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
            {/* Match mode slider: Any <switch> Only */}
            <div className="flex items-center gap-2 text-xs" aria-label="Ingredient match mode">
              <span className={ingredientMode === 'any' ? 'text-[var(--link)] font-semibold' : 'text-[var(--muted)]'}>Any</span>
              <button
                type="button"
                role="switch"
                aria-checked={ingredientMode === 'only'}
                aria-label="Toggle ingredient match mode"
                onClick={() => onChangeIngredientMode(ingredientMode === 'any' ? 'only' : 'any')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full border-2 bg-[var(--chip-bg)] focus-visible:ring-2 focus-visible:ring-[var(--link)] transition-colors
                  ${ingredientMode === 'only' ? 'border-[var(--link)]' : 'border-[var(--border)]'}`}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-[var(--card)] border border-[var(--muted)] transition-transform"
                  style={{ transform: ingredientMode === 'only' ? 'translateX(16px)' : 'translateX(1px)' }}
                />
              </button>
              <span className={ingredientMode === 'only' ? 'text-[var(--link)] font-semibold' : 'text-[var(--muted)]'}>Only</span>
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

      {/* Alchemy skill selector */}
      <div className="pt-3 flex items-center">
        <AlchemyLevelSelect value={alchemyLevel} onChange={(lvl) => onChangeAlchemyLevel?.(lvl)} min={0} max={30} size="sm" />
      </div>
    </section>
  )
}
