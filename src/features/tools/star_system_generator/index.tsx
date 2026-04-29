'use client'

import { Orbit } from 'lucide-react'
import { GeneratorControls } from './components/GeneratorControls'
import { GuOverlayPanel } from './components/GuOverlayPanel'
import { OrbitalTable } from './components/OrbitalTable'
import { PlayableLayerPanel } from './components/PlayableLayerPanel'
import { SeedControl } from './components/SeedControl'
import { SettlementCard } from './components/SettlementCard'
import { SystemOverview } from './components/SystemOverview'
import { useGeneratedSystem } from './hooks/useGeneratedSystem'
import { useGeneratorQueryState } from './hooks/useGeneratorQueryState'
import { formatStellarClass } from './lib/stellarLabels'
import type { GeneratedSystem } from './types'

export interface StarSystemGeneratorProps {
  className?: string
}

export default function StarSystemGenerator({ className }: StarSystemGeneratorProps) {
  const [options, setOptions] = useGeneratorQueryState()
  const system = useGeneratedSystem(options)

  return (
    <div className={`min-h-screen bg-background text-foreground ${className || ''}`}>
      <header className="border-b border-[var(--border)] bg-[var(--background)] py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--accent-light)] text-[var(--accent)]">
              <Orbit className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Sci-Fi TTRPG Star System Generator</h1>
              <p className="text-sm text-[var(--text-tertiary)]">
                Seeded MASS-GU system profiles for Geometric Unity Era play.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-3 p-4">
        <section id="controls" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="space-y-4">
            <SeedControl options={options} onChange={setOptions} />
            <GeneratorControls options={options} onChange={setOptions} />
          </div>
        </section>

        <SystemSummaryStrip system={system} />

        <div id="overview">
          <SystemOverview system={system} />
        </div>
        <div id="orbit">
          <OrbitalTable system={system} />
        </div>

        <div id="gu">
          <GuOverlayPanel system={system} />
        </div>

        <section id="settlements" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sites & Settlements</h2>
            <p className="text-sm text-[var(--text-tertiary)]">
              Generated human stations, bases, colonies, outposts, and automated sites selected by presence score.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {system.settlements.length ? (
              system.settlements.map((settlement) => (
                <SettlementCard key={settlement.id} settlement={settlement} />
              ))
            ) : (
              <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-secondary)]">
                No permanent settlement generated for this seed.
              </article>
            )}
          </div>
        </section>

        <div id="human-layer">
          <PlayableLayerPanel system={system} />
        </div>
      </main>
    </div>
  )
}

function SystemSummaryStrip({ system }: { system: GeneratedSystem }) {
  const items = [
    ['Star', formatStellarClass(system.primary.spectralType.value)],
    ['Architecture', system.architecture.name.value],
    ['Reachability', system.reachability.className.value],
    ['Bodies', String(system.bodies.length)],
    ['Settlements', String(system.settlements.length)],
    ['GU', system.guOverlay.intensity.value],
  ]

  return (
    <section aria-label="System summary" className="border-y border-[var(--border)] bg-[var(--card)] px-3 py-2">
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-3 xl:grid-cols-6">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</dt>
            <dd className="truncate text-sm font-medium text-[var(--text-primary)]" title={value}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export { StarSystemGenerator }
