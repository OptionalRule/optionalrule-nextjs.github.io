'use client'

import { useEffect, useMemo, useState } from 'react'
import type { GeneratedSystem } from '../types'
import { buildSceneGraph } from './lib/sceneGraph'
import { ViewerContextProvider } from './chrome/ViewerContext'
import { ViewerModal } from './chrome/ViewerModal'
import { LayerToggles } from './chrome/LayerToggles'
import { DetailSidebar } from './chrome/DetailSidebar'
import { ViewerLegend } from './chrome/ViewerLegend'
import { Scene } from './scene/Scene'
import { BodyLookupProvider } from './scene/bodyLookup'
import { formatStellarClass } from '../lib/stellarLabels'
import { BodyDetailContent } from '../components/BodyDetailPanel'
import { SettlementCard } from '../components/SettlementCard'
import { GuOverlayPanel } from '../components/GuOverlayPanel'
import { StarDetailCard } from './chrome/StarDetailCard'
import { HazardCard } from './chrome/HazardCard'
import { PhenomenonCard } from './chrome/PhenomenonCard'
import { useScaleMode, useSelectionState } from './chrome/ViewerContext'
import type { OrbitScaleMode } from './types'

export interface SystemViewer3DModalProps {
  system: GeneratedSystem
  onClose: () => void
}

function makeScaleNote(system: GeneratedSystem, scaleMode: OrbitScaleMode): string {
  const orbits = system.bodies.map((b) => b.orbitAu.value)
  const inner = orbits.length ? Math.min(...orbits).toFixed(1) : '0'
  const outer = orbits.length ? Math.max(...orbits).toFixed(1) : '0'
  const modeLabel: Record<OrbitScaleMode, string> = {
    'readable-log': 'readable log scale',
    'relative-au': 'relative AU scale',
    schematic: 'schematic lanes',
  }
  return `${modeLabel[scaleMode]} · ${inner} — ${outer} AU`
}

export default function SystemViewer3DModal({ system, onClose }: SystemViewer3DModalProps) {
  const title = `${system.name.value} · ${formatStellarClass(system.primary.spectralType.value)} · ${system.bodies.length} bodies`

  return (
    <ViewerContextProvider>
      <SystemViewer3DModalContent system={system} onClose={onClose} title={title} />
    </ViewerContextProvider>
  )
}

function SystemViewer3DModalContent({ system, onClose, title }: SystemViewer3DModalProps & { title: string }) {
  const { scaleMode } = useScaleMode()
  const graph = useMemo(() => buildSceneGraph(system, { scaleMode }), [scaleMode, system])
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setMounted(true)
      return
    }
    const t = window.setTimeout(() => setMounted(true), 16)
    return () => window.clearTimeout(t)
  }, [])
  useEffect(() => {
    function handler() { onClose() }
    window.addEventListener('viewer3d:close', handler)
    return () => window.removeEventListener('viewer3d:close', handler)
  }, [onClose])
  useEffect(() => {
    const original = console.warn
    console.warn = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].startsWith('THREE.Clock')) return
      original.apply(console, args)
    }
    return () => { console.warn = original }
  }, [])
  return (
    <ViewerModal
      title={title}
      onClose={onClose}
      header={<LayerToggles />}
      footer={
        <ViewerLegend
          scaleNote={makeScaleNote(system, scaleMode)}
          onFrame={() => window.dispatchEvent(new CustomEvent('viewer3d:frame-system'))}
        />
      }
    >
      <BodyLookupProvider system={system}>
        <div className={`relative flex-1 transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <Scene graph={graph} system={system} />
        </div>
        <DetailSidebar>
          <SidebarContent system={system} graph={graph} />
        </DetailSidebar>
      </BodyLookupProvider>
    </ViewerModal>
  )
}

function allBodies(system: GeneratedSystem): GeneratedSystem['bodies'] {
  return [
    ...system.bodies,
    ...system.companions.flatMap((c) => c.subSystem?.bodies ?? []),
  ]
}

function allSettlements(system: GeneratedSystem): GeneratedSystem['settlements'] {
  return [
    ...system.settlements,
    ...system.companions.flatMap((c) => c.subSystem?.settlements ?? []),
  ]
}

function allGates(system: GeneratedSystem): GeneratedSystem['gates'] {
  return [
    ...system.gates,
    ...system.companions.flatMap((c) => c.subSystem?.gates ?? []),
  ]
}

function allRuins(system: GeneratedSystem): GeneratedSystem['ruins'] {
  return [
    ...system.ruins,
    ...system.companions.flatMap((c) => c.subSystem?.ruins ?? []),
  ]
}

function SidebarContent({ system, graph }: { system: GeneratedSystem; graph: ReturnType<typeof buildSceneGraph> }) {
  const { selection } = useSelectionState()
  if (!selection) {
    return <p className="text-xs text-[var(--text-tertiary)]">Click a body, settlement, or hazard to see details.</p>
  }
  switch (selection.kind) {
    case 'body': {
      const body = allBodies(system).find((b) => b.id === selection.id)
      if (!body) return null
      return <BodyDetailContent body={body} system={system} compact />
    }
    case 'moon': {
      const parent = allBodies(system).find((b) => b.moons.some((m) => m.id === selection.id))
      if (!parent) return null
      return <BodyDetailContent body={parent} system={system} compact />
    }
    case 'settlement': {
      const s = allSettlements(system).find((x) => x.id === selection.id)
      return s ? <SettlementCard settlement={s} /> : null
    }
    case 'gate': {
      const gate = allGates(system).find((g) => g.id === selection.id)
      return gate ? <GateDetailCard gate={gate} /> : null
    }
    case 'star': {
      return <StarDetailCard system={system} />
    }
    case 'hazard': {
      const h = graph.hazards.find((x) => x.id === selection.id)
      return h ? <HazardCard hazard={h} /> : null
    }
    case 'gu-bleed': {
      return <GuOverlayPanel system={system} compact />
    }
    case 'phenomenon': {
      return <PhenomenonCard phenomenonId={selection.id} system={system} />
    }
    case 'ruin': {
      const ruin = allRuins(system).find((x) => x.id === selection.id)
      return ruin ? <RemnantDetailCard ruin={ruin} /> : null
    }
    default:
      return null
  }
}

function RemnantDetailCard({ ruin }: { ruin: GeneratedSystem['ruins'][number] }) {
  return (
    <article className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
      <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
        {ruin.remnantType.value}
      </h3>
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--text-tertiary)]">{ruin.location.value}</p>
      <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">{ruin.hook.value}</p>
    </article>
  )
}

function GateDetailCard({ gate }: { gate: GeneratedSystem['gates'][number] }) {
  return (
    <article className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm">
      <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">{gate.name.value}</h3>
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
        Gate · {gate.anchorName.value}
      </p>
      <dl className="mt-3 space-y-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
        <div>
          <dt className="inline font-semibold text-[var(--text-primary)]">Route Note: </dt>
          <dd className="inline">{gate.routeNote.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-primary)]">Authority: </dt>
          <dd className="inline">{gate.authority.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-primary)]">Built Form: </dt>
          <dd className="inline">{gate.builtForm.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-primary)]">Condition: </dt>
          <dd className="inline">{gate.condition.value}</dd>
        </div>
        {gate.pinchDifficulty ? (
          <div>
            <dt className="inline font-semibold text-[var(--text-primary)]">Pinch Difficulty: </dt>
            <dd className="inline">{gate.pinchDifficulty.value}</dd>
          </div>
        ) : null}
      </dl>
      {gate.tagHook.value ? (
        <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">{gate.tagHook.value}</p>
      ) : null}
    </article>
  )
}
