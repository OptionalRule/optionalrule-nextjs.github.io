'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

interface DebrisFieldRingProps {
  innerRadius: number
  outerRadius: number
  inclinationDeg: number
  spanDeg: number
  centerAngleDeg: number
  opacity: number
  color: string
}

export function DebrisFieldRing(props: DebrisFieldRingProps) {
  const geometry = useMemo(() => {
    const segments = Math.max(8, Math.round((props.spanDeg / 360) * 96))
    const thetaStart = (props.centerAngleDeg - props.spanDeg / 2) * Math.PI / 180
    const thetaLength = props.spanDeg * Math.PI / 180
    return new THREE.RingGeometry(props.innerRadius, props.outerRadius, segments, 1, thetaStart, thetaLength)
  }, [props.innerRadius, props.outerRadius, props.spanDeg, props.centerAngleDeg])

  const inclinationRad = props.inclinationDeg * Math.PI / 180
  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2 - inclinationRad, 0, 0]}>
      <meshBasicMaterial color={props.color} transparent opacity={props.opacity} side={THREE.DoubleSide} />
    </mesh>
  )
}
