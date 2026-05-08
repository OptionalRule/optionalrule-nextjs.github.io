'use client'

import { Building2, Orbit } from 'lucide-react'
import { ExportPanel } from './components/ExportPanel'
import { GeneratorControls } from './components/GeneratorControls'
import { GuOverlayPanel } from './components/GuOverlayPanel'
import { OrbitalTable } from './components/OrbitalTable'
import { HumanRemnantsPanel, SystemPhenomenaPanel } from './components/PlayableLayerPanel'
import { SeedControl } from './components/SeedControl'
import { SettlementCard } from './components/SettlementCard'
import { StoriesAtPortPanel } from './components/StoriesAtPortPanel'
import { SystemOverview } from './components/SystemOverview'
import { SectionHeader, SpectralChip, sectionShellClasses } from './components/visual'
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
      <header className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--background)] py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 50%, var(--accent) 0, transparent 38%), radial-gradient(circle at 82% 60%, var(--accent-mystical) 0, transparent 42%)',
          }}
        />
        <div className="container relative mx-auto px-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/20"
              aria-hidden="true"
            >
              <Orbit className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                Sci-Fi TTRPG Star System Generator
              </h1>
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

        <section id="settlements" className={sectionShellClasses('human')}>
          <SectionHeader
            layer="human"
            icon={Building2}
            title="Sites & Settlements"
            caption="Generated human stations, bases, colonies, outposts, and automated sites selected by presence score."
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {system.settlements.length ? (
              system.settlements.map((settlement) => (
                <SettlementCard key={settlement.id} settlement={settlement} />
              ))
            ) : (
              <article className="rounded-md border border-dashed border-[var(--border)] bg-[var(--card-elevated)] p-4 text-sm italic text-[var(--text-tertiary)]">
                No permanent settlement generated for this seed.
              </article>
            )}
          </div>
        </section>

        <div className="grid items-stretch gap-4 xl:grid-cols-3">
          <div id="human-remnants" className="h-full">
            <HumanRemnantsPanel system={system} />
          </div>
          <div id="gu" className="h-full">
            <GuOverlayPanel system={system} compact />
          </div>
          <div id="system-phenomena" className="h-full">
            <SystemPhenomenaPanel system={system} />
          </div>
        </div>

        <StoriesAtPortPanel system={system} />

        <ExportPanel system={system} />
      </main>
    </div>
  )
}

type SummaryLayer = 'physical' | 'gu' | 'human'

interface SummaryItem {
  label: string
  value: string
  layer: SummaryLayer
  spectralType?: string
}

function SystemSummaryStrip({ system }: { system: GeneratedSystem }) {
  const items: SummaryItem[] = [
    {
      label: 'Star',
      value: formatStellarClass(system.primary.spectralType.value),
      layer: 'physical',
      spectralType: system.primary.spectralType.value,
    },
    { label: 'Architecture', value: system.architecture.name.value, layer: 'physical' },
    { label: 'Reachability', value: system.reachability.className.value, layer: 'physical' },
    { label: 'Bodies', value: String(system.bodies.length), layer: 'physical' },
    { label: 'Settlements', value: String(system.settlements.length), layer: 'human' },
    { label: 'GU', value: system.guOverlay.intensity.value, layer: 'gu' },
  ]

  const layerDot: Record<SummaryLayer, string> = {
    physical: 'bg-[var(--accent)]',
    gu: 'bg-[var(--accent-mystical)]',
    human: 'bg-[var(--accent-warm)]',
  }

  return (
    <section
      aria-label="System summary"
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
    >
      <dl className="grid gap-x-5 gap-y-2 sm:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${layerDot[item.layer]}`} aria-hidden="true" />
              {item.label}
            </dt>
            <dd
              className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]"
              title={item.value}
            >
              {item.spectralType ? (
                <SpectralChip spectralType={item.spectralType} label={item.value} />
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export { StarSystemGenerator }
