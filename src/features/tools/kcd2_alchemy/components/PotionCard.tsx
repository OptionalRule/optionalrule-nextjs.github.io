import type { IngredientId, NormalizedPotionRecipe } from '../types'
import { useEffect, useMemo, useState } from 'react'
import { Droplet, Sprout, BookOpenText, Sparkles, TestTubes, Info, Coins } from 'lucide-react'
import { QuantityTable } from './QuantityTable'

export function PotionCard({ potion, highlightIngredientIds = [], playerAlchemyLevel = 0 }: { potion: NormalizedPotionRecipe; highlightIngredientIds?: IngredientId[]; playerAlchemyLevel?: number }) {
  const [tab, setTab] = useState<'default' | 'optimized'>('default')
  const hasOptimized = Boolean(potion.instructions.optimized)

  const getQualityColorClass = (quality: string): string => {
    switch (quality.toLowerCase()) {
      case 'weak':
        return 'bg-[var(--strength-weak)]'
      case 'standard':
        return 'bg-[var(--strength-standard)]'
      case 'strong':
        return 'bg-[var(--strength-strong)]'
      case "henry's":
        return 'bg-[var(--strength-superior)]'
      default:
        return 'bg-[var(--strength-weak)]'
    }
  }

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

  const priceText = useMemo(() => {
    const v = potion.baseValue ?? 0
    return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.0+$/,'').replace(/(\.[1-9])0$/,'$1')
  }, [potion.baseValue])

  return (
    <article id={`potion-${potion.id}`} className="border border-[var(--border-light)] rounded-xl p-0 bg-[var(--card)] shadow-sm hover:shadow-md transition-shadow duration-200">
      <header className="p-6 pb-4 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] rounded-t-xl border-b border-[var(--border-light)]">
        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{potion.name}</h3>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
            <Droplet className="w-4 h-4" />
            <span className="font-medium">Base liquid:</span>
            <span className="px-2 py-1 rounded-md bg-[var(--surface-2)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border)]">{potion.ingredients.liquid}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
            <Coins className="w-4 h-4" />
            <span className="font-medium">Base value:</span>
            <span className="px-2 py-1 rounded-md bg-[var(--surface-2)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border)]">{priceText}g</span>
          </div>
        </div>
      </header>

      <section id={`potion-${potion.id}-ingredients`} className="px-6 py-3 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--success-light)] text-[var(--success)]">
            <Sprout className="w-4 h-4" />
          </div>
          <h4 className="font-medium text-[var(--text-primary)]">Ingredients</h4>
        </div>
        <div className="flex flex-wrap gap-1 text-sm">
          {potion.ingredients.items.map((it) => {
            const isHighlighted = highlightIngredientIds.map(String).includes(String(it.id))
            return (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                  isHighlighted
                    ? 'bg-[var(--accent-light)] border border-[var(--accent)] text-[var(--accent)]'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                }`}
                key={`${potion.id}-${String(it.id)}`}
              >
                <span>{it.name}</span>
                <span className="text-xs font-medium opacity-75">(×{it.quantity})</span>
              </span>
            )
          })}
        </div>
      </section>

      <section id={`potion-${potion.id}-instructions`} className="px-6 py-4 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--info-light)] text-[var(--info)]">
            <BookOpenText className="w-4 h-4" />
          </div>
          <h4 className="font-medium text-[var(--text-primary)]">Instructions</h4>
          <div className="ml-auto flex items-center gap-1" role="tablist" aria-label="Recipe instructions tabs">
            <button
              type="button"
              className={`px-2 py-1 rounded-md text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                selectedTab === 'default'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
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
                className={`px-2 py-1 rounded-md text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  selectedTab === 'optimized'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                }`}
                onClick={() => setTab('optimized')}
                role="tab"
                aria-selected={selectedTab === 'optimized'}
              >
                <span>Opt</span>
                <span className="ml-1 px-1 py-0.5 rounded text-xs bg-[var(--warning)] text-white">{potion.instructions.optimized!.minLevel}</span>
              </button>
            )}
          </div>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
          <ol className="space-y-3">
            {(selectedTab === 'optimized' && potion.instructions.optimized
              ? potion.instructions.optimized.steps
              : potion.instructions.default
            ).map((step, i) => (
              <li key={`${potion.id}-step-${selectedTab}-${i}`} className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[var(--text-primary)] leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id={`potion-${potion.id}-effects`} className="px-6 py-4 border-b border-[var(--border-light)]">
        <button
          id={effectsButtonId}
          type="button"
          className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] border border-[var(--border)]"          
          onClick={() => setEffectsOpen((v) => !v)}
          aria-expanded={effectsOpen}
          aria-controls={effectsPanelId}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--warning-light)] text-[var(--warning)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold text-[var(--text-primary)] flex-grow text-left">Effects</span>
          <span className="px-2 py-1 rounded-md bg-[var(--accent-light)] text-[var(--accent)] text-sm font-medium">
            {potion.effects.length}
          </span>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--card)] border border-[var(--border)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200"
              style={{
                transform: effectsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              <path
                fill="currentColor"
                d="M7.293 14.707a1 1 0 0 1 0-1.414L9.586 11 7.293 8.707a1 1 0 0 1 1.414-1.414l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414 0z"
              />
            </svg>
          </div>
        </button>
        
        <div id={effectsPanelId} role="region" aria-labelledby={effectsButtonId} hidden={!effectsOpen} className="mt-4">
          <div className="grid gap-3">
            {potion.effects.map((e, i) => (
              <div key={`${potion.id}-eff-${i}`} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--card-section)] border border-[var(--border)]">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${getQualityColorClass(e.quality)} border border-[var(--border)]`}>
                  {e.quality}
                </span>
                <p className="text-[var(--text-primary)] leading-relaxed flex-grow">{e.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id={`potion-${potion.id}-quantities`} className="px-6 py-4 border-b border-[var(--border-light)]">
        <button
          id={quantitiesButtonId}
          type="button"
          className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] border border-[var(--border)]"
          onClick={() => setQuantitiesOpen((v) => !v)}
          aria-expanded={quantitiesOpen}
          aria-controls={quantitiesPanelId}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
            <TestTubes className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold text-[var(--text-primary)] flex-grow text-left">Quantities</span>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--card)] border border-[var(--border)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200"
              style={{
                transform: quantitiesOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              <path
                fill="currentColor"
                d="M7.293 14.707a1 1 0 0 1 0-1.414L9.586 11 7.293 8.707a1 1 0 0 1 1.414-1.414l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414 0z"
              />
            </svg>
          </div>
        </button>
        
        <div id={quantitiesPanelId} role="region" aria-labelledby={quantitiesButtonId} hidden={!quantitiesOpen} className="mt-4 p-4 rounded-xl bg-[var(--card-section)] border border-[var(--border)]">
          <QuantityTable quantity={potion.quantity} />
        </div>
      </section>

      

      {potion.notes && (
        <section id={`potion-${potion.id}-notes`} className="px-6 py-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--warning-light)] border border-[var(--warning)] border-opacity-30">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--warning)] text-white flex-shrink-0 mt-1">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-[var(--text-primary)] mb-1">Notes</h5>
              <p className="text-[var(--text-secondary)] leading-relaxed">{potion.notes}</p>
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
