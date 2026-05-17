'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { DustBillboards, type DustBillboard } from './dustBillboards'
import { DebrisChunks, type ChunkPlacement } from './debrisChunks'
import { hexToHsl, jitteredTint } from './tintUtils'
import { defaultDebrisVisualProfile, type DebrisVisualProfile } from './debrisVisualProfile'
import { sampleStreamChunks, sampleStreamDust } from './fieldSampling'
import { debrisChunkBudget } from './chunkBudget'

interface DebrisFieldStreamProps {
  fieldId?: string
  startRadius: number
  endRadius: number
  centerAngleDeg: number
  opacity: number
  color: string
  dustCount?: number
  chunkCount?: number
  qualityScale?: number
  profile?: DebrisVisualProfile
}

const DEFAULT_STREAM_PROFILE = defaultDebrisVisualProfile('mass-transfer-stream', 'stream')

export function DebrisFieldStream(props: DebrisFieldStreamProps) {
  const fieldId = props.fieldId ?? `stream-${props.centerAngleDeg}-${props.startRadius}`
  const quality = props.qualityScale ?? 1
  const profile = props.profile ?? DEFAULT_STREAM_PROFILE
  const dustCount = Math.max(0, Math.round((props.dustCount ?? Math.round(230 * (0.75 + profile.clumpiness * 0.45))) * quality))
  const chunkCount = debrisChunkBudget({ kind: 'stream', profile, qualityScale: quality, explicitCount: props.chunkCount })
  const angleRad = props.centerAngleDeg * Math.PI / 180
  const length = Math.max(0.0001, Math.abs(props.endRadius - props.startRadius))
  const sheathRadius = Math.max(0.4, length * 0.08)
  const baseSize = Math.max(0.04, sheathRadius * 0.12)
  const baseHsl = useMemo(() => hexToHsl(props.color), [props.color])

  const streamLine = useMemo(() => {
    const segments = 12
    const positions = new Float32Array((segments + 1) * 3)
    const colors = new Float32Array((segments + 1) * 3)
    const colorHot = new THREE.Color('#ffe6aa')
    const colorCool = new THREE.Color(props.color)
    const scratch = new THREE.Color()
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const r = props.startRadius + (props.endRadius - props.startRadius) * t
      positions[i * 3] = r * Math.cos(angleRad)
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = r * Math.sin(angleRad)
      scratch.copy(colorCool).lerp(colorHot, 1 - t)
      colors[i * 3] = scratch.r
      colors[i * 3 + 1] = scratch.g
      colors[i * 3 + 2] = scratch.b
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: props.opacity })
    return new THREE.Line(g, material)
  }, [props.startRadius, props.endRadius, props.color, props.opacity, angleRad])

  useEffect(() => () => {
    streamLine.geometry.dispose()
    const mat = streamLine.material as THREE.Material | THREE.Material[]
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
    else mat.dispose()
  }, [streamLine])

  const billboards = useMemo<DustBillboard[]>(() => {
    return sampleStreamDust({
      fieldId,
      count: dustCount,
      startRadius: props.startRadius,
      endRadius: props.endRadius,
      angleRad,
      sheathRadius,
      profile,
      kind: 'dust',
    }).map((sample, i) => {
      const tint = jitteredTint(`debris-stream-tint#${fieldId}#${i}`, baseHsl)
      return {
        position: sample.position,
        scale: baseSize * sample.sizeMul,
        rotation: sample.rotation,
        tint: [tint[0] * sample.tintHeat, tint[1] * sample.tintHeat, tint[2] * sample.tintHeat],
        opacity: sample.opacity,
        aspect: sample.aspect,
        spriteIndex: sample.spriteIndex,
      }
    })
  }, [fieldId, dustCount, props.startRadius, props.endRadius, angleRad, sheathRadius, baseSize, baseHsl, profile])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    return sampleStreamChunks({
      fieldId,
      count: chunkCount,
      startRadius: props.startRadius,
      endRadius: props.endRadius,
      angleRad,
      sheathRadius,
      profile,
      kind: 'chunk',
    }).map((sample) => ({
      position: sample.position,
      scale: sample.sizeMul * Math.max(0.18, sheathRadius * 0.2),
      rotation: sample.rotation,
      brightness: sample.brightness,
      stretch: sample.stretch,
    }))
  }, [fieldId, chunkCount, props.startRadius, props.endRadius, angleRad, sheathRadius, profile])

  return (
    <group>
      <primitive object={streamLine} />
      <DustBillboards fieldId={fieldId} color={props.color} opacity={Math.min(0.48, props.opacity)} billboards={billboards} />
      <DebrisChunks fieldId={fieldId} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
