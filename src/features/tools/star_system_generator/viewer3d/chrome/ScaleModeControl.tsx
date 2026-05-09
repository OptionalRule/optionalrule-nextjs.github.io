'use client'

import type { OrbitScaleMode } from '../types'
import { useScaleMode } from './ViewerContext'

interface ScaleModeSpec {
  key: OrbitScaleMode
  label: string
}

const SCALE_MODES: ScaleModeSpec[] = [
  { key: 'readable-log', label: 'Readable' },
  { key: 'relative-au', label: 'Relative AU' },
  { key: 'schematic', label: 'Schematic' },
]

export function ScaleModeControl() {
  const { scaleMode, setScaleMode } = useScaleMode()
  return (
    <div className="inline-flex rounded border border-[var(--border)] bg-transparent p-0.5" role="group" aria-label="Orbit scale mode">
      {SCALE_MODES.map((mode) => {
        const active = scaleMode === mode.key
        return (
          <button
            key={mode.key}
            type="button"
            aria-pressed={active}
            onClick={() => setScaleMode(mode.key)}
            className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              active
                ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                : 'text-[var(--text-tertiary)] hover:bg-[var(--card-elevated)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
