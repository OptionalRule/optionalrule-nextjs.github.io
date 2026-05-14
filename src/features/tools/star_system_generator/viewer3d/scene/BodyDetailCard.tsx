'use client'

import { useEffect, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { X } from 'lucide-react'
import type { GeneratedSystem, OrbitingBody } from '../../types'
import type { SystemSceneGraph, SceneVec3 } from '../types'
import { useSelectionActions, useSelectionState } from '../chrome/ViewerContext'

interface ResolvedSelection {
  body: OrbitingBody
  bodyId: string
}

function resolveSelection(
  graph: SystemSceneGraph,
  system: GeneratedSystem,
  selection: ReturnType<typeof useSelectionState>['selection'],
): ResolvedSelection | null {
  if (!selection) return null
  const subBodies = system.companions.flatMap((c) => c.subSystem?.bodies ?? [])
  const all = [...system.bodies, ...subBodies]
  if (selection.kind === 'body') {
    const body = all.find((b) => b.id === selection.id)
    return body ? { body, bodyId: body.id } : null
  }
  if (selection.kind === 'moon') {
    const parent = all.find((b) => b.moons.some((m) => m.id === selection.id))
    return parent ? { body: parent, bodyId: parent.id } : null
  }
  return null
}

function fallbackOrbitPosition(graph: SystemSceneGraph, bodyId: string): SceneVec3 | null {
  const visual = graph.bodies.find((b) => b.id === bodyId)
    ?? graph.subSystems.flatMap((s) => s.bodies).find((b) => b.id === bodyId)
  if (!visual) return null
  return [
    visual.orbitRadius * Math.cos(visual.phase0),
    0,
    -visual.orbitRadius * Math.sin(visual.phase0),
  ]
}

export interface BodyDetailCardProps {
  graph: SystemSceneGraph
  system: GeneratedSystem
}

export function BodyDetailCard({ graph, system }: BodyDetailCardProps) {
  const { selection } = useSelectionState()
  const { select } = useSelectionActions()
  const [livePosition, setLivePosition] = useState<SceneVec3 | null>(null)

  const resolved = resolveSelection(graph, system, selection)
  const bodyId = resolved?.bodyId ?? null

  useEffect(() => {
    if (!bodyId) {
      setLivePosition(null)
      return
    }
    setLivePosition(fallbackOrbitPosition(graph, bodyId))
  }, [bodyId, graph])

  useFrame(() => {
    if (!bodyId) return
    const dict = (window as Window & { __viewer3dBodyPositions?: Record<string, SceneVec3> }).__viewer3dBodyPositions
    const live = dict?.[bodyId]
    if (!live) return
    setLivePosition((prev) => {
      if (
        prev
        && Math.abs(prev[0] - live[0]) < 0.05
        && Math.abs(prev[1] - live[1]) < 0.05
        && Math.abs(prev[2] - live[2]) < 0.05
      ) return prev
      return [live[0], live[1], live[2]]
    })
  })

  if (!resolved || !livePosition) return null
  const { body } = resolved
  const sizeLift = (() => {
    const sizes = (window as Window & { __viewer3dBodySizes?: Record<string, number> }).__viewer3dBodySizes
    return sizes?.[body.id] ?? 1
  })()

  const cardPosition: SceneVec3 = [
    livePosition[0] + sizeLift * 1.4,
    livePosition[1] + sizeLift * 1.4,
    livePosition[2],
  ]

  return (
    <Html
      position={cardPosition}
      pointerEvents="auto"
      zIndexRange={[120, 0]}
      style={{ transform: 'translate(0, -100%)' }}
    >
      <CardBody body={body} system={system} onClose={() => select(null)} />
    </Html>
  )
}

function CardBody({ body, system, onClose }: { body: OrbitingBody; system: GeneratedSystem; onClose: () => void }) {
  const isBelt = body.category.value === 'belt'
  const isAnomaly = body.category.value === 'anomaly'

  const settlements = system.settlements.filter((s) => s.bodyId === body.id)
  const subSettlements = system.companions.flatMap((c) => c.subSystem?.settlements.filter((s) => s.bodyId === body.id) ?? [])
  const settlementCount = settlements.length + subSettlements.length

  const gates = system.gates.filter((g) => g.bodyId === body.id)
  const subGates = system.companions.flatMap((c) => c.subSystem?.gates.filter((g) => g.bodyId === body.id) ?? [])
  const gateCount = gates.length + subGates.length

  return (
    <article
      role="dialog"
      aria-label={`${body.name.value} details`}
      className="pointer-events-auto w-[280px] rounded-md border border-[var(--accent)]/40 bg-[#0f141c]/80 p-3 text-[11px] text-[var(--text-primary)] shadow-lg shadow-black/40 backdrop-blur-md"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold tracking-tight">{body.name.value}</h3>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            {body.bodyClass.value} · {body.thermalZone.value}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </header>

      <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-2 gap-y-0.5 text-[10px] leading-snug">
        {isBelt ? (
          <>
            <dt className="text-[var(--text-tertiary)]">Structure</dt><dd>Distributed belt</dd>
          </>
        ) : (
          <>
            <dt className="text-[var(--text-tertiary)]">{isAnomaly ? 'Scale' : 'Radius'}</dt>
            <dd>{body.physical.radiusEarth.value}{isAnomaly ? ' index' : ' R⊕'}</dd>
            <dt className="text-[var(--text-tertiary)]">Mass</dt>
            <dd>{body.physical.massEarth.value === null ? '—' : `${body.physical.massEarth.value} M⊕`}</dd>
            <dt className="text-[var(--text-tertiary)]">Gravity</dt>
            <dd>{body.physical.gravityLabel.value}</dd>
          </>
        )}
        <dt className="text-[var(--text-tertiary)]">Orbit</dt>
        <dd className="font-mono">{body.orbitAu.value} AU</dd>
        <dt className="text-[var(--text-tertiary)]">Period</dt>
        <dd className="font-mono">{body.physical.periodDays.value} d</dd>
        <dt className="text-[var(--text-tertiary)]">Atmosphere</dt>
        <dd className="truncate" title={body.detail.atmosphere.value}>{body.detail.atmosphere.value}</dd>
        <dt className="text-[var(--text-tertiary)]">Volatiles</dt>
        <dd className="truncate" title={body.detail.hydrosphere.value}>{body.detail.hydrosphere.value}</dd>
        <dt className="text-[var(--text-tertiary)]">Geology</dt>
        <dd className="truncate" title={body.detail.geology.value}>{body.detail.geology.value}</dd>
        <dt className="text-[var(--text-tertiary)]">Radiation</dt>
        <dd className="truncate" title={body.detail.radiation.value}>{body.detail.radiation.value}</dd>
        <dt className="text-[var(--text-tertiary)]">Biosphere</dt>
        <dd className="truncate" title={body.detail.biosphere.value}>{body.detail.biosphere.value}</dd>
        {body.detail.climate.length ? (
          <>
            <dt className="text-[var(--text-tertiary)]">Climate</dt>
            <dd className="truncate" title={body.detail.climate.map((c) => c.value).join(', ')}>{body.detail.climate.map((c) => c.value).join(', ')}</dd>
          </>
        ) : null}
      </dl>

      {body.whyInteresting.value ? (
        <p className="mt-2 border-t border-white/10 pt-2 text-[10px] italic leading-snug text-[var(--text-secondary)]">
          {body.whyInteresting.value}
        </p>
      ) : null}

      {(body.moons.length > 0 || settlementCount > 0 || gateCount > 0) ? (
        <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1 border-t border-white/10 pt-2 text-[10px] text-[var(--text-tertiary)]">
          {body.moons.length > 0 ? <li><span className="text-[var(--text-secondary)]">{body.moons.length}</span> moons</li> : null}
          {settlementCount > 0 ? <li><span className="text-[var(--text-secondary)]">{settlementCount}</span> settlements</li> : null}
          {gateCount > 0 ? <li><span className="text-[var(--text-secondary)]">{gateCount}</span> gates</li> : null}
        </ul>
      ) : null}
    </article>
  )
}
