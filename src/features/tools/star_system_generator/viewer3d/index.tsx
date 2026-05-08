'use client'

import { useMemo } from 'react'
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
          <div className="relative flex-1">
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

function SidebarContent({ system: _system, graph: _graph }: { system: GeneratedSystem; graph: ReturnType<typeof buildSceneGraph> }) {
  return (
    <p className="text-xs text-[var(--text-tertiary)]">
      Click a body, settlement, or hazard to see details. (Wiring lands in Task 30.)
    </p>
  )
}
