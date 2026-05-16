'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { hashToUnit } from '../../lib/motion'
import { getHazeRingMaterial } from './dustMaterial'
import { DustBillboards, type DustBillboard } from './dustBillboards'
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

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = new THREE.Color().setHSL(h, s, l)
  return [c.r, c.g, c.b]
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const c = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  return hsl
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
  const spanRad = halfSpanRad * 2
  const radialThickness = Math.max(0.0001, props.outerRadius - props.innerRadius)
  const meanRadius = (props.outerRadius + props.innerRadius) * 0.5
  // Thicker disk so off-plane particles read at oblique camera angles.
  const verticalThickness = Math.max(radialThickness * 0.18, meanRadius * 0.1)

  const baseSize = Math.max(0.7, meanRadius * 0.06)
  const baseHsl = useMemo(() => hexToHsl(props.color), [props.color])

  const clusterCount = 8 + Math.floor(hashToUnit(`debris-clusters#${fieldId}`) * 5)
  const clusters = useMemo(() => {
    const out: Array<{ turn: number; radialT: number; width: number; height: number }> = []
    for (let i = 0; i < clusterCount; i++) {
      const slot = i / clusterCount
      const jitter = (hashToUnit(`debris-cluster-jitter#${fieldId}#${i}`) - 0.5) * (0.6 / clusterCount)
      out.push({
        turn: ((slot + jitter) % 1 + 1) % 1,
        radialT: 0.25 + hashToUnit(`debris-cluster-r#${fieldId}#${i}`) * 0.5,
        width: 0.05 + hashToUnit(`debris-cluster-w#${fieldId}#${i}`) * 0.08,
        height: 0.18 + hashToUnit(`debris-cluster-h#${fieldId}#${i}`) * 0.22,
      })
    }
    return out
  }, [fieldId, clusterCount])

  const billboards = useMemo<DustBillboard[]>(() => {
    const out: DustBillboard[] = []
    for (let i = 0; i < dustCount; i++) {
      const inCluster = hashToUnit(`debris-dust-cluster-roll#${fieldId}#${i}`) < 0.55
      let turn: number
      let radialT: number
      if (inCluster) {
        const cIdx = Math.floor(hashToUnit(`debris-dust-cluster-idx#${fieldId}#${i}`) * clusterCount)
        const c = clusters[cIdx]
        const offT = (hashToUnit(`debris-dust-cluster-offt#${fieldId}#${i}`) - 0.5) * c.width
        const offR = (hashToUnit(`debris-dust-cluster-offr#${fieldId}#${i}`) - 0.5) * c.height
        turn = ((c.turn + offT) % 1 + 1) % 1
        radialT = Math.min(0.98, Math.max(0.02, c.radialT + offR))
      } else {
        turn = hashToUnit(`debris-dust-loose-t#${fieldId}#${i}`)
        radialT = 0.1 + hashToUnit(`debris-dust-loose-r#${fieldId}#${i}`) * 0.8
      }
      const angle = startRad + turn * spanRad
      const r = props.innerRadius + radialT * radialThickness
      // Lens-shaped vertical: thicker at midradius, taper at edges.
      const vertEnvelope = Math.pow(Math.sin(radialT * Math.PI), 0.7)
      const yJitter = (hashToUnit(`debris-dust-y#${fieldId}#${i}`) - 0.5) * verticalThickness * 2 * vertEnvelope
      // Heavy-tail size: most small, occasional much larger.
      const sizeRoll = hashToUnit(`debris-dust-size#${fieldId}#${i}`)
      const sizeMul = 0.35 + Math.pow(sizeRoll, 3.5) * 5.0
      // HSL-jittered tint: hue rotates ±22° around base, sat fluctuates, lightness varies.
      const hShift = (hashToUnit(`debris-dust-h#${fieldId}#${i}`) - 0.5) * 0.12
      const sShift = (hashToUnit(`debris-dust-s#${fieldId}#${i}`) - 0.5) * 0.4
      const lShift = (hashToUnit(`debris-dust-l#${fieldId}#${i}`) - 0.5) * 0.5
      const tint = hslToRgb(
        ((baseHsl.h + hShift) % 1 + 1) % 1,
        Math.min(1, Math.max(0, baseHsl.s + sShift)),
        Math.min(0.95, Math.max(0.15, baseHsl.l + lShift)),
      )
      // Normalize tint relative to base color so uBaseColor*vTint stays in range.
      const baseLum = baseHsl.l + 0.001
      const tintMul: [number, number, number] = [tint[0] / baseLum * 0.8, tint[1] / baseLum * 0.8, tint[2] / baseLum * 0.8]
      out.push({
        position: [Math.cos(angle) * r, yJitter, Math.sin(angle) * r],
        scale: baseSize * sizeMul,
        rotation: hashToUnit(`debris-dust-rot#${fieldId}#${i}`) * Math.PI * 2,
        tint: tintMul,
        spriteIndex: Math.floor(hashToUnit(`debris-dust-sprite#${fieldId}#${i}`) * 4),
      })
    }
    return out
  }, [fieldId, dustCount, props.innerRadius, radialThickness, startRad, spanRad, verticalThickness, baseSize, clusters, clusterCount, baseHsl])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    const out: ChunkPlacement[] = []
    for (let i = 0; i < chunkCount; i++) {
      const inCluster = hashToUnit(`debris-chunk-cluster-roll#${fieldId}#${i}`) < 0.7
      let turn: number
      let radialT: number
      if (inCluster) {
        const cIdx = Math.floor(hashToUnit(`debris-chunk-cluster-idx#${fieldId}#${i}`) * clusterCount)
        const c = clusters[cIdx]
        turn = ((c.turn + (hashToUnit(`debris-chunk-cluster-offt#${fieldId}#${i}`) - 0.5) * c.width * 1.4) % 1 + 1) % 1
        radialT = Math.min(0.95, Math.max(0.05, c.radialT + (hashToUnit(`debris-chunk-cluster-offr#${fieldId}#${i}`) - 0.5) * c.height * 1.4))
      } else {
        turn = hashToUnit(`debris-chunk-loose-t#${fieldId}#${i}`)
        radialT = 0.1 + hashToUnit(`debris-chunk-loose-r#${fieldId}#${i}`) * 0.8
      }
      const angle = startRad + turn * spanRad
      const r = props.innerRadius + radialT * radialThickness
      const yJitter = (hashToUnit(`debris-chunk-y#${fieldId}#${i}`) - 0.5) * verticalThickness * 3.0
      // Power-law scale with rare large outliers.
      const sizeRoll = hashToUnit(`debris-chunk-size#${fieldId}#${i}`)
      const isHero = i < Math.min(4, Math.max(1, Math.round(chunkCount * 0.08)))
      const sizeMul = isHero
        ? 6 + hashToUnit(`debris-chunk-hero-size#${fieldId}#${i}`) * 6
        : 0.5 + Math.pow(sizeRoll, 2.6) * 2.4
      const chunkSize = sizeMul * Math.max(0.6, meanRadius * 0.11)
      const brightness = 0.5 + hashToUnit(`debris-chunk-bright#${fieldId}#${i}`) * 0.6
      out.push({
        position: [Math.cos(angle) * r, yJitter, Math.sin(angle) * r],
        scale: chunkSize,
        rotation: [
          hashToUnit(`debris-chunk-rx#${fieldId}#${i}`) * Math.PI * 2,
          hashToUnit(`debris-chunk-ry#${fieldId}#${i}`) * Math.PI * 2,
          hashToUnit(`debris-chunk-rz#${fieldId}#${i}`) * Math.PI * 2,
        ],
        brightness,
        stretch: [
          0.6 + hashToUnit(`debris-chunk-sx#${fieldId}#${i}`) * 0.9,
          0.5 + hashToUnit(`debris-chunk-sy#${fieldId}#${i}`) * 0.8,
          0.55 + hashToUnit(`debris-chunk-sz#${fieldId}#${i}`) * 1.0,
        ],
      })
    }
    return out
  }, [fieldId, chunkCount, props.innerRadius, radialThickness, startRad, spanRad, verticalThickness, meanRadius, clusters, clusterCount])

  const hazeGeometry = useMemo(
    () => new THREE.RingGeometry(props.innerRadius * 0.9, props.outerRadius * 1.1, 96, 1),
    [props.innerRadius, props.outerRadius],
  )

  useEffect(() => () => { hazeGeometry.dispose() }, [hazeGeometry])

  const hazeMaterial = useMemo(() => getHazeRingMaterial({
    color: props.color,
    opacity: Math.min(0.8, Math.max(0.25, props.opacity * 0.9)),
    innerRadius: props.innerRadius * 0.9,
    outerRadius: props.outerRadius * 1.1,
    seed: hashToUnit(`debris-haze-seed#${fieldId}`) * 1000,
  }), [props.color, props.opacity, props.innerRadius, props.outerRadius, fieldId])

  useEffect(() => () => { hazeMaterial.dispose() }, [hazeMaterial])

  return (
    <group rotation={[Math.PI / 2 - inclinationRad, 0, 0]}>
      <mesh geometry={hazeGeometry} material={hazeMaterial} renderOrder={1} raycast={() => undefined} />
      <DustBillboards fieldId={fieldId} color={props.color} opacity={Math.min(1, props.opacity * 0.95)} billboards={billboards} />
      <DebrisChunks fieldId={fieldId} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
