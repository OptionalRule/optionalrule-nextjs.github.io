'use client'

import type { IngredientId } from '../types'
import type { IngredientMatchMode } from '../lib/filter'
import { Sprout, FlaskRound } from 'lucide-react'
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
      className={`text-sm px-3 py-1.5 rounded-lg border transition-all duration-200 font-medium ${
        active
          ? 'border-[var(--accent)] text-white bg-[var(--accent)] shadow-sm'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]'
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
    <section className="bg-[var(--card)] border border-[var(--border-light)] rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Filters</h2>
        {onClearAll && (
          <button
            type="button"
            className="px-3 py-1.5 text-sm text-[var(--error)] hover:bg-[var(--error-light)] rounded-lg transition-colors font-medium"
            onClick={onClearAll}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-[var(--success)]" />
              <h3 className="font-medium text-[var(--text-primary)] text-sm">Ingredients</h3>
              {selectedIngredientIds.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent)] text-xs font-medium">
                  {selectedIngredientIds.length}
                </span>
              )}
            </div>
            {/* Compact match mode toggle */}
            <div className="flex items-center gap-2 text-xs" aria-label="Ingredient match mode">
              <span className={ingredientMode === 'any' ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-tertiary)]'}>Any</span>
              <button
                type="button"
                role="switch"
                aria-checked={ingredientMode === 'only'}
                aria-label="Toggle ingredient match mode"
                onClick={() => onChangeIngredientMode(ingredientMode === 'any' ? 'only' : 'any')}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  ingredientMode === 'only' ? 'bg-[var(--accent)]' : 'bg-[var(--surface-2)]'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full transition-transform bg-white shadow-sm ${
                    ingredientMode === 'only' ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className={ingredientMode === 'only' ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-tertiary)]'}>Only</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ingredientOptions.map((opt) => {
              const active = selectedIngredientIds.map(String).includes(String(opt.id))
              return (
                <button
                  key={String(opt.id)}
                  type="button"
                  onClick={() => toggleIngredient(opt.id)}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-lg p-0.5"
                  aria-pressed={active}
                >
                  <ToggleChip active={active} label={opt.name} />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Compact alchemy skill selector */}
      <div className="flex items-center gap-3 pt-1">
        <FlaskRound className="w-4 h-4 text-[var(--info)]" />
        <h3 className="font-medium text-[var(--text-primary)] text-sm">Alchemy Level:</h3>
        <AlchemyLevelSelect 
          value={alchemyLevel} 
          onChange={(lvl) => onChangeAlchemyLevel?.(lvl)} 
          min={0} 
          max={30} 
          size="sm" 
        />
      </div>
    </section>
  )
}
