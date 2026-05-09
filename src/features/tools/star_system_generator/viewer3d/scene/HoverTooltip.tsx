'use client'

import { Html } from '@react-three/drei'
import type { GeneratedSystem } from '../../types'
import type { SystemSceneGraph } from '../types'
import { useSelectionState, type SelectionTarget } from '../chrome/ViewerContext'

interface TooltipPosition {
  position: [number, number, number]
  title: string
  subtitle: string
}

function resolveTooltip(
  hovered: SelectionTarget | null,
  graph: SystemSceneGraph,
  system: GeneratedSystem,
): TooltipPosition | null {
  if (!hovered) return null
  switch (hovered.kind) {
    case 'body': {
      const body = graph.bodies.find((b) => b.id === hovered.id)
      const source = system.bodies.find((b) => b.id === hovered.id)
      if (!body || !source) return null
      return {
        position: [body.orbitRadius * Math.cos(body.phase0), body.visualSize * 1.8, body.orbitRadius * Math.sin(body.phase0)],
        title: source.name.value,
        subtitle: `${source.category.value} · ${source.thermalZone.value}`,
      }
    }
    case 'settlement': {
      const settlement = system.settlements.find((s) => s.id === hovered.id)
      if (!settlement) return null
      return {
        position: [0, 5, 0],
        title: settlement.name.value,
        subtitle: settlement.siteCategory.value,
      }
    }
    case 'hazard': {
      const hazard = graph.hazards.find((h) => h.id === hovered.id)
      if (!hazard) return null
      return {
        position: hazard.center,
        title: 'Hazard',
        subtitle: hazard.sourceText.slice(0, 48),
      }
    }
    case 'gu-bleed': {
      const bleed = graph.guBleeds.find((g) => g.id === hovered.id)
      if (!bleed) return null
      return {
        position: bleed.center,
        title: 'GU bleed',
        subtitle: system.guOverlay.intensity.value,
      }
    }
    case 'phenomenon': {
      const phen = system.phenomena.find((p) => p.id === hovered.id)
      if (!phen) return null
      const marker = graph.phenomena.find((p) => p.id === hovered.id)
      if (!marker) return null
      return { position: marker.position, title: phen.phenomenon.value, subtitle: 'system phenomenon' }
    }
    default:
      return null
  }
}

export function HoverTooltip({ graph, system }: { graph: SystemSceneGraph; system: GeneratedSystem }) {
  const { hovered } = useSelectionState()
  const tip = resolveTooltip(hovered, graph, system)
  if (!tip) return null
  return (
    <Html position={tip.position} center distanceFactor={120} pointerEvents="none">
      <div className="pointer-events-none whitespace-nowrap rounded-md border border-[var(--accent)]/30 bg-[#0f141c]/95 px-2 py-1 text-[11px] text-[var(--text-primary)] shadow-lg">
        <div className="font-semibold">{tip.title}</div>
        <div className="text-[10px] text-[var(--text-tertiary)]">{tip.subtitle}</div>
      </div>
    </Html>
  )
}
