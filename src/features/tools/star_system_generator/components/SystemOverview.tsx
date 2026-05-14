import { Sun, Telescope, Thermometer } from 'lucide-react'
import type { GeneratedSystem } from '../types'
import { formatStellarClass, stellarClassNote } from '../lib/stellarLabels'
import { buildSeedHref } from '../lib/seedUrl'
import { FieldRow, SectionHeader, SpectralChip, sectionShellClasses } from './visual'

function extractParentSeed(seed: string): string | undefined {
  const match = seed.match(/^(.*):c\d+$/)
  return match ? match[1] : undefined
}

export function SystemOverview({ system }: { system: GeneratedSystem }) {
  const stellarRadius = formatEstimatedStellarRadius(system)
  const spectralValue = system.primary.spectralType.value

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: 'Primary', value: <SpectralChip spectralType={spectralValue} label={formatStellarClass(spectralValue)} /> },
    { label: 'Mass', value: `${system.primary.massSolar.value} solar` },
    { label: 'Luminosity', value: `${system.primary.luminositySolar.value} solar` },
    ...(stellarRadius ? [{ label: 'Est. radius', value: stellarRadius }] : []),
    { label: 'Age', value: system.primary.ageState.value },
    { label: 'Activity', value: system.primary.activity.value },
    {
      label: 'Multiplicity',
      value: system.companions.length === 0
        ? 'Single star'
        : system.companions.length === 1
          ? `${system.companions[0].companionType.value}`
          : `${system.companions[0].companionType.value} (${system.companions.length} companions)`,
    },
    { label: 'Reachability', value: system.reachability.className.value },
    { label: 'Architecture', value: system.architecture.name.value },
    { label: 'GU', value: system.guOverlay.intensity.value },
  ]

  return (
    <section className={sectionShellClasses('physical')}>
      <SectionHeader
        layer="physical"
        icon={Sun}
        title={system.name.value}
        caption={
          <>
            {system.dataBasis.value} <span className="text-[var(--text-tertiary)]">·</span> Seed{' '}
            <span className="font-mono text-[var(--text-secondary)]">{system.seed}</span>
          </>
        }
      />

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <FieldRow key={row.label} label={row.label} layer="physical">
            {row.value}
          </FieldRow>
        ))}
      </dl>

      <div className="mt-4 rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3">
        <h3 className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          <Thermometer aria-hidden="true" className="h-3.5 w-3.5 text-[var(--accent)]" />
          Stellar Zones
        </h3>
        <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <ZoneStat label="HZ inner" value={`${system.zones.habitableInnerAu.value} AU`} accent="emerald" />
          <ZoneStat label="HZ center" value={`${system.zones.habitableCenterAu.value} AU`} accent="emerald" emphasized />
          <ZoneStat label="HZ outer" value={`${system.zones.habitableOuterAu.value} AU`} accent="emerald" />
          <ZoneStat label="Snow line" value={`${system.zones.snowLineAu.value} AU`} accent="sky" />
        </dl>
      </div>

      <p className="mt-3 flex gap-2 text-sm text-[var(--text-secondary)]">
        <Telescope aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
        <span>
          <span className="font-semibold text-[var(--text-primary)]">Stellar class note:</span>{' '}
          {stellarClassNote(spectralValue)}
        </span>
      </p>

      {(() => {
        const parent = extractParentSeed(system.seed)
        if (!parent) return null
        const url = buildSeedHref(parent)
        return (
          <div className="mt-4 rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
            <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Parent System
            </h3>
            <p className="mt-1 text-[var(--text-secondary)]">
              This system is the linked companion of <span className="font-mono text-[var(--text-primary)]">{parent}</span>.
            </p>
            <a className="mt-2 inline-block text-[var(--accent)] underline" href={url}>← Return to parent system</a>
          </div>
        )
      })()}

      {system.companions.length ? (
        <div className="mt-4 space-y-2">
          {system.companions.map((c) => (
            <CompanionCard key={c.id} companion={c} />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function CompanionCard({ companion }: { companion: GeneratedSystem['companions'][number] }) {
  const shared = (
    <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
      {companion.companionType.value}{' '}
      <span className="font-normal text-[var(--text-tertiary)]">· {companion.separation.value}</span>
    </p>
  )

  const consequences = (
    <dl className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
      <div>
        <dt className="text-[var(--text-tertiary)] uppercase tracking-wider">Planetary layout</dt>
        <dd className="mt-0.5 text-[var(--text-primary)]">{companion.planetaryConsequence.value}</dd>
      </div>
      <div>
        <dt className="text-[var(--text-tertiary)] uppercase tracking-wider">Route value</dt>
        <dd className="mt-0.5 text-[var(--text-primary)]">{companion.guConsequence.value}</dd>
      </div>
    </dl>
  )

  if (companion.mode === 'linked-independent') {
    const url = buildSeedHref(companion.linkedSeed!.value)
    return (
      <div className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
        <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Linked Companion System
        </h3>
        {shared}
        {consequences}
        <p className="mt-2 text-[var(--text-secondary)]">Generated independently. This system gains +1 reachable system.</p>
        <a className="mt-2 inline-block text-[var(--accent)] underline" href={url}>Open linked system →</a>
      </div>
    )
  }

  if (companion.mode === 'orbital-sibling') {
    const bodies = companion.subSystem?.bodies ?? []
    return (
      <div className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
        <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Orbital Sibling Companion
        </h3>
        {shared}
        {consequences}
        <p className="mt-2 text-[var(--text-secondary)]">
          Hosts {bodies.length} {bodies.length === 1 ? 'body' : 'bodies'}. Generated below.
        </p>
      </div>
    )
  }

  if (companion.mode === 'circumbinary') {
    return (
      <div className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
        <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Circumbinary Companion
        </h3>
        {shared}
        {consequences}
        <p className="mt-2 text-[var(--text-secondary)]">
          Bodies in this system orbit the binary&apos;s barycenter. Inner habitable edge sits beyond the keep-out zone.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
      <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        Contact / Volatile Companion
      </h3>
      {shared}
      {consequences}
      <p className="mt-2 text-[var(--text-secondary)]">
        Stars are contact-touching. No planets formed; hazardous debris and intense GU bleed dominate the inner system.
      </p>
    </div>
  )
}

function ZoneStat({
  label,
  value,
  accent,
  emphasized,
}: {
  label: string
  value: string
  accent: 'emerald' | 'sky'
  emphasized?: boolean
}) {
  const dot = accent === 'emerald' ? 'bg-emerald-500' : 'bg-sky-500'
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        {label}
      </dt>
      <dd className={`mt-0.5 font-mono ${emphasized ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
        {value}
      </dd>
    </div>
  )
}

function formatEstimatedStellarRadius(system: GeneratedSystem): string | undefined {
  const radiusSolar = estimateStellarRadiusSolar(system)
  if (!radiusSolar) return undefined
  const radiusAu = radiusSolar * 0.00465047
  return `${formatCompactNumber(radiusSolar)} solar radii (${formatCompactNumber(radiusAu)} AU)`
}

function estimateStellarRadiusSolar(system: GeneratedSystem): number | undefined {
  const type = system.primary.spectralType.value
  const mass = system.primary.massSolar.value
  const luminosity = system.primary.luminositySolar.value
  if (type === 'White dwarf/remnant') return 0.012
  if (type === 'Brown dwarf/substellar primary') return 0.1
  if (type === 'Gate-selected anomaly') return undefined
  if (type === 'O/B/A bright star' && luminosity > 0) {
    const temperatureRatio = 12000 / 5772
    return Math.sqrt(luminosity) / temperatureRatio ** 2
  }
  if (mass > 0) return mass ** 0.8
  return undefined
}

function formatCompactNumber(value: number): string {
  if (value >= 10) return value.toFixed(1)
  if (value >= 1) return value.toFixed(2)
  if (value >= 0.01) return value.toFixed(3)
  return value.toFixed(4)
}
