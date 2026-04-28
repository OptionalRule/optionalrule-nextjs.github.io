import type { GeneratedSystem } from '../types'
import { ConfidenceBadge } from './ConfidenceBadge'

interface OrbitalTableProps {
  system: GeneratedSystem
  selectedBodyId: string
  onSelectBody: (bodyId: string) => void
}

export function OrbitalTable({ system, selectedBodyId, onSelectBody }: OrbitalTableProps) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Orbital Profile</h2>
        <span className="text-xs text-[var(--text-tertiary)]">{system.bodies.length} generated bodies</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              <th className="py-2 pr-3">Orbit</th>
              <th className="py-2 pr-3">Body</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Mass Class</th>
              <th className="py-2 pr-3">Thermal Zone</th>
              <th className="py-2 pr-3">Environment</th>
              <th className="py-2 pr-3">Interest</th>
              <th className="py-2 pr-3">Moons/Sites</th>
            </tr>
          </thead>
          <tbody>
            {system.bodies.map((body) => (
              <tr
                key={body.id}
                className={`border-b border-[var(--border)] align-top last:border-0 ${
                  body.id === selectedBodyId ? 'bg-[var(--accent-light)]/40' : ''
                }`}
              >
                <td className="py-3 pr-3 text-[var(--text-secondary)]">
                  <div className="font-mono">{body.orbitAu.value} AU</div>
                </td>
                <td className="py-3 pr-3 font-semibold text-[var(--text-primary)]">
                  <button
                    type="button"
                    onClick={() => onSelectBody(body.id)}
                    className="inline-flex items-center gap-2 text-left underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    {body.name.value}
                    <ConfidenceBadge confidence={body.name.confidence} />
                  </button>
                </td>
                <td className="py-3 pr-3 text-[var(--text-secondary)]">{body.bodyClass.value}</td>
                <td className="py-3 pr-3 text-[var(--text-secondary)]">{body.massClass.value}</td>
                <td className="py-3 pr-3 text-[var(--text-secondary)]">{body.thermalZone.value}</td>
                <td className="py-3 pr-3 text-[var(--text-secondary)]">
                  {body.detail.atmosphere.value}; {body.detail.hydrosphere.value}
                </td>
                <td className="max-w-[24rem] py-3 pr-3 text-[var(--text-secondary)]">{body.whyInteresting.value}</td>
                <td className="py-3 pr-3 text-[var(--text-secondary)]">
                  {body.moons.length} moon{body.moons.length === 1 ? '' : 's'}
                  {body.sites.length ? `; ${body.sites.length} site${body.sites.length === 1 ? '' : 's'}` : ''}
                  {body.rings ? '; rings' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function formatOrbitContext(orbitAu: number, system: GeneratedSystem): string {
  const hzCenter = system.zones.habitableCenterAu.value
  const snowLine = system.zones.snowLineAu.value
  if (snowLine > 0 && orbitAu >= snowLine * 0.7) return `${formatRatio(orbitAu / snowLine)}x snow line`
  if (hzCenter > 0) return `${formatRatio(orbitAu / hzCenter)}x HZ center`
  return 'no stellar zone scale'
}

function formatRatio(value: number): string {
  if (value >= 10) return value.toFixed(0)
  if (value >= 1) return value.toFixed(1)
  return value.toFixed(2)
}
