'use client'

import { Fragment, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents, Html, PerformanceMonitor } from '@react-three/drei'
import type { GeneratedSystem } from '../../types'
import type { SystemSceneGraph } from '../types'
import { CameraRig } from './CameraRig'
import { Star } from './Star'
import { Orbit } from './Orbit'
import { Zones } from './Zones'
import { Body } from './Body'
import { Belt } from './Belt'
import { BeltSettlements } from './BeltSettlements'
import { Starfield } from './Starfield'
import { HazardVolume } from './HazardVolume'
import { GuBleedVolume } from './GuBleedVolume'
import { RuinPins } from './MarkerInstances'
import { HoverTooltip } from './HoverTooltip'
import { StellarBadge } from './StellarBadge'
import { BodyDetailCard } from './BodyDetailCard'
import { useLayers, usePrefersReducedMotion, useSelectionActions } from '../chrome/ViewerContext'
import { WebGLFallback } from '../chrome/WebGLFallback'
import { invisibleHitMaterial, starSphereGeometry } from './renderAssets'
import { buildSeedHref } from '../../lib/seedUrl'
import { DebrisFields } from './debris/DebrisFields'

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export interface SceneProps {
  graph: SystemSceneGraph
  system: GeneratedSystem
}

export function Scene({ graph, system }: SceneProps) {
  const { layers } = useLayers()
  const { select, hover } = useSelectionActions()
  const prefersReducedMotion = usePrefersReducedMotion()
  const [supported] = useState<boolean>(() => typeof document === 'undefined' ? true : detectWebGL())
  const [qualityScale, setQualityScale] = useState(1)
  if (!supported) {
    return <WebGLFallback onClose={() => window.dispatchEvent(new CustomEvent('viewer3d:close'))} />
  }

  const hasBodies = graph.bodies.length > 0 || graph.belts.length > 0
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={prefersReducedMotion ? 'demand' : 'always'}
      performance={{ min: 0.5, max: 1, debounce: 300 }}
      camera={{ fov: 45, near: 0.1, far: graph.sceneRadius * 12, position: [0, graph.sceneRadius * 0.35, graph.sceneRadius * 0.95] }}
      gl={{ antialias: true, alpha: false }}
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, rgba(60, 40, 90, 0.18) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 70% 80%, rgba(20, 60, 110, 0.16) 0%, transparent 60%),' +
          'radial-gradient(ellipse at center, #142036 0%, #0a1426 45%, #060a18 100%)',
      }}
    >
      <PerformanceMonitor
        onDecline={() => setQualityScale(0.68)}
        onIncline={() => setQualityScale(1)}
        onFallback={() => setQualityScale(0.5)}
      />
      <AdaptiveDpr />
      <AdaptiveEvents />
      <ambientLight intensity={0.05} />
      <pointLight
        position={[0, 0, 0]}
        color={graph.star.coreColor}
        intensity={2.25 + graph.star.bloomStrength * 0.75}
        distance={graph.sceneRadius * 4}
        decay={0.6}
      />
      <Starfield
        radius={graph.sceneRadius * 5}
        count={Math.round(8500 * qualityScale)}
      />
      <CameraRig sceneRadius={graph.sceneRadius} />
      {!hasBodies ? (
        <Html center>
          <div className="rounded-md border border-[var(--border)] bg-[#0f141c]/90 px-3 py-1.5 text-xs text-[var(--text-tertiary)]">
            No major bodies in this system.
          </div>
        </Html>
      ) : null}
      {layers.physical ? (
        <>
          <Star star={graph.star} />
          <mesh
            geometry={starSphereGeometry}
            material={invisibleHitMaterial}
            position={graph.star.position}
            scale={graph.star.coronaRadius * 0.6}
            dispose={null}
            onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'star', id: graph.star.id }); document.body.style.cursor = 'pointer' }}
            onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
            onClick={(e) => { e.stopPropagation(); select({ kind: 'star', id: graph.star.id }) }}
          />
          {graph.companions.map((c) => (
            <Star key={c.id} star={c} />
          ))}
          <StellarBadge
            starPosition={graph.star.position}
            starRadius={graph.star.coronaRadius}
            hazards={graph.systemLevelHazards.filter((h) => h.anchorDescription === 'stellar')}
          />
          {graph.distantMarkers.map((m) => (
            <group key={m.id} position={m.visual.position}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation()
                  if (typeof window !== 'undefined' && m.linkedSeed) {
                    const url = new URL(window.location.href)
                    url.searchParams.set('seed', m.linkedSeed)
                    window.location.href = url.toString()
                  }
                }}
              >
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial color={m.visual.coreColor} />
              </mesh>
              <Html center sprite>
                <a
                  href={buildSeedHref(m.linkedSeed)}
                  className="rounded bg-black/70 px-2 py-1 text-[10px] text-white underline"
                >
                  {m.label}
                </a>
              </Html>
            </group>
          ))}
          <Zones
            habitableInner={graph.zones.habitableInner}
            habitableOuter={graph.zones.habitableOuter}
          />
          {graph.circumbinaryKeepOut !== undefined ? (
            <Orbit
              radius={graph.circumbinaryKeepOut}
              tiltY={0}
              color="#ff6f6f"
            />
          ) : null}
          {graph.bodies.map((body) => (
            <Orbit key={`orbit-${body.id}`} radius={body.orbitRadius} tiltY={body.orbitTiltY} color="#5fb6e8" />
          ))}
        </>
      ) : null}
      {graph.bodies.map((body) => (
        <Body key={`body-${body.id}`} body={body} />
      ))}
      {layers.physical ? graph.belts.map((b) => (
        <Belt key={`belt-${b.id}`} belt={b} />
      )) : null}
      {graph.belts.map((b) => (
        <BeltSettlements key={`belt-settlements-${b.id}`} belt={b} />
      ))}
      <DebrisFields fields={graph.debrisFields} layerVisibility={layers} />
      {layers.physical ? graph.hazards.map((h) => (
        <HazardVolume key={`hz-${h.id}`} hazard={h} />
      )) : null}
      {graph.guBleeds.map((g) => (
        <GuBleedVolume key={`gu-${g.id}`} bleed={g} />
      ))}
      <RuinPins ruins={graph.ruins.filter((r) => !r.attachedBodyId)} />
      {graph.subSystems.map((sub) => (
        <Fragment key={sub.star.id}>
          {layers.physical ? <Star star={sub.star} /> : null}
          <group position={sub.star.position}>
            {layers.physical ? sub.bodies.map((body) => (
              <Orbit key={`sub-orbit-${body.id}`} radius={body.orbitRadius} tiltY={body.orbitTiltY} color="#a07eff" />
            )) : null}
            {sub.bodies.map((body) => (
              <Body key={`sub-body-${body.id}`} body={body} />
            ))}
            {layers.physical ? sub.belts.map((b) => (
              <Belt key={`sub-belt-${b.id}`} belt={b} />
            )) : null}
            {sub.belts.map((b) => (
              <BeltSettlements key={`sub-belt-settlements-${b.id}`} belt={b} />
            ))}
            <RuinPins ruins={sub.ruins.filter((r) => !r.attachedBodyId)} />
          </group>
        </Fragment>
      ))}
      <HoverTooltip graph={graph} system={system} />
      <BodyDetailCard graph={graph} system={system} />
    </Canvas>
  )
}
