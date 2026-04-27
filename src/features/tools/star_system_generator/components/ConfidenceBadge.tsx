import type { Confidence } from '../types'

const labels: Record<Confidence, string> = {
  confirmed: 'C',
  derived: 'D',
  inferred: 'I',
  'gu-layer': 'G',
  'human-layer': 'H',
}

const titles: Record<Confidence, string> = {
  confirmed: 'Confirmed',
  derived: 'Derived',
  inferred: 'Inferred',
  'gu-layer': 'Geometric Unity layer',
  'human-layer': 'Human layer',
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-[var(--border)] bg-[var(--card-elevated)] px-1 text-[10px] font-semibold text-[var(--text-tertiary)]"
      title={titles[confidence]}
      aria-label={titles[confidence]}
    >
      {labels[confidence]}
    </span>
  )
}
