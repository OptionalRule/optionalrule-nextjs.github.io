'use client'

import * as THREE from 'three'
import { useEffect, useMemo } from 'react'

export interface OrbitProps {
  radius: number
  tiltY?: number
  color: string
  opacity?: number
  dashed?: boolean
}

export function Orbit({ radius, tiltY = 0, color, opacity = 0.55, dashed = false }: OrbitProps) {
  const points = useMemo(() => {
    const out: THREE.Vector3[] = []
    const segments = 128
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      out.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    return out
  }, [radius])

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])
  const material = useMemo(() => {
    const mat = dashed
      ? new THREE.LineDashedMaterial({ color: new THREE.Color(color), dashSize: 1.2, gapSize: 1.5, transparent: true, opacity })
      : new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity })
    return mat
  }, [color, opacity, dashed])

  const line = useMemo(() => {
    const object = new THREE.Line(geometry, material)
    if (dashed) object.computeLineDistances()
    return object
  }, [geometry, material, dashed])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  return (
    <group rotation={[tiltY, 0, 0]}>
      <primitive object={line} />
    </group>
  )
}
