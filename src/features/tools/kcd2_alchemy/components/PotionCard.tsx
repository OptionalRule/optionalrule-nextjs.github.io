import type { IngredientId, NormalizedPotionRecipe } from '../types'
import { useEffect, useMemo, useState } from 'react'
import { QuantityTable } from './QuantityTable'

export function PotionCard({ potion, highlightIngredientIds = [], playerAlchemyLevel = 0 }: { potion: NormalizedPotionRecipe; highlightIngredientIds?: IngredientId[]; playerAlchemyLevel?: number }) {
  const [tab, setTab] = useState<'default' | 'optimized'>('default')
  const hasOptimized = Boolean(potion.instructions.optimized)

  const recommendedTab: 'default' | 'optimized' = useMemo(() => {
    if (!hasOptimized) return 'default'
    const min = potion.instructions.optimized!.minLevel
    return playerAlchemyLevel >= min ? 'optimized' : 'default'
  }, [hasOptimized, potion.instructions.optimized, playerAlchemyLevel])

  // Follow player skill selection; if user clicks tabs, that manual selection stays
  useEffect(() => {
    setTab(recommendedTab)
  }, [recommendedTab])

  // Ensure default selected tab exists
  const selectedTab: 'default' | 'optimized' = hasOptimized ? tab : 'default'
  const [effectsOpen, setEffectsOpen] = useState(false)
  const [quantitiesOpen, setQuantitiesOpen] = useState(false)
  const effectsPanelId = `effects-${potion.id}`
  const quantitiesPanelId = `quantities-${potion.id}`
  const effectsButtonId = `effects-btn-${potion.id}`
  const quantitiesButtonId = `quantities-btn-${potion.id}`

  return (
    <article className="border border-[var(--border)] rounded-lg p-4 bg-[var(--card)]">
      <header className="mb-3 bg-[var(--header-block-bg)]">
        <h3 className="text-xl font-semibold">{potion.name}</h3>
        <div className="mt-1 text-sm text-[var(--muted-2)]">Base liquid: {potion.ingredients.liquid}</div>
      </header>

      <section className="mb-3">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h4 className="font-medium shrink-0">Ingredients:</h4>
          <ul className="list-none p-0 m-0 text-sm">
            {potion.ingredients.items.map((it) => {
              const isHighlighted = highlightIngredientIds.map(String).includes(String(it.id))
              return (
                <li
                  className="inline after:content-[',_'] last:after:content-['']"
                  key={`${potion.id}-${String(it.id)}`}
                >
                  <span
                    className={
                      isHighlighted
                        ? 'px-1 rounded border border-[var(--link)] text-[var(--link)] bg-[color-mix(in_oklab,var(--link)_12%,transparent)]'
                        : ''
                    }
                  >
                    {it.name} ({it.quantity})
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="mb-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h4 className="font-medium shrink-0">Instructions:</h4>
          <div className="flex items-center gap-2 text-sm" role="tablist" aria-label="Recipe instructions tabs">
          <button
            type="button"
            className={`px-2 py-1 rounded border transition-colors focus-visible:ring-2 focus-visible:ring-[var(--link)] ${
              selectedTab === 'default'
                ? 'border-[var(--link)] text-[var(--link)] bg-[color-mix(in_oklab,var(--link)_12%,transparent)]'
                : 'border-[var(--border)] text-[var(--muted)]'
            }`}
            onClick={() => setTab('default')}
            role="tab"
            aria-selected={selectedTab === 'default'}
          >
            Default
          </button>
          {hasOptimized && (
            <button
              type="button"
              className={`px-2 py-1 rounded border transition-colors focus-visible:ring-2 focus-visible:ring-[var(--link)] ${
                selectedTab === 'optimized'
                  ? 'border-[var(--link)] text-[var(--link)] bg-[color-mix(in_oklab,var(--link)_12%,transparent)]'
                  : 'border-[var(--border)] text-[var(--muted)]'
              }`}
              onClick={() => setTab('optimized')}
              role="tab"
              aria-selected={selectedTab === 'optimized'}
            >
              Optimized (Lvl {potion.instructions.optimized!.minLevel})
            </button>
          )}
          </div>
        </div>
        <ol className="list-decimal pl-8 text-sm bg-[var(--chip-bg)] border border-[var(--border)] rounded-lg py-2">
          {(selectedTab === 'optimized' && potion.instructions.optimized
            ? potion.instructions.optimized.steps
            : potion.instructions.default
          ).map((step, i) => (
            <li key={`${potion.id}-step-${selectedTab}-${i}`}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="mb-3">
        <h4 className="m-0">
          <button
            id={effectsButtonId}
            type="button"
            className="w-full flex items-center gap-2 py-1 px-2 rounded border border-[var(--border)] bg-[var(--surfaceHover)] text-left focus-visible:ring-2 focus-visible:ring-[var(--link)]"
            onClick={() => setEffectsOpen((v) => !v)}
            aria-expanded={effectsOpen}
            aria-controls={effectsPanelId}
          >
            <span className="font-medium">Effects</span>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--muted)]">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="w-3.5 h-3.5"
                style={{
                  transform: effectsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease',
                }}
              >
                <path
                  fill="currentColor"
                  d="M7.293 14.707a1 1 0 0 1 0-1.414L9.586 11 7.293 8.707a1 1 0 0 1 1.414-1.414l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414 0z"
                />
              </svg>
            </span>
          </button>
        </h4>
        <div id={effectsPanelId} role="region" aria-labelledby={effectsButtonId} hidden={!effectsOpen} className="shadow-lg p-4 rounded mx-2">
          <table className="w-full text-sm border-separate" style={{ borderSpacing: '0 4px' }}>
            <tbody>
              {potion.effects.map((e, i) => (
                <tr key={`${potion.id}-eff-${i}`}> 
                  <td className="text-right align-top pr-3 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-[var(--border)]">
                      {e.quality}
                    </span>
                  </td>
                  <td className="text-left align-top">{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-3">
        <h4 className="m-0">
          <button
            id={quantitiesButtonId}
            type="button"
            className="w-full flex items-center gap-2 py-1 px-2 rounded border border-[var(--border)] bg-[var(--surfaceHover)] text-left focus-visible:ring-2 focus-visible:ring-[var(--link)]"
            onClick={() => setQuantitiesOpen((v) => !v)}
            aria-expanded={quantitiesOpen}
            aria-controls={quantitiesPanelId}
          >
            <span className="font-medium">Quantities</span>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--muted)]">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="w-3.5 h-3.5"
                style={{
                  transform: quantitiesOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease',
                }}
              >
                <path
                  fill="currentColor"
                  d="M7.293 14.707a1 1 0 0 1 0-1.414L9.586 11 7.293 8.707a1 1 0 0 1 1.414-1.414l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414 0z"
                />
              </svg>
            </span>
          </button>
        </h4>
        <div id={quantitiesPanelId} role="region" aria-labelledby={quantitiesButtonId} hidden={!quantitiesOpen}>
          <QuantityTable quantity={potion.quantity} />
        </div>
      </section>

      

      {potion.notes && (
        <section className="text-sm text-[var(--muted-2)] mt-2">
          <strong>Notes:</strong> {potion.notes}
        </section>
      )}
    </article>
  )
}
