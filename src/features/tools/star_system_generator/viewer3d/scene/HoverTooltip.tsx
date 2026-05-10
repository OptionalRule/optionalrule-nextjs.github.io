'use client'

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { GeneratedSystem } from '../../types'
import type { SystemSceneGraph } from '../types'
import { useSelectionState, type SelectionTarget } from '../chrome/ViewerContext'

interface TooltipPosition {
  position: [number, number, number]
  title: string
  subtitle: string
  withLeader?: boolean
}

function resolveTooltip(
  hovered: SelectionTarget | null,
  graph: SystemSceneGraph,
  system: GeneratedSystem,
  liveBodyPosition: [number, number, number] | null,
): TooltipPosition | null {
  if (!hovered) return null
  switch (hovered.kind) {
    case 'body': {
      const body = graph.bodies.find((b) => b.id === hovered.id)
      const source = system.bodies.find((b) => b.id === hovered.id)
      if (!body || !source) return null
      const position = liveBodyPosition ?? [body.orbitRadius * Math.cos(body.phase0), 0, body.orbitRadius * Math.sin(body.phase0)]
      return {
        position: [position[0], position[1] + body.visualSize * 1.05, position[2]],
        title: source.name.value,
        subtitle: `${source.category.value} · ${source.thermalZone.value}`,
        withLeader: true,
      }
    }
    case 'settlement': {
      const settlement = system.settlements.find((s) => s.id === hovered.id)
      if (!settlement) return null
      const parentBody = settlement.bodyId
        ? graph.bodies.find((b) => b.id === settlement.bodyId)
        : undefined
      const live = settlement.bodyId
        ? (window as Window & { __viewer3dBodyPositions?: Record<string, [number, number, number]> })
            .__viewer3dBodyPositions?.[settlement.bodyId]
        : undefined
      const base = live ?? (parentBody
        ? [parentBody.orbitRadius * Math.cos(parentBody.phase0), 0, parentBody.orbitRadius * Math.sin(parentBody.phase0)] as [number, number, number]
        : [0, 0, 0] as [number, number, number])
      const liftSize = parentBody ? parentBody.visualSize * 2.6 : 5
      return {
        position: [base[0], base[1] + liftSize, base[2]],
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
    case 'ruin': {
      const ruin = system.ruins.find((r) => r.id === hovered.id)
      const marker = graph.ruins.find((r) => r.id === hovered.id)
      if (!ruin || !marker) return null
      return {
        position: [marker.position[0], marker.position[1] + 1.4, marker.position[2]],
        title: ruin.remnantType.value,
        subtitle: ruin.location.value,
      }
    }
    default:
      return null
  }
}

export function HoverTooltip({ graph, system }: { graph: SystemSceneGraph; system: GeneratedSystem }) {
  const { hovered } = useSelectionState()
  const [liveBodyPosition, setLiveBodyPosition] = useState<[number, number, number] | null>(null)
  const lastUpdateRef = useRef(0)

  useFrame((state) => {
    if (hovered?.kind !== 'body') {
      if (liveBodyPosition) setLiveBodyPosition(null)
      return
    }
    if (state.clock.elapsedTime - lastUpdateRef.current < 0.08) return
    lastUpdateRef.current = state.clock.elapsedTime
    const dict = (window as Window & { __viewer3dBodyPositions?: Record<string, [number, number, number]> }).__viewer3dBodyPositions
    const position = dict?.[hovered.id]
    if (!position) return
    setLiveBodyPosition((prev) => {
      if (
        prev &&
        Math.abs(prev[0] - position[0]) < 0.02 &&
        Math.abs(prev[1] - position[1]) < 0.02 &&
        Math.abs(prev[2] - position[2]) < 0.02
      ) {
        return prev
      }
      return [position[0], position[1], position[2]]
    })
  })

  const tip = resolveTooltip(hovered, graph, system, liveBodyPosition)
  if (!tip) return null
  if (tip.withLeader) {
    const leaderDx = 28
    const leaderDy = 28
    return (
      <Html position={tip.position} distanceFactor={120} pointerEvents="none" zIndexRange={[100, 0]}>
        <div className="pointer-events-none" style={{ position: 'relative', width: 0, height: 0 }}>
          <svg
            width={leaderDx}
            height={leaderDy}
            style={{ position: 'absolute', left: 0, top: -leaderDy, overflow: 'visible' }}
          >
            <line
              x1={0}
              y1={leaderDy}
              x2={leaderDx}
              y2={0}
              stroke="rgba(160, 200, 240, 0.55)"
              strokeWidth={1}
            />
          </svg>
          <div
            className="whitespace-nowrap rounded-md border border-[var(--accent)]/50 bg-[#0f141c]/95 px-2 py-1 text-[11px] text-[var(--text-primary)] shadow-lg shadow-black/40"
            style={{ position: 'absolute', left: leaderDx, top: -leaderDy, transform: 'translateY(-100%)' }}
          >
            <div className="font-semibold">{tip.title}</div>
            <div className="text-[10px] text-[var(--text-tertiary)]">{tip.subtitle}</div>
          </div>
        </div>
      </Html>
    )
  }
  return (
    <Html position={tip.position} center distanceFactor={120} pointerEvents="none">
      <div className="pointer-events-none whitespace-nowrap rounded-md border border-[var(--accent)]/50 bg-[#0f141c]/95 px-2 py-1 text-[11px] text-[var(--text-primary)] shadow-lg shadow-black/40">
        <div className="font-semibold">{tip.title}</div>
        <div className="text-[10px] text-[var(--text-tertiary)]">{tip.subtitle}</div>
      </div>
    </Html>
  )
}
