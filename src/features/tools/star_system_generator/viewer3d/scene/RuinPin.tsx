'use client'

import * as THREE from 'three'
import type { RuinMarker } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

export function RuinPin({ ruin }: { ruin: RuinMarker }) {
  const { layers } = useViewerContext()
  if (!layers.human) return null
  return (
    <mesh position={ruin.position}>
      <octahedronGeometry args={[1.4, 0]} />
      <meshBasicMaterial color={new THREE.Color('#7e8a96')} transparent opacity={0.7} toneMapped={false} />
    </mesh>
  )
}
