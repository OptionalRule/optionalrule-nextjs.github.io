'use client'

import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import type { StarVisual } from '../types'
import { starSphereGeometry } from './renderAssets'

export interface StarProps {
  star: StarVisual
}

export function Star({ star }: StarProps) {
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

  useEffect(() => () => {
    coreMaterial.dispose()
    coronaMaterial.dispose()
  }, [coreMaterial, coronaMaterial])

  return (
    <group position={star.position}>
      <mesh geometry={starSphereGeometry} material={coreMaterial} scale={coreSize} dispose={null} />
      <mesh geometry={starSphereGeometry} material={coronaMaterial} scale={star.coronaRadius} dispose={null} />
    </group>
  )
}
