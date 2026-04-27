'use client'

import { useMemo, useState } from 'react'
import { Orbit } from 'lucide-react'
import { BodyDetailPanel } from './components/BodyDetailPanel'
import { ConfidenceLegend } from './components/ConfidenceLegend'
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
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null)
  const selectedBody = useMemo(
    () => system.bodies.find((body) => body.id === selectedBodyId) ?? system.bodies[0],
    [selectedBodyId, system.bodies]
  )

  return (
    <div className={`min-h-screen bg-background text-foreground ${className || ''}`}>
      <header className="border-b border-[var(--border)] bg-[var(--background)] py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-light)] text-[var(--accent)]">
              <Orbit className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sci-Fi TTRPG Star System Generator</h1>
              <p className="text-sm text-[var(--text-tertiary)]">
                Seeded MASS-GU system profiles for Geometric Unity Era play.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-4 p-4">
        <section id="controls" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="space-y-4">
            <SeedControl options={options} onChange={setOptions} />
            <GeneratorControls options={options} onChange={setOptions} />
            <details className="text-xs text-[var(--text-tertiary)]">
              <summary className="cursor-pointer font-semibold text-[var(--text-secondary)]">Confidence labels</summary>
              <div className="mt-2">
                <ConfidenceLegend />
              </div>
            </details>
          </div>
        </section>

        <SystemSummaryStrip system={system} />
        <LocalNav />

        <div id="overview">
          <SystemOverview system={system} />
        </div>
        <div id="orbit">
          <OrbitalTable
            system={system}
            selectedBodyId={selectedBody?.id ?? ''}
            onSelectBody={setSelectedBodyId}
          />
        </div>
        <div id="body">
          {selectedBody && <BodyDetailPanel body={selectedBody} />}
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
    <section aria-label="System summary" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <dl className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
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

function LocalNav() {
  const links = [
    ['Overview', '#overview'],
    ['Orbit', '#orbit'],
    ['Body', '#body'],
    ['GU', '#gu'],
    ['Settlements', '#settlements'],
    ['Human Layer', '#human-layer'],
  ]

  return (
    <nav aria-label="Star system sections" className="sticky top-0 z-10 rounded-lg border border-[var(--border)] bg-[var(--background)]/95 p-2 backdrop-blur">
      <div className="flex flex-wrap gap-2">
        {links.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="rounded-md px-2.5 py-1 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--card-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}

export { StarSystemGenerator }
