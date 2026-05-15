'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

interface DebrisFieldHaloProps {
  innerRadius: number
  outerRadius: number
  inclinationDeg: number
  particleCount: number
  opacity: number
  color: string
}

export function DebrisFieldHalo(props: DebrisFieldHaloProps) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(props.particleCount * 3)
    const maxTiltRad = props.inclinationDeg * Math.PI / 180
    for (let i = 0; i < props.particleCount; i++) {
      const u = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1
      const v = ((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) % 1
      const w = ((Math.sin(i * 39.346) * 43758.5453) % 1 + 1) % 1
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * u
      const phi = 2 * Math.PI * v
      const tilt = (w - 0.5) * 2 * maxTiltRad
      positions[i * 3] = r * Math.cos(phi) * Math.cos(tilt)
      positions[i * 3 + 1] = r * Math.sin(tilt)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.cos(tilt)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [props.particleCount, props.innerRadius, props.outerRadius, props.inclinationDeg])

  return (
    <points geometry={geometry}>
      <pointsMaterial color={props.color} size={0.4} sizeAttenuation transparent opacity={props.opacity} />
    </points>
  )
}
