'use client'

import { useMemo } from 'react'
import { hashToUnit } from '../../lib/motion'
import { DustBillboards, type DustBillboard } from './dustBillboards'
import { DebrisChunks, type ChunkPlacement } from './debrisChunks'
import { hexToHsl, jitteredTint } from './tintUtils'

interface DebrisFieldShellProps {
  fieldId?: string
  innerRadius: number
  outerRadius: number
  particleCount: number
  opacity: number
  color: string
  chunkCount?: number
  qualityScale?: number
}

export function DebrisFieldShell(props: DebrisFieldShellProps) {
  const fieldId = props.fieldId ?? `shell-${props.innerRadius}-${props.outerRadius}`
  const quality = props.qualityScale ?? 1
  const dustCount = Math.max(0, Math.round(props.particleCount * quality))
  const defaultChunks = Math.min(15, dustCount * 0.04)
  const chunkCount = Math.max(6, Math.round((props.chunkCount ?? defaultChunks) * quality))
  const meanRadius = (props.outerRadius + props.innerRadius) * 0.5
  const baseSize = Math.max(0.7, meanRadius * 0.065)
  const baseHsl = useMemo(() => hexToHsl(props.color), [props.color])

  const billboards = useMemo<DustBillboard[]>(() => {
    const out: DustBillboard[] = []
    for (let i = 0; i < dustCount; i++) {
      const u = hashToUnit(`debris-shell-u#${fieldId}#${i}`)
      const v = hashToUnit(`debris-shell-v#${fieldId}#${i}`)
      const w = hashToUnit(`debris-shell-w#${fieldId}#${i}`)
      const rT = Math.pow(u, 0.7)
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * rT
      const theta = Math.acos(2 * v - 1)
      const phi = 2 * Math.PI * w
      const sizeMul = 0.35 + Math.pow(hashToUnit(`debris-shell-size#${fieldId}#${i}`), 3.2) * 4.0
      out.push({
        position: [r * Math.sin(theta) * Math.cos(phi), r * Math.cos(theta), r * Math.sin(theta) * Math.sin(phi)],
        scale: baseSize * sizeMul,
        rotation: hashToUnit(`debris-shell-rot#${fieldId}#${i}`) * Math.PI * 2,
        tint: jitteredTint(`debris-shell-tint#${fieldId}#${i}`, baseHsl),
        spriteIndex: Math.floor(hashToUnit(`debris-shell-sprite#${fieldId}#${i}`) * 4),
      })
    }
    return out
  }, [fieldId, dustCount, props.innerRadius, props.outerRadius, baseSize, baseHsl])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    const out: ChunkPlacement[] = []
    for (let i = 0; i < chunkCount; i++) {
      const u = hashToUnit(`debris-shell-chunk-u#${fieldId}#${i}`)
      const v = hashToUnit(`debris-shell-chunk-v#${fieldId}#${i}`)
      const w = hashToUnit(`debris-shell-chunk-w#${fieldId}#${i}`)
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * u
      const theta = Math.acos(2 * v - 1)
      const phi = 2 * Math.PI * w
      const isHero = i < Math.min(3, Math.max(1, Math.round(chunkCount * 0.1)))
      const sizeMul = isHero
        ? 5 + hashToUnit(`debris-shell-hero-size#${fieldId}#${i}`) * 5
        : 0.5 + Math.pow(hashToUnit(`debris-shell-chunk-size#${fieldId}#${i}`), 2.4) * 1.6
      const chunkSize = sizeMul * Math.max(0.6, meanRadius * 0.11)
      const brightness = 0.55 + hashToUnit(`debris-shell-chunk-bright#${fieldId}#${i}`) * 0.55
      out.push({
        position: [r * Math.sin(theta) * Math.cos(phi), r * Math.cos(theta), r * Math.sin(theta) * Math.sin(phi)],
        scale: chunkSize,
        rotation: [
          hashToUnit(`debris-shell-chunk-rx#${fieldId}#${i}`) * Math.PI * 2,
          hashToUnit(`debris-shell-chunk-ry#${fieldId}#${i}`) * Math.PI * 2,
          hashToUnit(`debris-shell-chunk-rz#${fieldId}#${i}`) * Math.PI * 2,
        ],
        brightness,
        stretch: [
          0.55 + hashToUnit(`debris-shell-chunk-sx#${fieldId}#${i}`) * 0.95,
          0.5 + hashToUnit(`debris-shell-chunk-sy#${fieldId}#${i}`) * 0.85,
          0.55 + hashToUnit(`debris-shell-chunk-sz#${fieldId}#${i}`) * 1.05,
        ],
      })
    }
    return out
  }, [fieldId, chunkCount, props.innerRadius, props.outerRadius, meanRadius])

  return (
    <group>
      <DustBillboards fieldId={fieldId} color={props.color} opacity={Math.min(1, props.opacity * 0.85)} billboards={billboards} />
      <DebrisChunks fieldId={fieldId} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
