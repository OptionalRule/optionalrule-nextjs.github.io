'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { StarVisual } from '../types'
import { starSphereGeometry } from './renderAssets'

export interface StarProps {
  star: StarVisual
}

export function Star({ star }: StarProps) {
  const flareRef = useRef<THREE.Group | null>(null)
  const coreSize = star.coronaRadius * 0.5
  const coreMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: star.coreColor, toneMapped: false }),
    [star.coreColor],
  )
  const coronaMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: star.coronaColor,
      transparent: true,
      opacity: 0.18 * star.bloomStrength,
      depthWrite: false,
      toneMapped: false,
    }),
    [star.bloomStrength, star.coronaColor],
  )
  const rayMaterial = useMemo(
    () => new THREE.LineBasicMaterial({
      color: star.rayColor,
      transparent: true,
      opacity: 0.2 * star.flareStrength,
      toneMapped: false,
    }),
    [star.flareStrength, star.rayColor],
  )
  const rayGeometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    const count = Math.max(4, Math.min(16, star.rayCount))
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const inner = star.coronaRadius * 0.62
      const outer = star.coronaRadius * (1.25 + (i % 3) * 0.12)
      points.push(new THREE.Vector3(Math.cos(angle) * inner, Math.sin(angle) * inner, 0))
      points.push(new THREE.Vector3(Math.cos(angle) * outer, Math.sin(angle) * outer, 0))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [star.coronaRadius, star.rayCount])

  useEffect(() => () => {
    coreMaterial.dispose()
    coronaMaterial.dispose()
    rayMaterial.dispose()
    rayGeometry.dispose()
  }, [coreMaterial, coronaMaterial, rayGeometry, rayMaterial])

  useFrame((state) => {
    if (!flareRef.current) return
    const pulse = 1 + Math.sin(state.clock.elapsedTime * star.pulseSpeed) * 0.04 * star.flareStrength
    flareRef.current.scale.setScalar(pulse)
    flareRef.current.lookAt(state.camera.position)
  })

  return (
    <group position={star.position}>
      <mesh geometry={starSphereGeometry} material={coreMaterial} scale={coreSize} dispose={null} />
      <mesh geometry={starSphereGeometry} material={coronaMaterial} scale={star.coronaRadius} dispose={null} />
      <group ref={flareRef}>
        <lineSegments geometry={rayGeometry} material={rayMaterial} dispose={null} />
      </group>
    </group>
  )
}
