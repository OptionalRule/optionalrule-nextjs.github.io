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

  const baseClasses =
    'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface-1)_92%,transparent)] text-base font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] md:h-auto md:w-auto md:justify-start md:gap-2 md:px-3 md:py-1.5 md:text-sm'
  const stateClasses = selected
    ? 'border-[var(--accent)] text-[var(--accent)] shadow-sm'
    : 'hover:border-[var(--accent)]'
  const disabledClasses = disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'

  return (
    <button
      type="button"
      className={[baseClasses, stateClasses, disabledClasses, className ?? ''].filter(Boolean).join(' ')}
      aria-pressed={selected}
      aria-disabled={disabled}
      aria-label={`Add ${entry.name}`}
      title={tooltip}
      onClick={handleClick}
    >
      <span aria-hidden="true" className="text-lg md:text-base">
        {iconLabel}
      </span>
      <span className="hidden md:inline">{entry.name}</span>
    </button>
  )
}
