'use client'

import type { LayerKey } from '../types'
import { useLayers } from './ViewerContext'

interface PillSpec {
  key: LayerKey
  label: string
  dotClass: string
  pressedClass: string
}

const PILLS: PillSpec[] = [
  { key: 'physical',   label: 'Physical',    dotClass: 'bg-[var(--accent)]',          pressedClass: 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]' },
  { key: 'gu',         label: 'GU',          dotClass: 'bg-[var(--accent-mystical)]', pressedClass: 'border-[var(--accent-mystical)] bg-[var(--accent-mystical-light)] text-[var(--accent-mystical)]' },
  { key: 'human',      label: 'Human',       dotClass: 'bg-[var(--accent-warm)]',     pressedClass: 'border-[var(--accent-warm)] bg-[var(--accent-warm-light)] text-[var(--accent-warm)]' },
  { key: 'moonOrbits', label: 'Moon Orbits', dotClass: 'bg-cyan-200/80',              pressedClass: 'border-cyan-300/70 bg-cyan-300/10 text-cyan-200' },
]

export function LayerToggles() {
  const { layers, toggleLayer } = useLayers()
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Layer visibility">
      {PILLS.map((p) => {
        const pressed = layers[p.key]
        return (
          <button
            key={p.key}
            type="button"
            aria-pressed={pressed}
            onClick={() => toggleLayer(p.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              pressed ? p.pressedClass : 'border-[var(--border)] bg-transparent text-[var(--text-tertiary)]'
            }`}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${p.dotClass}`} aria-hidden="true" />
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
