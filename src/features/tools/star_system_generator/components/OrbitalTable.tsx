import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { GeneratedSystem } from '../types'
import { BodyDetailContent } from './BodyDetailPanel'

interface OrbitalTableProps {
  system: GeneratedSystem
}

export function OrbitalTable({ system }: OrbitalTableProps) {
  const [expandedBodyIds, setExpandedBodyIds] = useState<Set<string>>(() => new Set())
  const allExpanded = system.bodies.length > 0 && system.bodies.every((body) => expandedBodyIds.has(body.id))

  function toggleBody(bodyId: string) {
    setExpandedBodyIds((current) => {
      const next = new Set(current)
      if (next.has(bodyId)) {
        next.delete(bodyId)
      } else {
        next.add(bodyId)
      }
      return next
    })
  }

  function expandAll() {
    setExpandedBodyIds(new Set(system.bodies.map((body) => body.id)))
  }

  function collapseAll() {
    setExpandedBodyIds(new Set())
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Orbital Profile</h2>
          <p className="text-xs text-[var(--text-tertiary)]">{system.bodies.length} generated bodies</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={expandAll}
            disabled={allExpanded}
            className="rounded-md border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            disabled={expandedBodyIds.size === 0}
            className="rounded-md border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Collapse all
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              <th className="py-2 pr-3">Orbit</th>
              <th className="py-2 pr-3">Body</th>
              <th className="py-2 pr-3">Class</th>
              <th className="py-2 pr-3">Zone</th>
              <th className="py-2 pr-3">Environment</th>
              <th className="py-2 pr-3">Moons/Sites</th>
            </tr>
          </thead>
          <tbody>
            {system.bodies.map((body) => (
              <Fragment key={body.id}>
                <tr className={`align-top ${expandedBodyIds.has(body.id) ? 'bg-[var(--accent-light)]/30' : 'border-b border-[var(--border)]'}`}>
                  <td className="py-3 pr-3 text-[var(--text-secondary)]">
                    <div className="font-mono">{body.orbitAu.value} AU</div>
                  </td>
                  <td className="py-3 pr-3 font-semibold text-[var(--text-primary)]">
                    <button
                      type="button"
                      onClick={() => toggleBody(body.id)}
                      aria-expanded={expandedBodyIds.has(body.id)}
                      aria-controls={`${body.id}-detail`}
                      className="inline-flex items-center gap-2 text-left underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      {expandedBodyIds.has(body.id) ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                      <span>{body.name.value}</span>
                    </button>
                  </td>
                  <td className="py-3 pr-3 text-[var(--text-secondary)]">
                    <div>{body.bodyClass.value}</div>
                    <div className="mt-0.5 text-xs text-[var(--text-tertiary)]">{body.massClass.value}</div>
                  </td>
                  <td className="py-3 pr-3 text-[var(--text-secondary)]">{body.thermalZone.value}</td>
                  <td className="max-w-[22rem] py-3 pr-3 text-[var(--text-secondary)]">
                    <span>{body.detail.atmosphere.value}</span>
                    <span className="text-[var(--text-tertiary)]"> / {body.detail.hydrosphere.value}</span>
                  </td>
                  <td className="py-3 pr-3 text-[var(--text-secondary)]">
                    {body.moons.length} moon{body.moons.length === 1 ? '' : 's'}
                    {body.sites.length ? `; ${body.sites.length} site${body.sites.length === 1 ? '' : 's'}` : ''}
                    {body.rings ? '; rings' : ''}
                  </td>
                </tr>
                {expandedBodyIds.has(body.id) ? (
                  <tr className="border-b border-[var(--border)]">
                    <td id={`${body.id}-detail`} colSpan={6} className="bg-[var(--card)] px-2 pb-3 pt-2 sm:px-3">
                      <BodyDetailContent body={body} system={system} compact />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
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
