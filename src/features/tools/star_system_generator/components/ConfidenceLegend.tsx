import type { Confidence } from '../types'
import { ConfidenceBadge } from './ConfidenceBadge'

const items: Array<[Confidence, string]> = [
  ['confirmed', 'Confirmed'],
  ['derived', 'Derived'],
  ['inferred', 'Inferred'],
  ['gu-layer', 'Geometric Unity'],
  ['human-layer', 'Human layer'],
]

export function ConfidenceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[var(--text-tertiary)]">
      {items.map(([confidence, label]) => (
        <span key={confidence} className="inline-flex items-center gap-1.5">
          <ConfidenceBadge confidence={confidence} />
          {label}
        </span>
      ))}
    </div>
  )
}
