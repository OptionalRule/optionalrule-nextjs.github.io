import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, Orbit } from 'lucide-react'
import type { GeneratedSystem } from '../types'
import { BodyDetailContent } from './BodyDetailPanel'
import { BodyCategoryIcon, SectionHeader, ThermalZoneTag, sectionShellClasses } from './visual'

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
    <section className={sectionShellClasses('physical')}>
      <SectionHeader
        layer="physical"
        icon={Orbit}
        title="Orbital Profile"
        caption={`${system.bodies.length} generated bodies`}
        actions={
          <>
            <button
              type="button"
              onClick={expandAll}
              disabled={allExpanded}
              className="rounded-md border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              disabled={expandedBodyIds.size === 0}
              className="rounded-md border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Collapse all
            </button>
          </>
        }
      />

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-strong)] text-[0.68rem] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              <th className="py-2 pr-3 font-semibold">Orbit</th>
              <th className="py-2 pr-3 font-semibold">Body</th>
              <th className="py-2 pr-3 font-semibold">Class</th>
              <th className="py-2 pr-3 font-semibold">Zone</th>
              <th className="py-2 pr-3 font-semibold">Environment</th>
              <th className="py-2 pr-3 font-semibold">Moons / Sites</th>
            </tr>
          </thead>
          <tbody>
            {system.bodies.map((body) => {
              const isExpanded = expandedBodyIds.has(body.id)
              return (
                <Fragment key={body.id}>
                  <tr
                    className={`align-top transition-colors ${
                      isExpanded
                        ? 'bg-[var(--accent-light)]/40'
                        : 'border-b border-[var(--border-light)] hover:bg-[var(--surface-hover)]/40'
                    }`}
                  >
                    <td className="py-3 pr-3">
                      <div className="font-mono text-[var(--text-secondary)]">{body.orbitAu.value}</div>
                      <div className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">AU</div>
                    </td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={() => toggleBody(body.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`${body.id}-detail`}
                        className="group inline-flex items-center gap-2 text-left underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--accent)]" />
                        )}
                        <BodyCategoryIcon category={body.category.value} className="h-4 w-4 shrink-0" />
                        <span className="text-base font-semibold text-[var(--text-primary)]">{body.name.value}</span>
                      </button>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-[var(--text-primary)]">{body.bodyClass.value}</div>
                      <div className="mt-0.5 text-xs text-[var(--text-tertiary)]">{body.massClass.value}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <ThermalZoneTag zone={body.thermalZone.value} />
                    </td>
                    <td className="max-w-[22rem] py-3 pr-3 text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--text-primary)]">{body.detail.atmosphere.value}</span>
                      <span className="text-[var(--text-tertiary)]"> / {body.detail.hydrosphere.value}</span>
                    </td>
                    <td className="py-3 pr-3 text-[var(--text-secondary)]">
                      <SatelliteSummary
                        moons={body.moons.length}
                        sites={body.sites.length}
                        rings={Boolean(body.rings)}
                      />
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className="border-b border-[var(--border)]">
                      <td id={`${body.id}-detail`} colSpan={6} className="bg-[var(--card)] px-2 pb-3 pt-2 sm:px-3">
                        <BodyDetailContent body={body} system={system} compact />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SatelliteSummary({ moons, sites, rings }: { moons: number; sites: number; rings: boolean }) {
  const parts: Array<{ label: string; emphasized: boolean }> = []
  if (moons > 0) parts.push({ label: `${moons} moon${moons === 1 ? '' : 's'}`, emphasized: true })
  if (sites > 0) parts.push({ label: `${sites} site${sites === 1 ? '' : 's'}`, emphasized: true })
  if (rings) parts.push({ label: 'rings', emphasized: false })
  if (parts.length === 0) return <span className="text-[var(--text-tertiary)]">—</span>
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {parts.map((part, index) => (
        <Fragment key={part.label}>
          {index > 0 ? <span className="text-[var(--text-tertiary)]">·</span> : null}
          <span className={part.emphasized ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
            {part.label}
          </span>
        </Fragment>
      ))}
    </span>
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
