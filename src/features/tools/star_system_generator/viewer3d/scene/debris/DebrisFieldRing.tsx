'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { hashToUnit } from '../../lib/motion'
import { getDustMaterial, getHazeRingMaterial } from './dustMaterial'
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

function jitterTint(seed: string): [number, number, number] {
  const r = 0.78 + hashToUnit(`${seed}-r`) * 0.44
  const g = 0.78 + hashToUnit(`${seed}-g`) * 0.44
  const b = 0.78 + hashToUnit(`${seed}-b`) * 0.44
  return [r, g, b]
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
  const verticalThickness = Math.max(radialThickness * 0.22, meanRadius * 0.03)

  const baseSize = Math.max(0.55, meanRadius * 0.04)

  const dustGeometry = useMemo(() => {
    const positions = new Float32Array(dustCount * 3)
    const sizes = new Float32Array(dustCount)
    const tints = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const turn = hashToUnit(`debris-ring-turn#${fieldId}#${i}`)
      const angle = startRad + turn * (halfSpanRad * 2)
      // Power-biased radial position: t close to 0.5 is most likely (midline density),
      // but the curve is wide enough that there's no visible "band".
      const radialRoll = hashToUnit(`debris-ring-r#${fieldId}#${i}`)
      const radialBias = (radialRoll - 0.5) * 2  // [-1, 1]
      const radialT = 0.5 + Math.sign(radialBias) * Math.pow(Math.abs(radialBias), 1.6) * 0.5
      // Clump multiplier: layered noise via sin combos for organic patchiness.
      const clumpA = Math.sin(turn * Math.PI * 8 + hashToUnit(`debris-ring-cs1#${fieldId}`) * 6.28)
      const clumpB = Math.sin(turn * Math.PI * 19 + hashToUnit(`debris-ring-cs2#${fieldId}`) * 6.28)
      const clumpC = Math.sin(turn * Math.PI * 3 + hashToUnit(`debris-ring-cs3#${fieldId}`) * 6.28)
      const clump = (clumpA * 0.5 + clumpB * 0.3 + clumpC * 0.2 + 1) * 0.5
      // Skip particle probabilistically based on clump value to create real density gaps.
      const skipRoll = hashToUnit(`debris-ring-skip#${fieldId}#${i}`)
      const radialScatter = (hashToUnit(`debris-ring-scatter#${fieldId}#${i}`) - 0.5) * 0.18
      const finalRadialT = Math.min(1, Math.max(0, radialT + radialScatter))
      const r = props.innerRadius + finalRadialT * radialThickness
      const yJitter = (hashToUnit(`debris-ring-y#${fieldId}#${i}`) - 0.5) * verticalThickness * 2
      const yShape = Math.pow(1 - Math.abs(yJitter / verticalThickness), 0.8)
      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = yJitter
      positions[i * 3 + 2] = Math.sin(angle) * r
      // Per-particle size: heavy tail. Most small, occasional larger blobs.
      const sizeRoll = hashToUnit(`debris-ring-size#${fieldId}#${i}`)
      const sizeMultiplier = 0.35 + Math.pow(sizeRoll, 3.2) * 2.4
      sizes[i] = baseSize * sizeMultiplier * clump * (skipRoll < clump * 0.85 ? yShape : 0)
      const [tr, tg, tb] = jitterTint(`debris-ring-tint#${fieldId}#${i}`)
      const brightness = 0.6 + clump * 0.6
      tints[i * 3] = tr * brightness
      tints[i * 3 + 1] = tg * brightness
      tints[i * 3 + 2] = tb * brightness
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    g.setAttribute('aTint', new THREE.BufferAttribute(tints, 3))
    return g
  }, [fieldId, dustCount, props.innerRadius, radialThickness, startRad, halfSpanRad, verticalThickness, baseSize])

  useEffect(() => () => { dustGeometry.dispose() }, [dustGeometry])

  const dustMaterial = useMemo(() => getDustMaterial({
    color: props.color,
    opacity: Math.min(1, props.opacity * 0.9),
  }), [props.color, props.opacity])

  const hazeGeometry = useMemo(
    () => new THREE.RingGeometry(props.innerRadius * 0.95, props.outerRadius * 1.05, 96, 1),
    [props.innerRadius, props.outerRadius],
  )

  useEffect(() => () => { hazeGeometry.dispose() }, [hazeGeometry])

  const hazeMaterial = useMemo(() => getHazeRingMaterial({
    color: props.color,
    opacity: Math.min(0.35, props.opacity * 0.45),
    innerRadius: props.innerRadius * 0.95,
    outerRadius: props.outerRadius * 1.05,
    seed: hashToUnit(`debris-haze-seed#${fieldId}`) * 1000,
  }), [props.color, props.opacity, props.innerRadius, props.outerRadius, fieldId])

  useEffect(() => () => { hazeMaterial.dispose() }, [hazeMaterial])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    const out: ChunkPlacement[] = []
    for (let i = 0; i < chunkCount; i++) {
      const turn = hashToUnit(`debris-ring-chunk-turn#${fieldId}#${i}`)
      const angle = startRad + turn * (halfSpanRad * 2)
      const radialT = 0.15 + hashToUnit(`debris-ring-chunk-r#${fieldId}#${i}`) * 0.7
      const r = props.innerRadius + radialT * radialThickness
      const yJitter = (hashToUnit(`debris-ring-chunk-y#${fieldId}#${i}`) - 0.5) * verticalThickness * 1.1
      const chunkSize = (0.45 + Math.pow(hashToUnit(`debris-ring-chunk-size#${fieldId}#${i}`), 2.4) * 1.6)
        * Math.max(0.65, meanRadius * 0.12)
      const brightness = 0.55 + hashToUnit(`debris-ring-chunk-bright#${fieldId}#${i}`) * 0.55
      out.push({
        position: [Math.cos(angle) * r, yJitter, Math.sin(angle) * r],
        scale: chunkSize,
        rotation: [
          hashToUnit(`debris-ring-chunk-rx#${fieldId}#${i}`) * Math.PI,
          hashToUnit(`debris-ring-chunk-ry#${fieldId}#${i}`) * Math.PI,
          hashToUnit(`debris-ring-chunk-rz#${fieldId}#${i}`) * Math.PI,
        ],
        brightness,
      })
    }
    return out
  }, [fieldId, chunkCount, props.innerRadius, radialThickness, startRad, halfSpanRad, verticalThickness, meanRadius])

  return (
    <group rotation={[Math.PI / 2 - inclinationRad, 0, 0]}>
      <mesh geometry={hazeGeometry} material={hazeMaterial} renderOrder={1} raycast={() => undefined} />
      <points geometry={dustGeometry} material={dustMaterial} renderOrder={2} raycast={() => undefined} />
      <DebrisChunks fieldId={fieldId} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
