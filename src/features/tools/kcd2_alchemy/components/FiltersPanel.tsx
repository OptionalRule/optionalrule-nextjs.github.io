'use client'

import type { IngredientId } from '../types'

export interface FiltersPanelProps {
  ingredientOptions: { id: IngredientId; name: string }[]
  effectOptions: string[]
  selectedIngredientIds: IngredientId[]
  selectedEffects: string[]
  onChangeIngredients: (ids: IngredientId[]) => void
  onChangeEffects: (effects: string[]) => void
  onClearAll?: () => void
}

function ToggleChip({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`text-sm px-2 py-1 rounded border transition-colors ${
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
  effectOptions,
  selectedIngredientIds,
  selectedEffects,
  onChangeIngredients,
  onChangeEffects,
  onClearAll,
}: FiltersPanelProps) {
  const toggleIngredient = (id: IngredientId) => {
    const set = new Set<string>(selectedIngredientIds.map(String))
    const key = String(id)
    if (set.has(key)) set.delete(key)
    else set.add(key)
    onChangeIngredients(Array.from(set))
  }

  const toggleEffect = (label: string) => {
    const set = new Set(selectedEffects.map((s) => s.toLowerCase()))
    const key = label.toLowerCase()
    if (set.has(key)) set.delete(key)
    else set.add(key)
    onChangeEffects(Array.from(set))
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
          <h3 className="text-sm font-medium mb-2">Ingredients</h3>
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

        <div>
          <h3 className="text-sm font-medium mb-2">Effect Quality</h3>
          <div className="flex flex-wrap gap-2">
            {effectOptions.map((label) => {
              const active = selectedEffects.map((s) => s.toLowerCase()).includes(label.toLowerCase())
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleEffect(label)}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--link)] rounded"
                  aria-pressed={active}
                  data-active={active}
                >
                  <ToggleChip active={active} label={label} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
