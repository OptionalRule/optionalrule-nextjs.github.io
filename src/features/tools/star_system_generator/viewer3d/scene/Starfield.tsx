'use client'

import * as THREE from 'three'
import { useEffect, useMemo } from 'react'

export interface StarfieldProps {
  radius: number
  count: number
}

function hashUnit(n: number, salt: number): number {
  let h = (n + 1) * 374761393 + salt * 668265263
  h = (h ^ (h >>> 13)) * 1274126177
  h = h ^ (h >>> 16)
  return ((h >>> 0) % 1_000_000) / 1_000_000
}

export function Starfield({ radius, count }: StarfieldProps) {
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const u = hashUnit(i, 1)
      const v = hashUnit(i, 2)
      const rJitter = hashUnit(i, 3)
      const sJitter = hashUnit(i, 4)
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const r = radius * (0.85 + rJitter * 0.3)
      positions[3 * i] = r * Math.sin(phi) * Math.cos(theta)
      positions[3 * i + 1] = r * Math.cos(phi)
      positions[3 * i + 2] = r * Math.sin(phi) * Math.sin(theta)
      sizes[i] = 0.6 + sJitter * 1.6
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.4,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
    return { geometry: geo, material: mat }
  }, [radius, count])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  return <points geometry={geometry} material={material} />
}
