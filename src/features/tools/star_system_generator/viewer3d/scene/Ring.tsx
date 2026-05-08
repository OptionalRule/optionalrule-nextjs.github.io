'use client'

import * as THREE from 'three'
import { useMemo } from 'react'
import type { RingVisual } from '../types'

export function Ring({ ring }: { ring: RingVisual }) {
  const mesh = useMemo(() => {
    const geo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 64, 1)
    const colors: number[] = []
    const pos = geo.attributes.position
    const baseColor = new THREE.Color(ring.color)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i)
      const r = Math.sqrt(x * x + y * y)
      const t = (r - ring.innerRadius) / (ring.outerRadius - ring.innerRadius)
      const banded = 0.6 + 0.4 * Math.sin(t * Math.PI * ring.bandCount * 2)
      colors.push(baseColor.r * banded, baseColor.g * banded, baseColor.b * banded)
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const m = new THREE.Mesh(geo, mat)
    m.rotation.x = Math.PI / 2 + ring.tilt
    return m
  }, [ring])

  return <primitive object={mesh} />
}
