'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

interface DebrisFieldStreamProps {
  startRadius: number
  endRadius: number
  centerAngleDeg: number
  opacity: number
  color: string
}

export function DebrisFieldStream(props: DebrisFieldStreamProps) {
  const streamLine = useMemo(() => {
    const angleRad = props.centerAngleDeg * Math.PI / 180
    const segments = 20
    const positions = new Float32Array((segments + 1) * 3)
    const colors = new Float32Array((segments + 1) * 3)
    const colorHot = new THREE.Color('#ffe6aa')
    const colorCool = new THREE.Color(props.color)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const r = props.startRadius + (props.endRadius - props.startRadius) * t
      positions[i * 3] = r * Math.cos(angleRad)
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = r * Math.sin(angleRad)
      const c = colorCool.clone().lerp(colorHot, 1 - t)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: props.opacity })
    return new THREE.Line(g, material)
  }, [props.startRadius, props.endRadius, props.centerAngleDeg, props.color, props.opacity])

  const hotSpotX = props.endRadius * Math.cos(props.centerAngleDeg * Math.PI / 180)
  const hotSpotZ = props.endRadius * Math.sin(props.centerAngleDeg * Math.PI / 180)

  return (
    <group>
      <primitive object={streamLine} />
      <mesh position={[hotSpotX, 0, hotSpotZ]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color="#ffe6aa" transparent opacity={Math.min(1, props.opacity + 0.2)} />
      </mesh>
    </group>
  )
}
