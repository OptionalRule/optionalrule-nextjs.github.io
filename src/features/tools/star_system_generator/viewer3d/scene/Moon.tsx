'use client'

import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MoonVisual } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

export function Moon({ moon }: { moon: MoonVisual }) {
  const groupRef = useRef<THREE.Group | null>(null)
  const { prefersReducedMotion } = useViewerContext()

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    if (!prefersReducedMotion) {
      groupRef.current.rotation.y -= moon.angularSpeed * delta
    }
  })

  return (
    <group ref={groupRef} rotation={[0, moon.phase0, 0]}>
      <mesh position={[moon.parentRelativeOrbit, 0, 0]}>
        <sphereGeometry args={[moon.visualSize, 16, 16]} />
        <meshStandardMaterial color={new THREE.Color('#8a8a82')} roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}
