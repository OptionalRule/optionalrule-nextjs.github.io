'use client'

import { useMemo } from 'react'
import type { StarVisual } from '../types'

export interface StarProps {
  star: StarVisual
}

export function Star({ star }: StarProps) {
  const coreSize = Math.max(8, star.coronaRadius * 0.35)
  const rays = useMemo(() => {
    const out: Array<[number, number]> = []
    for (let i = 0; i < star.rayCount; i++) {
      const angle = (i / star.rayCount) * Math.PI * 2
      out.push([Math.cos(angle), Math.sin(angle)])
    }
    return out
  }, [star.rayCount])

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
      {rays.map(([x, y], idx) => (
        <mesh key={idx} position={[x * star.coronaRadius * 1.05, 0, y * star.coronaRadius * 1.05]}>
          <sphereGeometry args={[1.5, 8, 8]} />
          <meshBasicMaterial color={star.coronaColor} transparent opacity={0.45} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
