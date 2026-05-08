'use client'

import * as THREE from 'three'
import type { PhenomenonMarker } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

export function PhenomenonGlyph({ phenomenon }: { phenomenon: PhenomenonMarker }) {
  const { layers } = useViewerContext()
  if (!layers.gu) return null
  return (
    <mesh position={phenomenon.position}>
      <icosahedronGeometry args={[1.6, 0]} />
      <meshBasicMaterial color={new THREE.Color('#a880ff')} transparent opacity={0.8} toneMapped={false} />
    </mesh>
  )
}
