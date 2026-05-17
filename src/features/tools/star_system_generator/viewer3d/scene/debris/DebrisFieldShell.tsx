'use client'

import { useMemo } from 'react'
import { DustBillboards, type DustBillboard } from './dustBillboards'
import { DebrisChunks, type ChunkPlacement } from './debrisChunks'
import { hexToHsl, jitteredTint } from './tintUtils'
import { defaultDebrisVisualProfile, type DebrisVisualProfile } from './debrisVisualProfile'
import { sampleVolumeChunks, sampleVolumeDust } from './fieldSampling'
import { DebrisVolumeFog } from './DebrisVolumeFog'
import { debrisChunkBudget } from './chunkBudget'

interface DebrisFieldShellProps {
  fieldId?: string
  innerRadius: number
  outerRadius: number
  particleCount: number
  opacity: number
  color: string
  chunkCount?: number
  qualityScale?: number
  profile?: DebrisVisualProfile
}

const DEFAULT_SHELL_PROFILE = defaultDebrisVisualProfile('common-envelope-shell', 'shell-dense')

export function DebrisFieldShell(props: DebrisFieldShellProps) {
  const fieldId = props.fieldId ?? `shell-${props.innerRadius}-${props.outerRadius}`
  const quality = props.qualityScale ?? 1
  const profile = props.profile ?? DEFAULT_SHELL_PROFILE
  const dustCount = Math.max(0, Math.round(props.particleCount * (0.8 + profile.clumpiness * 0.6) * quality))
  const chunkCount = debrisChunkBudget({ kind: 'shell', profile, qualityScale: quality, explicitCount: props.chunkCount })
  const meanRadius = (props.outerRadius + props.innerRadius) * 0.5
  const baseSize = Math.max(0.035, meanRadius * 0.0065)
  const baseHsl = useMemo(() => hexToHsl(props.color), [props.color])

  const billboards = useMemo<DustBillboard[]>(() => {
    return sampleVolumeDust({
      fieldId,
      count: dustCount,
      innerRadius: props.innerRadius,
      outerRadius: props.outerRadius,
      profile,
      kind: 'dust',
      shell: true,
    }).map((sample, i) => {
      const tint = jitteredTint(`debris-shell-tint#${fieldId}#${i}`, baseHsl)
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
  }, [fieldId, dustCount, props.innerRadius, props.outerRadius, baseSize, baseHsl, profile])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    return sampleVolumeChunks({
      fieldId,
      count: chunkCount,
      innerRadius: props.innerRadius,
      outerRadius: props.outerRadius,
      profile,
      kind: 'chunk',
      shell: true,
    }).map((sample) => ({
      position: sample.position,
      scale: sample.sizeMul * Math.max(0.34, meanRadius * 0.05),
      rotation: sample.rotation,
      brightness: sample.brightness,
      stretch: sample.stretch,
    }))
  }, [fieldId, chunkCount, props.innerRadius, props.outerRadius, meanRadius, profile])

  return (
    <group>
      <DebrisVolumeFog
        fieldId={fieldId}
        mode="shell"
        innerRadius={props.innerRadius * 0.88}
        outerRadius={props.outerRadius * 1.12}
        opacity={Math.min(0.36, props.opacity * profile.hazeOpacity)}
        color={props.color}
        profile={profile}
        qualityScale={quality}
        flattenY={1}
      />
      <DustBillboards fieldId={fieldId} color={props.color} opacity={Math.min(0.48, props.opacity)} billboards={billboards} />
      <DebrisChunks fieldId={fieldId} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
