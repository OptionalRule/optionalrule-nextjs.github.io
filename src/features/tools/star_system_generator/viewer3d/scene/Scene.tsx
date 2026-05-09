'use client'

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Stars } from '@react-three/drei'
import type { GeneratedSystem } from '../../types'
import type { SystemSceneGraph } from '../types'
import { CameraRig } from './CameraRig'
import { Star } from './Star'
import { Orbit } from './Orbit'
import { Zones } from './Zones'
import { Body } from './Body'
import { Belt } from './Belt'
import { HazardVolume } from './HazardVolume'
import { GuBleedVolume } from './GuBleedVolume'
import { PhenomenonGlyphs, RuinPins } from './MarkerInstances'
import { HoverTooltip } from './HoverTooltip'
import { useLayers, usePrefersReducedMotion, useSelectionActions } from '../chrome/ViewerContext'
import { WebGLFallback } from '../chrome/WebGLFallback'
import { invisibleHitMaterial, starSphereGeometry } from './renderAssets'

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
  if (!supported) {
    return <WebGLFallback onClose={() => window.dispatchEvent(new CustomEvent('viewer3d:close'))} />
  }

  const hasBodies = graph.bodies.length > 0 || graph.belts.length > 0
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={prefersReducedMotion ? 'demand' : 'always'}
      camera={{ fov: 45, near: 0.1, far: graph.sceneRadius * 6, position: [0, graph.sceneRadius * 0.35, graph.sceneRadius * 0.95] }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'radial-gradient(ellipse at center, #0a1424 0%, #02040a 75%)' }}
    >
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 0, 0]} intensity={2.5} distance={graph.sceneRadius * 4} decay={0.6} />
      <Stars
        radius={graph.sceneRadius * 2.2}
        depth={graph.sceneRadius * 0.8}
        count={3500}
        factor={graph.sceneRadius * 0.16}
        saturation={0}
        fade
        speed={prefersReducedMotion ? 0 : 0.2}
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
          <Zones
            habitableInner={graph.zones.habitableInner}
            habitableOuter={graph.zones.habitableOuter}
            snowLine={graph.zones.snowLine}
          />
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
      {layers.physical ? graph.hazards.map((h) => (
        <HazardVolume key={`hz-${h.id}`} hazard={h} />
      )) : null}
      {graph.guBleeds.map((g) => (
        <GuBleedVolume key={`gu-${g.id}`} bleed={g} />
      ))}
      <RuinPins ruins={graph.ruins.filter((r) => !r.attachedBodyId)} />
      <PhenomenonGlyphs phenomena={graph.phenomena} />
      <HoverTooltip graph={graph} system={system} />
    </Canvas>
  )
}
