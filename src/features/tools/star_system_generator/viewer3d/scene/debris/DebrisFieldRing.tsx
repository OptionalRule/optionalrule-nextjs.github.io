'use client'

import { useEffect, useMemo } from 'react'
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
  qualityScale?: number
}

export function DebrisFieldRing(props: DebrisFieldRingProps) {
  const fieldId = props.fieldId ?? `ring-${props.centerAngleDeg}-${props.innerRadius}`
  const quality = props.qualityScale ?? 1
  const dustCount = Math.max(0, Math.round((props.dustCount ?? 600) * quality))
  const chunkCount = Math.max(6, Math.round((props.chunkCount ?? 40) * quality))
  const inclinationRad = props.inclinationDeg * Math.PI / 180

  const centerRad = props.centerAngleDeg * Math.PI / 180
  const halfSpanRad = (props.spanDeg / 2) * Math.PI / 180
  const startRad = centerRad - halfSpanRad
  const radialThickness = Math.max(0.0001, props.outerRadius - props.innerRadius)
  const meanRadius = (props.outerRadius + props.innerRadius) * 0.5
  const verticalThickness = Math.max(radialThickness * 0.18, meanRadius * 0.025)

  const { bandCount, bandCenters } = useMemo(() => {
    const count = 3 + Math.floor(hashToUnit(`debris-bands#${fieldId}`) * 3)
    const centers = Array.from({ length: count }, (_, idx) => {
      const slot = (idx + 0.5) / count
      const jitter = (hashToUnit(`debris-band-slot#${fieldId}#${idx}`) - 0.5) * (0.5 / count)
      return Math.min(0.95, Math.max(0.05, slot + jitter))
    })
    return { bandCount: count, bandCenters: centers }
  }, [fieldId])

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

  useEffect(() => () => { dustGeometry.dispose() }, [dustGeometry])

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

  return (
    <group rotation={[Math.PI / 2 - inclinationRad, 0, 0]}>
      <points geometry={dustGeometry} material={dustMaterial} renderOrder={2} raycast={() => undefined} />
      <DebrisChunks fieldId={fieldId} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
