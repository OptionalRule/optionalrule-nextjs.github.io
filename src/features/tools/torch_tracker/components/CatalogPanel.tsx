'use client'

import { useMemo } from 'react'
import type { TorchCatalogEntry } from '../types'
import { CatalogButton } from './CatalogButton'

export interface CatalogPanelProps {
  entries: TorchCatalogEntry[]
  selectedId?: string | null
  disabledIds?: string[]
  onSelect: (entry: TorchCatalogEntry) => void
  className?: string
}

export function CatalogPanel({ entries, selectedId = null, disabledIds = [], onSelect, className }: CatalogPanelProps) {
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => a.name.localeCompare(b.name))
  }, [entries])

  return (
    <nav
      id="catalog"
      aria-label="Light source catalog"
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-0)]/80 px-4 py-3 shadow-sm ${className ?? ''}`.trim()}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Add:</span>
      {sortedEntries.map((entry) => (
        <CatalogButton
          key={entry.id}
          entry={entry}
          onSelect={onSelect}
          selected={selectedId === entry.id}
          disabled={disabledIds.includes(entry.id)}
        />
      ))}
    </nav>
  )
}
