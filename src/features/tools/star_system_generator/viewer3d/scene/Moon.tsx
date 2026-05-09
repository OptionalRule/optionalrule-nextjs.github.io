'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MoonVisual } from '../types'
import { usePrefersReducedMotion } from '../chrome/ViewerContext'
import { moonSphereGeometry } from './renderAssets'
import { makeMoonMaterial } from './moonShader'

export function Moon({ moon }: { moon: MoonVisual }) {
  const groupRef = useRef<THREE.Group | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const material = useMemo(() => makeMoonMaterial(moon), [moon])

  useEffect(() => () => material.dispose(), [material])

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    if (!prefersReducedMotion) {
      groupRef.current.rotation.y -= moon.angularSpeed * delta
    }
  })

  return (
    <group ref={groupRef} rotation={[moon.orbitTilt, moon.phase0, 0]}>
      <mesh
        geometry={moonSphereGeometry}
        material={material}
        position={[moon.parentRelativeOrbit, 0, 0]}
        scale={moon.visualSize}
        dispose={null}
      />
    </group>
  )
}
