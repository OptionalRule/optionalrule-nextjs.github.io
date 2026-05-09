'use client'

import type { StarVisual } from '../types'

export interface StarProps {
  star: StarVisual
}

export function Star({ star }: StarProps) {
  const coreSize = star.coronaRadius * 0.5

  return (
    <group position={star.position}>
      <mesh>
        <sphereGeometry args={[coreSize, 24, 24]} />
        <meshBasicMaterial color={star.coreColor} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[star.coronaRadius, 24, 24]} />
        <meshBasicMaterial
          color={star.coronaColor}
          transparent
          opacity={0.18 * star.bloomStrength}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
