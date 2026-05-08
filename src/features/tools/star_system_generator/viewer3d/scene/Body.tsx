'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BodyVisual } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

export interface BodyProps {
  body: BodyVisual
}

export function Body({ body }: BodyProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const { prefersReducedMotion } = useViewerContext()
  const placeholderColor = useMemo(() => {
    return new THREE.Color(['gas-giant', 'ice-giant'].includes(body.shading) ? '#b08a52' : '#7e8a96')
  }, [body.shading])

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    const speed = prefersReducedMotion ? 0 : body.angularSpeed
    groupRef.current.rotation.y -= speed * delta
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.3
  })

  return (
    <group ref={groupRef} rotation={[body.orbitTiltY, body.phase0, 0]}>
      <mesh ref={meshRef} position={[body.orbitRadius, 0, 0]}>
        <sphereGeometry args={[body.visualSize, 32, 32]} />
        <meshStandardMaterial color={placeholderColor} roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  )
}
