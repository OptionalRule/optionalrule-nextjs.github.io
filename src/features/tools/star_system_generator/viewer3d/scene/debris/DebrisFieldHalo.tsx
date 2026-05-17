'use client'

import { useMemo } from 'react'
import { DustBillboards, type DustBillboard } from './dustBillboards'
import { DebrisChunks, type ChunkPlacement } from './debrisChunks'
import { hexToHsl, jitteredTint } from './tintUtils'
import { defaultDebrisVisualProfile, type DebrisVisualProfile } from './debrisVisualProfile'
import { sampleVolumeChunks, sampleVolumeDust } from './fieldSampling'
import { DebrisVolumeFog } from './DebrisVolumeFog'
import { debrisChunkBudget } from './chunkBudget'

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
  profile?: DebrisVisualProfile
}

const DEFAULT_HALO_PROFILE = defaultDebrisVisualProfile('kozai-scattered-halo', 'sparse')

export function DebrisFieldHalo(props: DebrisFieldHaloProps) {
  const fieldId = props.fieldId ?? `halo-${props.innerRadius}-${props.outerRadius}`
  const quality = props.qualityScale ?? 1
  const profile = props.profile ?? DEFAULT_HALO_PROFILE
  const dustCount = Math.max(0, Math.round(props.particleCount * (0.75 + profile.clumpiness * 0.65) * quality))
  const chunkCount = debrisChunkBudget({ kind: 'halo', profile, qualityScale: quality, explicitCount: props.chunkCount })
  const maxTiltRad = props.inclinationDeg * Math.PI / 180
  const meanRadius = (props.outerRadius + props.innerRadius) * 0.5
  const baseSize = Math.max(0.035, meanRadius * 0.006)
  const baseHsl = useMemo(() => hexToHsl(props.color), [props.color])
  const flattenY = Math.max(0.35, Math.min(1, Math.sin(Math.max(maxTiltRad, Math.PI / 10)) * 0.95))

  const billboards = useMemo<DustBillboard[]>(() => {
    return sampleVolumeDust({
      fieldId,
      count: dustCount,
      innerRadius: props.innerRadius,
      outerRadius: props.outerRadius,
      maxTiltRad,
      profile,
      kind: 'dust',
    }).map((sample, i) => {
      const tint = jitteredTint(`debris-halo-tint#${fieldId}#${i}`, baseHsl)
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
  }, [fieldId, dustCount, props.innerRadius, props.outerRadius, maxTiltRad, baseSize, baseHsl, profile])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    return sampleVolumeChunks({
      fieldId,
      count: chunkCount,
      innerRadius: props.innerRadius,
      outerRadius: props.outerRadius,
      maxTiltRad,
      profile,
      kind: 'chunk',
    }).map((sample) => ({
      position: sample.position,
      scale: sample.sizeMul * Math.max(0.3, meanRadius * 0.045),
      rotation: sample.rotation,
      brightness: sample.brightness,
      stretch: sample.stretch,
    }))
  }, [fieldId, chunkCount, props.innerRadius, props.outerRadius, maxTiltRad, meanRadius, profile])

  return (
    <group>
      <DebrisVolumeFog
        fieldId={fieldId}
        mode="shell"
        innerRadius={props.innerRadius * 0.9}
        outerRadius={props.outerRadius * 1.08}
        opacity={Math.min(0.32, props.opacity * profile.hazeOpacity)}
        color={props.color}
        profile={profile}
        qualityScale={quality}
        flattenY={flattenY}
      />
      <DustBillboards fieldId={fieldId} color={props.color} opacity={Math.min(0.46, props.opacity)} billboards={billboards} />
      <DebrisChunks fieldId={fieldId} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
