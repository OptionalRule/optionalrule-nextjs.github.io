'use client'

import type { TorchCatalogEntry } from '../types'

export interface CatalogButtonProps {
  entry: TorchCatalogEntry
  onSelect: (entry: TorchCatalogEntry) => void
  disabled?: boolean
  selected?: boolean
  className?: string
}

const CATEGORY_LABELS: Record<TorchCatalogEntry['category'], string> = {
  mundane: 'Mundane',
  magical: 'Magical',
  environmental: 'Environmental',
}

export function CatalogButton({ entry, onSelect, disabled = false, selected = false, className }: CatalogButtonProps) {
  const handleClick = () => {
    if (!disabled) {
      onSelect(entry)
    }
  }

  return (
    <button
      type="button"
      className={`group flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]/90 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
        selected ? 'border-[var(--accent)] shadow-lg' : 'hover:border-[var(--accent)] hover:bg-[var(--surface-2)]'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className ?? ''}`.trim()}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-lg">
            {entry.icon || '🔥'}
          </span>
          <div>
            <p className="text-base font-semibold text-[var(--text-primary)]">{entry.name}</p>
            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              {CATEGORY_LABELS[entry.category] ?? entry.category}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--surface-3)] bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
          <span>{entry.baseDurationMinutes}m</span>
        </span>
      </div>
      <p className="text-sm leading-5 text-[var(--text-secondary)]">{entry.description}</p>
      {entry.mishapNote && (
        <p className="text-xs leading-4 text-[var(--text-tertiary)]">{entry.mishapNote}</p>
      )}
    </button>
  )
}
