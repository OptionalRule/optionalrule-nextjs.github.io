'use client'

import { useMemo } from 'react'
import { hashToUnit } from '../../lib/motion'
import { DustBillboards, type DustBillboard } from './dustBillboards'
import { DebrisChunks, type ChunkPlacement } from './debrisChunks'
import { hexToHsl, jitteredTint } from './tintUtils'

interface DebrisFieldHaloProps {
  fieldId?: string
  innerRadius: number
  outerRadius: number
  inclinationDeg: number
  particleCount: number
  opacity: number
  color: string
  chunkCount?: number
  qualityScale?: number
}

export function DebrisFieldHalo(props: DebrisFieldHaloProps) {
  const fieldId = props.fieldId ?? `halo-${props.innerRadius}-${props.outerRadius}`
  const quality = props.qualityScale ?? 1
  const dustCount = Math.max(0, Math.round(props.particleCount * quality))
  const defaultChunks = Math.min(40, dustCount * 0.06)
  const chunkCount = Math.max(6, Math.round((props.chunkCount ?? defaultChunks) * quality))
  const maxTiltRad = props.inclinationDeg * Math.PI / 180
  const meanRadius = (props.outerRadius + props.innerRadius) * 0.5
  const baseSize = Math.max(0.6, meanRadius * 0.05)
  const baseHsl = useMemo(() => hexToHsl(props.color), [props.color])

  const billboards = useMemo<DustBillboard[]>(() => {
    const out: DustBillboard[] = []
    for (let i = 0; i < dustCount; i++) {
      const u = hashToUnit(`debris-halo-u#${fieldId}#${i}`)
      const v = hashToUnit(`debris-halo-v#${fieldId}#${i}`)
      const w = hashToUnit(`debris-halo-w#${fieldId}#${i}`)
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * Math.pow(u, 0.8)
      const phi = 2 * Math.PI * v
      const tilt = (w - 0.5) * 2 * maxTiltRad
      const sizeMul = 0.35 + Math.pow(hashToUnit(`debris-halo-size#${fieldId}#${i}`), 3.2) * 4.0
      out.push({
        position: [
          r * Math.cos(phi) * Math.cos(tilt),
          r * Math.sin(tilt),
          r * Math.sin(phi) * Math.cos(tilt),
        ],
        scale: baseSize * sizeMul,
        rotation: hashToUnit(`debris-halo-rot#${fieldId}#${i}`) * Math.PI * 2,
        tint: jitteredTint(`debris-halo-tint#${fieldId}#${i}`, baseHsl),
        spriteIndex: Math.floor(hashToUnit(`debris-halo-sprite#${fieldId}#${i}`) * 4),
      })
    }
    return out
  }, [fieldId, dustCount, props.innerRadius, props.outerRadius, maxTiltRad, baseSize, baseHsl])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    const out: ChunkPlacement[] = []
    for (let i = 0; i < chunkCount; i++) {
      const u = hashToUnit(`debris-halo-chunk-u#${fieldId}#${i}`)
      const v = hashToUnit(`debris-halo-chunk-v#${fieldId}#${i}`)
      const w = hashToUnit(`debris-halo-chunk-w#${fieldId}#${i}`)
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * u
      const phi = 2 * Math.PI * v
      const tilt = (w - 0.5) * 2 * maxTiltRad
      const isHero = i < Math.min(3, Math.max(1, Math.round(chunkCount * 0.08)))
      const sizeMul = isHero
        ? 5 + hashToUnit(`debris-halo-hero-size#${fieldId}#${i}`) * 5
        : 0.5 + Math.pow(hashToUnit(`debris-halo-chunk-size#${fieldId}#${i}`), 2.4) * 1.6
      const chunkSize = sizeMul * Math.max(0.6, meanRadius * 0.11)
      const brightness = 0.55 + hashToUnit(`debris-halo-chunk-bright#${fieldId}#${i}`) * 0.55
      out.push({
        position: [
          r * Math.cos(phi) * Math.cos(tilt),
          r * Math.sin(tilt),
          r * Math.sin(phi) * Math.cos(tilt),
        ],
        scale: chunkSize,
        rotation: [
          hashToUnit(`debris-halo-chunk-rx#${fieldId}#${i}`) * Math.PI * 2,
          hashToUnit(`debris-halo-chunk-ry#${fieldId}#${i}`) * Math.PI * 2,
          hashToUnit(`debris-halo-chunk-rz#${fieldId}#${i}`) * Math.PI * 2,
        ],
        brightness,
        stretch: [
          0.55 + hashToUnit(`debris-halo-chunk-sx#${fieldId}#${i}`) * 0.95,
          0.5 + hashToUnit(`debris-halo-chunk-sy#${fieldId}#${i}`) * 0.85,
          0.55 + hashToUnit(`debris-halo-chunk-sz#${fieldId}#${i}`) * 1.05,
        ],
      })
    }
    return out
  }, [fieldId, chunkCount, props.innerRadius, props.outerRadius, maxTiltRad, meanRadius])

  return (
    <group>
      <DustBillboards fieldId={fieldId} color={props.color} opacity={Math.min(1, props.opacity * 0.8)} billboards={billboards} />
      <DebrisChunks fieldId={fieldId} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
