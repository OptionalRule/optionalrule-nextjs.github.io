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
import { useViewerContext } from './chrome/ViewerContext'

export interface SystemViewer3DModalProps {
  system: GeneratedSystem
  onClose: () => void
}

function makeScaleNote(system: GeneratedSystem): string {
  const orbits = system.bodies.map((b) => b.orbitAu.value)
  const inner = orbits.length ? Math.min(...orbits).toFixed(1) : '0'
  const outer = orbits.length ? Math.max(...orbits).toFixed(1) : '0'
  return `log scale · ${inner} — ${outer} AU`
}

export default function SystemViewer3DModal({ system, onClose }: SystemViewer3DModalProps) {
  const graph = useMemo(() => buildSceneGraph(system), [system])
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
  const title = `${system.name.value} · ${formatStellarClass(system.primary.spectralType.value)} · ${system.bodies.length} bodies`

  return (
    <ViewerContextProvider>
      <ViewerModal
        title={title}
        onClose={onClose}
        header={<LayerToggles />}
        footer={
          <ViewerLegend
            scaleNote={makeScaleNote(system)}
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
    </ViewerContextProvider>
  )
}

function SidebarContent({ system, graph }: { system: GeneratedSystem; graph: ReturnType<typeof buildSceneGraph> }) {
  const { selection } = useViewerContext()
  if (!selection) {
    return <p className="text-xs text-[var(--text-tertiary)]">Click a body, settlement, or hazard to see details.</p>
  }
  switch (selection.kind) {
    case 'body': {
      const body = system.bodies.find((b) => b.id === selection.id)
      if (!body) return null
      return <BodyDetailContent body={body} system={system} compact />
    }
    case 'moon': {
      const parent = system.bodies.find((b) => b.moons.some((m) => m.id === selection.id))
      if (!parent) return null
      return <BodyDetailContent body={parent} system={system} compact />
    }
    case 'settlement': {
      const s = system.settlements.find((x) => x.id === selection.id)
      return s ? <SettlementCard settlement={s} /> : null
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
    default:
      return null
  }
}
