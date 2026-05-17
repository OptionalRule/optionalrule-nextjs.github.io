'use client'

import { ScaleModeControl } from './ScaleModeControl'
import { REGISTER_COLORS, STATUS_HUMAN } from '../scene/overlay/statusPalette'

interface LegendChipSpec {
  color: string
  label: string
}

const CHIPS: LegendChipSpec[] = [
  { color: 'var(--accent)',           label: 'solid rings: body orbits' },
  { color: 'rgb(125 211 252 / 0.6)',  label: 'blue band: habitable zone' },
  { color: STATUS_HUMAN.active.color, label: 'settlement' },
  { color: STATUS_HUMAN.active.color, label: 'inhabited body' },
  { color: REGISTER_COLORS.gate,      label: 'gate' },
  { color: REGISTER_COLORS.ruin,      label: 'ruin' },
  { color: REGISTER_COLORS.hazard,    label: 'hazard (anchored)' },
  { color: REGISTER_COLORS.gu,        label: 'GU bleed' },
]

export interface DebrisChipFlags {
  ring: boolean
  shell: boolean
  stream: boolean
  halo: boolean
  cordon: boolean
}

const DEBRIS_CHIP_SPECS: Array<{ key: keyof DebrisChipFlags; color: string; label: string }> = [
  { key: 'ring',   color: '#a0b8d8', label: 'polar ring / disk' },
  { key: 'shell',  color: '#b89898', label: 'ejecta shell' },
  { key: 'stream', color: '#ffcc66', label: 'mass-transfer stream' },
  { key: 'halo',   color: '#b88888', label: 'scattered halo' },
  { key: 'cordon', color: '#d0606a', label: 'gardener cordon' },
]

export interface ViewerLegendProps {
  scaleNote: string
  onFrame: () => void
  hasDebris?: DebrisChipFlags
}

export function ViewerLegend({ scaleNote, onFrame, hasDebris }: ViewerLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <ul className="flex flex-wrap items-center gap-3" aria-label="Legend">
        {CHIPS.map((chip) => (
          <li key={chip.label} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: chip.color }}
              aria-hidden="true"
            />
            <span>{chip.label}</span>
          </li>
        ))}
        {hasDebris ? DEBRIS_CHIP_SPECS.filter((s) => hasDebris[s.key]).map((s) => (
          <li key={s.label} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            <span>{s.label}</span>
          </li>
        )) : null}
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
