'use client'

import * as THREE from 'three'
import { useViewerContext } from '../chrome/ViewerContext'

export function SettlementPin({ size }: { size: number }) {
  const { layers } = useViewerContext()
  if (!layers.human) return null
  return (
    <group position={[0, size * 1.6, 0]}>
      <mesh>
        <sphereGeometry args={[size * 0.18, 8, 8]} />
        <meshBasicMaterial color={new THREE.Color('#ff9d4a')} toneMapped={false} />
      </mesh>
      <mesh position={[0, -size * 0.4, 0]}>
        <cylinderGeometry args={[size * 0.03, size * 0.03, size * 0.8, 6]} />
        <meshBasicMaterial color={new THREE.Color('#ff9d4a')} toneMapped={false} />
      </mesh>
    </group>
  )
}
