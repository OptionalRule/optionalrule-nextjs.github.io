import type { NormalizedPotionRecipe } from '../types'
import { useState } from 'react'
import { QuantityTable } from './QuantityTable'

export function PotionCard({ potion }: { potion: NormalizedPotionRecipe }) {
  const [tab, setTab] = useState<'default' | 'optimized'>('default')
  const hasOptimized = Boolean(potion.instructions.optimized)

  // Ensure default selected tab exists
  const selectedTab: 'default' | 'optimized' = hasOptimized ? tab : 'default'

  return (
    <article className="border border-[var(--border)] rounded-md p-4 bg-[var(--card)]">
      <header className="mb-3">
        <h3 className="text-xl font-semibold">{potion.name}</h3>
        <div className="mt-1 text-sm text-[var(--muted-2)]">Base liquid: {potion.ingredients.liquid}</div>
      </header>

      <section className="mb-3">
        <h4 className="font-medium">Ingredients</h4>
        <ul className="list-disc pl-6 text-sm">
          {potion.ingredients.items.map((it) => (
            <li key={`${potion.id}-${String(it.id)}`}>{it.name} × {it.quantity}</li>
          ))}
        </ul>
      </section>

      <section className="mb-3">
        <h4 className="font-medium">Effects</h4>
        <ul className="pl-0 text-sm space-y-1">
          {potion.effects.map((e, i) => (
            <li key={`${potion.id}-eff-${i}`}>
              <span className="inline-block text-xs font-semibold mr-2 px-2 py-0.5 rounded bg-[var(--surfaceHover)] border border-[var(--border)]">
                {e.quality}
              </span>
              <span>{e.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-3">
        <h4 className="font-medium mb-2">Quantities</h4>
        <QuantityTable quantity={potion.quantity} />
      </section>

      <section className="mb-2">
        <div className="flex items-center gap-2 mb-2 text-sm">
          <button
            type="button"
            className={`px-2 py-1 rounded border ${selectedTab === 'default' ? 'bg-[var(--surfaceHover)]' : ''}`}
            onClick={() => setTab('default')}
            aria-pressed={selectedTab === 'default'}
          >
            Default
          </button>
          {hasOptimized && (
            <button
              type="button"
              className={`px-2 py-1 rounded border ${selectedTab === 'optimized' ? 'bg-[var(--surfaceHover)]' : ''}`}
              onClick={() => setTab('optimized')}
              aria-pressed={selectedTab === 'optimized'}
            >
              Optimized (Lvl {potion.instructions.optimized!.minLevel})
            </button>
          )}
        </div>
        <ol className="list-decimal pl-6 text-sm space-y-1">
          {(selectedTab === 'optimized' && potion.instructions.optimized
            ? potion.instructions.optimized.steps
            : potion.instructions.default
          ).map((step, i) => (
            <li key={`${potion.id}-step-${selectedTab}-${i}`}>{step}</li>
          ))}
        </ol>
      </section>

      {potion.notes && (
        <section className="text-sm text-[var(--muted-2)] mt-2">
          <strong>Notes:</strong> {potion.notes}
        </section>
      )}
    </article>
  )
}

