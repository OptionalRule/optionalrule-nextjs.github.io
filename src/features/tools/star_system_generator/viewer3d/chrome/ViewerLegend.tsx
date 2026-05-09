'use client'

import { ScaleModeControl } from './ScaleModeControl'

interface LegendChipSpec {
  color: string
  label: string
}

const CHIPS: LegendChipSpec[] = [
  { color: 'bg-[var(--accent)]',          label: 'orbit / habitable / snow line' },
  { color: 'bg-[var(--accent-mystical)]', label: 'GU bleed' },
  { color: 'bg-[#ff5773]',                label: 'hazard zone' },
  { color: 'bg-[var(--accent-warm)]',     label: 'settlement' },
]

export interface ViewerLegendProps {
  scaleNote: string
  onFrame: () => void
}

export function ViewerLegend({ scaleNote, onFrame }: ViewerLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <ul className="flex flex-wrap items-center gap-3" aria-label="Legend">
        {CHIPS.map((chip) => (
          <li key={chip.label} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${chip.color}`} aria-hidden="true" />
            <span>{chip.label}</span>
          </li>
        ))}
      </ul>
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{scaleNote}</span>
      <ScaleModeControl />
      <button
        type="button"
        onClick={onFrame}
        className="ml-auto inline-flex items-center rounded border border-[var(--border)] bg-transparent px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] hover:bg-[var(--card-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        Frame system
      </button>
    </div>
  )
}
