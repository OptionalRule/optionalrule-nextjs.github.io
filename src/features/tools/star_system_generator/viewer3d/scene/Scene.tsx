'use client'

import { Canvas } from '@react-three/fiber'
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
import { RuinPin } from './RuinPin'
import { PhenomenonGlyph } from './PhenomenonGlyph'
import { HoverTooltip } from './HoverTooltip'
import { useViewerContext } from '../chrome/ViewerContext'

export interface SceneProps {
  graph: SystemSceneGraph
  system: GeneratedSystem
}

export function Scene({ graph, system }: SceneProps) {
  const { select, hover } = useViewerContext()
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 45, near: 0.1, far: graph.sceneRadius * 6, position: [0, graph.sceneRadius * 0.35, graph.sceneRadius * 0.95] }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'radial-gradient(ellipse at center, #0a1424 0%, #02040a 75%)' }}
    >
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 0, 0]} intensity={2.5} distance={graph.sceneRadius * 4} decay={0.6} />
      <CameraRig sceneRadius={graph.sceneRadius} />
      <Star star={graph.star} />
      <mesh
        position={graph.star.position}
        onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'star', id: graph.star.id }); document.body.style.cursor = 'pointer' }}
        onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); select({ kind: 'star', id: graph.star.id }) }}
      >
        <sphereGeometry args={[graph.star.coronaRadius * 0.6, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {graph.companions.map((c) => (
        <Star key={c.id} star={c} />
      ))}
      <Zones
        habitableInner={graph.zones.habitableInner}
        habitableOuter={graph.zones.habitable * 1.4}
        snowLine={graph.zones.snowLine}
      />
      {graph.bodies.map((body) => (
        <Orbit key={`orbit-${body.id}`} radius={body.orbitRadius} tiltY={body.orbitTiltY} color="#5fb6e8" />
      ))}
      {graph.bodies.map((body) => (
        <Body key={`body-${body.id}`} body={body} />
      ))}
      {graph.belts.map((b) => (
        <Belt key={`belt-${b.id}`} belt={b} />
      ))}
      {graph.hazards.map((h) => (
        <HazardVolume key={`hz-${h.id}`} hazard={h} />
      ))}
      {graph.guBleeds.map((g) => (
        <GuBleedVolume key={`gu-${g.id}`} bleed={g} />
      ))}
      {graph.ruins.filter((r) => !r.attachedBodyId).map((r) => (
        <RuinPin key={`ruin-${r.id}`} ruin={r} />
      ))}
      {graph.phenomena.map((p) => (
        <PhenomenonGlyph key={`phen-${p.id}`} phenomenon={p} />
      ))}
      <HoverTooltip graph={graph} system={system} />
    </Canvas>
  )
}
