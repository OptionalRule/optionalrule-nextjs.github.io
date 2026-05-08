'use client'

import { Canvas } from '@react-three/fiber'
import type { SystemSceneGraph } from '../types'
import { CameraRig } from './CameraRig'

export interface SceneProps {
  graph: SystemSceneGraph
}

export function Scene({ graph }: SceneProps) {
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
    </Canvas>
  )
}
