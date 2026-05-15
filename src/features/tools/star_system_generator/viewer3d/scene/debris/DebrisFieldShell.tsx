'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

interface DebrisFieldShellProps {
  innerRadius: number
  outerRadius: number
  particleCount: number
  opacity: number
  color: string
}

export function DebrisFieldShell(props: DebrisFieldShellProps) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(props.particleCount * 3)
    for (let i = 0; i < props.particleCount; i++) {
      const u = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1
      const v = ((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) % 1
      const w = ((Math.sin(i * 39.346) * 43758.5453) % 1 + 1) % 1
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * u
      const theta = Math.acos(2 * v - 1)
      const phi = 2 * Math.PI * w
      positions[i * 3] = r * Math.sin(theta) * Math.cos(phi)
      positions[i * 3 + 1] = r * Math.cos(theta)
      positions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [props.particleCount, props.innerRadius, props.outerRadius])

  return (
    <points geometry={geometry}>
      <pointsMaterial color={props.color} size={0.6} sizeAttenuation transparent opacity={props.opacity} />
    </points>
  )
}
