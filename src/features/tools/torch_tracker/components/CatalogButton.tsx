'use client'

import type { TorchCatalogEntry } from '../types'

export interface CatalogButtonProps {
  entry: TorchCatalogEntry
  onSelect: (entry: TorchCatalogEntry) => void
  disabled?: boolean
  selected?: boolean
  className?: string
}

function buildTooltip(entry: TorchCatalogEntry) {
  const segments: string[] = []
  segments.push(`${entry.baseDurationMinutes} minute duration`)
  if (entry.description) {
    segments.push(entry.description)
  }
  if (entry.mishapNote) {
    segments.push(`Note: ${entry.mishapNote}`)
  }
  return segments.join('\n')
}

export function CatalogButton({ entry, onSelect, disabled = false, selected = false, className }: CatalogButtonProps) {
  const handleClick = () => {
    if (!disabled) {
      onSelect(entry)
    }
  }

  const tooltip = buildTooltip(entry)
  const iconLabel = entry.icon || '🔥'

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface-1)_92%,transparent)] px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
        selected ? 'border-[var(--accent)] text-[var(--accent)] shadow-sm' : 'hover:border-[var(--accent)]'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className ?? ''}`.trim()}
      aria-pressed={selected}
      aria-disabled={disabled}
      aria-label={`Add ${entry.name}`}
      title={tooltip}
      onClick={handleClick}
    >
      <span aria-hidden="true" className="text-base">
        {iconLabel}
      </span>
      <span>{entry.name}</span>
    </button>
  )
}
