'use client'

import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import type { RingVisual } from '../types'

export function Ring({ ring }: { ring: RingVisual }) {
  const mesh = useMemo(() => {
    const geo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 64, 1)
    const colors: number[] = []
    const pos = geo.attributes.position
    const baseColor = new THREE.Color(ring.color)
    const secondaryColor = new THREE.Color(ring.secondaryColor)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i)
      const r = Math.sqrt(x * x + y * y)
      const t = (r - ring.innerRadius) / (ring.outerRadius - ring.innerRadius)
      const angle = Math.atan2(y, x)
      const banded = 0.58 + 0.42 * Math.sin(t * Math.PI * ring.bandCount * 2 + ring.gapSeed)
      let gapFactor = 1
      for (let gap = 0; gap < ring.gapCount; gap++) {
        const center = (ring.gapSeed * 0.137 + gap / Math.max(1, ring.gapCount)) % 1
        const distance = Math.abs(t - center)
        gapFactor *= 1 - 0.72 * (1 - smoothstep(0.012, 0.045, distance))
      }
      const arc = 1 - ring.arcStrength * 0.45 * (0.5 + 0.5 * Math.sin(angle * 2 + ring.gapSeed))
      const mixed = baseColor.clone().lerp(secondaryColor, 0.22 + 0.18 * Math.sin(t * Math.PI * 4 + ring.gapSeed))
      const brightness = banded * gapFactor * arc
      colors.push(mixed.r * brightness, mixed.g * brightness, mixed.b * brightness)
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: ring.opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const m = new THREE.Mesh(geo, mat)
    m.rotation.x = Math.PI / 2 + ring.tilt
    return m
  }, [ring])

  useEffect(() => () => {
    mesh.geometry.dispose()
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => material.dispose())
    } else {
      mesh.material.dispose()
    }
  }, [mesh])

  return <primitive object={mesh} />
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
