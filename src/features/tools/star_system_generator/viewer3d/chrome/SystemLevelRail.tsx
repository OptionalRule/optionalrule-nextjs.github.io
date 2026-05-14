'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronRight, Sparkles, Sun, Telescope } from 'lucide-react'
import type { GeneratedSystem } from '../../types'
import type { HazardVisual, SystemLevelPhenomenon, SystemSceneGraph } from '../types'
import { REGISTER_COLORS } from '../scene/overlay/statusPalette'
import { useSelectionActions, useSelectionState } from './ViewerContext'

interface RailSection {
  key: string
  label: string
  color: string
  icon: typeof Sun
  entries: RailEntry[]
}

interface RailEntry {
  id: string
  title: string
  subtitle: string
  kind: 'hazard' | 'phenomenon' | 'ruin'
}

function hazardCategory(hazard: HazardVisual): 'stellar' | 'system-wide' {
  return hazard.anchorDescription === 'stellar' ? 'stellar' : 'system-wide'
}

function findUnanchoredRuin(system: GeneratedSystem, id: string): GeneratedSystem['ruins'][number] | undefined {
  return [
    ...system.ruins,
    ...system.companions.flatMap((c) => c.subSystem?.ruins ?? []),
  ].find((r) => r.id === id)
}

function gatherEntries(graph: SystemSceneGraph, system: GeneratedSystem): RailSection[] {
  const stellarHazards: HazardVisual[] = []
  const wideHazards: HazardVisual[] = []
  const allSystemLevelHazards = [
    ...graph.systemLevelHazards,
    ...graph.subSystems.flatMap((s) => s.systemLevelHazards),
  ]
  for (const hazard of allSystemLevelHazards) {
    if (hazardCategory(hazard) === 'stellar') stellarHazards.push(hazard)
    else wideHazards.push(hazard)
  }

  const allPhenomena: SystemLevelPhenomenon[] = [
    ...graph.systemLevelPhenomena,
    ...graph.subSystems.flatMap((s) => s.systemLevelPhenomena),
  ]

  const allUnanchoredRuinIds = [
    ...graph.systemLevelRuins,
    ...graph.subSystems.flatMap((s) => s.systemLevelRuins),
  ]

  const sections: RailSection[] = []

  if (stellarHazards.length > 0) {
    sections.push({
      key: 'stellar',
      label: 'Stellar hazards',
      color: REGISTER_COLORS.hazard,
      icon: Sun,
      entries: stellarHazards.map((h) => ({
        id: h.id,
        title: h.sourceText,
        subtitle: `intensity ${Math.round(h.intensity * 100)} / 100`,
        kind: 'hazard',
      })),
    })
  }

  if (wideHazards.length > 0) {
    sections.push({
      key: 'system-wide',
      label: 'System-wide hazards',
      color: REGISTER_COLORS.hazard,
      icon: AlertTriangle,
      entries: wideHazards.map((h) => ({
        id: h.id,
        title: h.sourceText,
        subtitle: h.unclassified ? 'unanchored' : h.anchorDescription || 'system-wide',
        kind: 'hazard',
      })),
    })
  }

  if (allPhenomena.length > 0) {
    sections.push({
      key: 'phenomena',
      label: 'System phenomena',
      color: REGISTER_COLORS.phenomenon,
      icon: Sparkles,
      entries: allPhenomena.map((p) => ({
        id: p.id,
        title: p.kind,
        subtitle: 'system phenomenon',
        kind: 'phenomenon',
      })),
    })
  }

  if (allUnanchoredRuinIds.length > 0) {
    const entries: RailEntry[] = []
    for (const id of allUnanchoredRuinIds) {
      const ruin = findUnanchoredRuin(system, id)
      if (!ruin) continue
      entries.push({
        id,
        title: ruin.remnantType.value,
        subtitle: ruin.location.value,
        kind: 'ruin',
      })
    }
    if (entries.length > 0) {
      sections.push({
        key: 'ruins',
        label: 'Unanchored ruins',
        color: REGISTER_COLORS.ruin,
        icon: Telescope,
        entries,
      })
    }
  }

  return sections
}

export interface SystemLevelRailProps {
  graph: SystemSceneGraph
  system: GeneratedSystem
}

export function SystemLevelRail({ graph, system }: SystemLevelRailProps) {
  const sections = gatherEntries(graph, system)
  const { select } = useSelectionActions()
  const { selection } = useSelectionState()
  const [collapsed, setCollapsed] = useState(false)

  if (sections.length === 0) return null

  const totalCount = sections.reduce((sum, s) => sum + s.entries.length, 0)

  return (
    <aside
      aria-label="System-level facts"
      data-testid="system-level-rail"
      className="pointer-events-none absolute right-2 top-2 z-10 flex max-h-[calc(100%-1rem)] w-[220px] flex-col"
    >
      <div className="pointer-events-auto flex flex-col rounded-md border border-[var(--border)] bg-[var(--card)]/95 shadow-lg shadow-black/30 backdrop-blur">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-controls="system-level-rail-body"
          className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:bg-[var(--card-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <span>System facts · {totalCount}</span>
          <ChevronRight
            className={`h-3 w-3 transition-transform ${collapsed ? '' : 'rotate-90'}`}
            aria-hidden="true"
          />
        </button>
        {collapsed ? null : (
          <ul
            id="system-level-rail-body"
            className="flex max-h-full flex-col gap-2 overflow-y-auto p-2"
          >
            {sections.map((section) => (
              <li key={section.key} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 px-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                  <section.icon className="h-2.5 w-2.5" aria-hidden="true" style={{ color: section.color }} />
                  <span>{section.label}</span>
                </div>
                <ul className="flex flex-col gap-1">
                  {section.entries.map((entry) => {
                    const active = selection?.kind === entry.kind && selection?.id === entry.id
                    return (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => select({ kind: entry.kind, id: entry.id })}
                          className={`flex w-full items-start gap-1.5 rounded border px-2 py-1 text-left text-[11px] leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                            active
                              ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--text-primary)]'
                              : 'border-transparent bg-[var(--card-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-light)] hover:text-[var(--text-primary)]'
                          }`}
                          title={`${entry.title} — ${entry.subtitle}`}
                        >
                          <span
                            className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: section.color }}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{entry.title}</span>
                            <span className="block truncate text-[10px] text-[var(--text-tertiary)]">{entry.subtitle}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
