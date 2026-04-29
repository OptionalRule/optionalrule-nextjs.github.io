import type { GeneratedSystem } from '../types'
import { formatStellarClass, stellarClassNote } from '../lib/stellarLabels'

export function SystemOverview({ system }: { system: GeneratedSystem }) {
  const stellarRadius = formatEstimatedStellarRadius(system)
  const rows = [
    ['Primary', formatStellarClass(system.primary.spectralType.value)],
    ['Mass', `${system.primary.massSolar.value} solar`],
    ['Luminosity', `${system.primary.luminositySolar.value} solar`],
    ...(stellarRadius ? [['Est. radius', stellarRadius]] : []),
    ['Age', system.primary.ageState.value],
    ['Activity', system.primary.activity.value],
    ['Multiplicity', system.companions.length ? system.companions[0].companionType.value : 'Single star'],
    ['Reachability', system.reachability.className.value],
    ['Architecture', system.architecture.name.value],
    ['GU', system.guOverlay.intensity.value],
  ]

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex flex-col gap-1">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{system.name.value}</h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            {system.dataBasis.value} · Seed <span className="font-mono">{system.seed}</span>
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--card-elevated)] p-2.5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</dt>
            <dd className="mt-1 text-[var(--text-primary)]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-[var(--border)] pt-3 text-sm text-[var(--text-secondary)]">
        <span>HZ inner: {system.zones.habitableInnerAu.value} AU</span>
        <span>HZ center: {system.zones.habitableCenterAu.value} AU</span>
        <span>HZ outer: {system.zones.habitableOuterAu.value} AU</span>
        <span>Snow line: {system.zones.snowLineAu.value} AU</span>
      </div>

      <p className="mt-3 text-sm text-[var(--text-tertiary)]">
        Stellar class note: {stellarClassNote(system.primary.spectralType.value)}
      </p>

      {system.companions.length ? (
        <div className="mt-4 border-t border-[var(--border)] pt-3 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Multiple-Star Context</h3>
          <p className="mt-1 font-medium text-[var(--text-primary)]">
            {system.companions[0].companionType.value} · {system.companions[0].separation.value}
          </p>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Planetary layout</dt>
              <dd className="mt-1 text-[var(--text-secondary)]">{system.companions[0].planetaryConsequence.value}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Route value</dt>
              <dd className="mt-1 text-[var(--text-secondary)]">{system.companions[0].guConsequence.value}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
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
