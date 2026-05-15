'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { hashToUnit } from '../../lib/motion'
import { getDustMaterial } from './dustMaterial'
import { DebrisChunks, type ChunkPlacement } from './debrisChunks'

interface DebrisFieldRingProps {
  fieldId?: string
  innerRadius: number
  outerRadius: number
  inclinationDeg: number
  spanDeg: number
  centerAngleDeg: number
  opacity: number
  color: string
  dustCount?: number
  chunkCount?: number
}

const TWO_PI = Math.PI * 2

export function DebrisFieldRing(props: DebrisFieldRingProps) {
  const fieldId = props.fieldId ?? `ring-${props.centerAngleDeg}-${props.innerRadius}`
  const dustCount = Math.max(0, Math.round(props.dustCount ?? 600))
  const chunkCount = Math.max(0, Math.round(props.chunkCount ?? 40))
  const inclinationRad = props.inclinationDeg * Math.PI / 180

  const centerRad = props.centerAngleDeg * Math.PI / 180
  const halfSpanRad = (props.spanDeg / 2) * Math.PI / 180
  const startRad = centerRad - halfSpanRad
  const radialThickness = Math.max(0.0001, props.outerRadius - props.innerRadius)
  const meanRadius = (props.outerRadius + props.innerRadius) * 0.5
  const verticalThickness = Math.max(radialThickness * 0.18, meanRadius * 0.025)

  const bandCount = 3 + Math.floor(hashToUnit(`debris-bands#${fieldId}`) * 3)
  const bandCenters = useMemo(() => {
    return Array.from({ length: bandCount }, (_, idx) => {
      const slot = (idx + 0.5) / bandCount
      const jitter = (hashToUnit(`debris-band-slot#${fieldId}#${idx}`) - 0.5) * (0.5 / bandCount)
      return Math.min(0.95, Math.max(0.05, slot + jitter))
    })
  }, [fieldId, bandCount])

  const dustGeometry = useMemo(() => {
    const positions = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const turn = hashToUnit(`debris-ring-turn#${fieldId}#${i}`)
      const angle = startRad + turn * (halfSpanRad * 2)
      const bandRoll = hashToUnit(`debris-ring-band-roll#${fieldId}#${i}`)
      const bandIndex = Math.floor(hashToUnit(`debris-ring-band-idx#${fieldId}#${i}`) * bandCount)
      const inBand = bandRoll < 0.72
      const bandCenter = bandCenters[bandIndex]
      const bandWidth = 0.06 + hashToUnit(`debris-ring-band-w#${fieldId}#${bandIndex}`) * 0.06
      const radialT = inBand
        ? bandCenter + (hashToUnit(`debris-ring-band-pos#${fieldId}#${i}`) - 0.5) * bandWidth
        : hashToUnit(`debris-ring-loose#${fieldId}#${i}`)
      const r = props.innerRadius + radialT * radialThickness
      const yJitter = (hashToUnit(`debris-ring-y#${fieldId}#${i}`) - 0.5) * verticalThickness * 2
      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = yJitter
      positions[i * 3 + 2] = Math.sin(angle) * r
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [fieldId, dustCount, props.innerRadius, radialThickness, startRad, halfSpanRad, verticalThickness, bandCenters, bandCount])

  const dustMaterial = useMemo(() => getDustMaterial({
    color: props.color,
    opacity: Math.min(1, props.opacity * 0.85),
    size: Math.max(0.35, meanRadius * 0.024),
  }), [props.color, props.opacity, meanRadius])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    const out: ChunkPlacement[] = []
    for (let i = 0; i < chunkCount; i++) {
      const turn = hashToUnit(`debris-ring-chunk-turn#${fieldId}#${i}`)
      const angle = startRad + turn * (halfSpanRad * 2)
      const bandIndex = Math.floor(hashToUnit(`debris-ring-chunk-band#${fieldId}#${i}`) * bandCount)
      const bandCenter = bandCenters[bandIndex]
      const bandWidth = 0.05 + hashToUnit(`debris-ring-chunk-w#${fieldId}#${bandIndex}`) * 0.06
      const radialT = bandCenter + (hashToUnit(`debris-ring-chunk-pos#${fieldId}#${i}`) - 0.5) * bandWidth
      const r = props.innerRadius + Math.max(0, Math.min(1, radialT)) * radialThickness
      const yJitter = (hashToUnit(`debris-ring-chunk-y#${fieldId}#${i}`) - 0.5) * verticalThickness * 1.3
      const baseSize = (0.45 + Math.pow(hashToUnit(`debris-ring-chunk-size#${fieldId}#${i}`), 2.4) * 1.6)
        * Math.max(0.65, meanRadius * 0.12)
      const brightness = 0.55 + hashToUnit(`debris-ring-chunk-bright#${fieldId}#${i}`) * 0.55
      out.push({
        position: [Math.cos(angle) * r, yJitter, Math.sin(angle) * r],
        scale: baseSize,
        rotation: [
          hashToUnit(`debris-ring-chunk-rx#${fieldId}#${i}`) * Math.PI,
          hashToUnit(`debris-ring-chunk-ry#${fieldId}#${i}`) * Math.PI,
          hashToUnit(`debris-ring-chunk-rz#${fieldId}#${i}`) * Math.PI,
        ],
        brightness,
      })
    }
    return out
  }, [fieldId, chunkCount, props.innerRadius, radialThickness, startRad, halfSpanRad, verticalThickness, meanRadius, bandCenters, bandCount])

  const useTorus = props.spanDeg >= 359.5 && Math.abs(props.inclinationDeg - 90) < 0.5
  void useTorus // currently unused; reserved for future torus-fill polish
  void TWO_PI

  return (
    <group rotation={[Math.PI / 2 - inclinationRad, 0, 0]}>
      <points geometry={dustGeometry} material={dustMaterial} renderOrder={2} raycast={() => undefined} />
      <DebrisChunks fieldId={fieldId} count={chunkCount} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
