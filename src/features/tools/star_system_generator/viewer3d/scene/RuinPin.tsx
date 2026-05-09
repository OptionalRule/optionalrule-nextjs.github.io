'use client'

import type { RuinMarker } from '../types'
import { useLayers } from '../chrome/ViewerContext'

export function RuinPin({ ruin }: { ruin: RuinMarker }) {
  const { layers } = useLayers()
  if (!layers.human) return null
  return (
    <mesh position={ruin.position}>
      <octahedronGeometry args={[1.4, 0]} />
      <meshBasicMaterial color="#7e8a96" transparent opacity={0.7} toneMapped={false} />
    </mesh>
  )
}
