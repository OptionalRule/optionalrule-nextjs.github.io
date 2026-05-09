'use client'

import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import type { MoonVisual } from '../types'

export function MoonOrbit({ moon, parentSize }: { moon: MoonVisual; parentSize: number }) {
  const line = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 96
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(a) * moon.parentRelativeOrbit, 0, Math.sin(a) * moon.parentRelativeOrbit))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({
      color: moon.surface.family === 'anomaly' ? '#a880ff' : '#8fb7cc',
      transparent: true,
      opacity: Math.max(0.18, Math.min(0.42, parentSize / 5)),
      depthWrite: false,
    })
    const orbit = new THREE.Line(geo, mat)
    orbit.rotation.x = moon.orbitTilt
    return orbit
  }, [moon, parentSize])

  useEffect(() => () => {
    line.geometry.dispose()
    if (Array.isArray(line.material)) {
      line.material.forEach((material) => material.dispose())
    } else {
      line.material.dispose()
    }
  }, [line])

  return <primitive object={line} />
}
