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
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="space-y-4">
            <SeedControl options={options} onChange={setOptions} />
            <GeneratorControls options={options} onChange={setOptions} />
            <ConfidenceLegend />
          </div>
        </section>

        <SystemOverview system={system} />
        <OrbitalTable
          system={system}
          selectedBodyId={selectedBody?.id ?? ''}
          onSelectBody={setSelectedBodyId}
        />
        {selectedBody && <BodyDetailPanel body={selectedBody} />}

        <GuOverlayPanel system={system} />

        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
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

        <PlayableLayerPanel system={system} />
      </main>
    </div>
  )
}

export { StarSystemGenerator }
