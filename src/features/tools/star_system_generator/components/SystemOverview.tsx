import type { GeneratedSystem } from '../types'
import { ConfidenceBadge } from './ConfidenceBadge'

export function SystemOverview({ system }: { system: GeneratedSystem }) {
  const rows = [
    ['Primary', system.primary.spectralType.value],
    ['Mass', `${system.primary.massSolar.value} solar`],
    ['Luminosity', `${system.primary.luminositySolar.value} solar`],
    ['Age', system.primary.ageState.value],
    ['Activity', system.primary.activity.value],
    ['Reachability', system.reachability.className.value],
    ['Architecture', system.architecture.name.value],
    ['GU', system.guOverlay.intensity.value],
  ]

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{system.name.value}</h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            {system.dataBasis.value} · Seed <span className="font-mono">{system.seed}</span>
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2 sm:mt-0">
          <ConfidenceBadge confidence={system.name.confidence} />
          <span className="text-xs text-[var(--text-tertiary)]">{system.noAlienCheck.note}</span>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md border border-[var(--border)] bg-[var(--card-elevated)] p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</dt>
            <dd className="mt-1 text-sm text-[var(--text-primary)]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-2 lg:grid-cols-4">
        <div>HZ inner: {system.zones.habitableInnerAu.value} AU</div>
        <div>HZ center: {system.zones.habitableCenterAu.value} AU</div>
        <div>HZ outer: {system.zones.habitableOuterAu.value} AU</div>
        <div>Snow line: {system.zones.snowLineAu.value} AU</div>
      </div>
    </section>
  )
}
