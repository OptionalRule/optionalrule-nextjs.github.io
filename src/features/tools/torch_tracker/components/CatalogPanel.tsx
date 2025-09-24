'use client'

import { useMemo } from 'react'
import type { TorchCatalogEntry } from '../types'
import { CatalogButton } from './CatalogButton'

const CATEGORY_ORDER: Array<TorchCatalogEntry['category']> = [
  'mundane',
  'magical',
  'environmental',
  'custom',
]

const CATEGORY_HEADINGS: Record<TorchCatalogEntry['category'], string> = {
  mundane: 'Mundane Sources',
  magical: 'Magical Sources',
  environmental: 'Environmental Sources',
  custom: 'Custom Templates',
}

export interface CatalogPanelProps {
  entries: TorchCatalogEntry[]
  selectedId?: string | null
  disabledIds?: string[]
  onSelect: (entry: TorchCatalogEntry) => void
  className?: string
}

export function CatalogPanel({ entries, selectedId = null, disabledIds = [], onSelect, className }: CatalogPanelProps) {
  const grouped = useMemo(() => {
    const map = new Map<TorchCatalogEntry['category'], TorchCatalogEntry[]>()
    for (const entry of entries) {
      if (!map.has(entry.category)) {
        map.set(entry.category, [])
      }
      map.get(entry.category)!.push(entry)
    }
    for (const [_category, items] of map) {
      items.sort((a, b) => a.name.localeCompare(b.name))
    }
    return map
  }, [entries])

  return (
    <section
      className={`space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)]/70 p-6 shadow-sm ${className ?? ''}`.trim()}
      aria-label="Light source catalog"
    >
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Catalog</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Choose a light source to add it to the active roster.
        </p>
      </header>

      <div className="space-y-8">
        {CATEGORY_ORDER.map((category) => {
          const items = grouped.get(category)
          if (!items || items.length === 0) return null
          return (
            <section key={category} aria-labelledby={`catalog-${category}`} className="space-y-3">
              <div>
                <h3 id={`catalog-${category}`} className="text-sm font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                  {CATEGORY_HEADINGS[category]}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((entry) => (
                  <CatalogButton
                    key={entry.id}
                    entry={entry}
                    selected={selectedId === entry.id}
                    disabled={disabledIds.includes(entry.id)}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}

