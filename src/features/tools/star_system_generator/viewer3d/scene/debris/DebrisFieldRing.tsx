'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { hashToUnit } from '../../lib/motion'
import { getHazeRingMaterial } from './dustMaterial'
import { DustBillboards, type DustBillboard } from './dustBillboards'
import { DebrisChunks, type ChunkPlacement } from './debrisChunks'
import { makeChaoticDustMaterial } from './chaoticDustMaterial'
import { defaultDebrisVisualProfile, type DebrisVisualProfile } from './debrisVisualProfile'
import { sampleRingChunks, sampleRingDust } from './fieldSampling'
import { DebrisVolumeFog } from './DebrisVolumeFog'
import { debrisChunkBudget } from './chunkBudget'

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
  profile?: DebrisVisualProfile
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
  const profile = props.profile ?? defaultDebrisVisualProfile('polar-ring')
  const dustCount = Math.max(0, Math.round((props.dustCount ?? Math.round(460 * (0.75 + profile.clumpiness))) * quality))
  const chunkCount = debrisChunkBudget({ kind: 'ring', profile, qualityScale: quality, explicitCount: props.chunkCount })
  const inclinationRad = props.inclinationDeg * Math.PI / 180

  const centerRad = props.centerAngleDeg * Math.PI / 180
  const halfSpanRad = (props.spanDeg / 2) * Math.PI / 180
  const startRad = centerRad - halfSpanRad
  const spanRad = halfSpanRad * 2
  const radialThickness = Math.max(0.0001, props.outerRadius - props.innerRadius)
  const meanRadius = (props.outerRadius + props.innerRadius) * 0.5
  // Thicker disk so off-plane particles read at oblique camera angles.
  const verticalThickness = Math.max(radialThickness * 0.18, meanRadius * 0.1)

  const baseSize = Math.max(0.035, meanRadius * 0.006)
  const baseHsl = useMemo(() => hexToHsl(props.color), [props.color])

  const billboards = useMemo<DustBillboard[]>(() => {
    const samples = sampleRingDust({
      fieldId,
      count: dustCount,
      innerRadius: props.innerRadius,
      radialThickness,
      startRad,
      spanRad,
      verticalThickness,
      profile,
      kind: 'dust',
    })
    return samples.map((sample, i) => {
      const hShift = (hashToUnit(`debris-dust-h#${fieldId}#${i}`) - 0.5) * 0.1
      const sShift = (hashToUnit(`debris-dust-s#${fieldId}#${i}`) - 0.5) * 0.34
      const lShift = (hashToUnit(`debris-dust-l#${fieldId}#${i}`) - 0.5) * 0.36
      const tint = hslToRgb(
        ((baseHsl.h + hShift) % 1 + 1) % 1,
        Math.min(1, Math.max(0, baseHsl.s + sShift)),
        Math.min(0.95, Math.max(0.15, baseHsl.l + lShift)),
      )
      const baseLum = baseHsl.l + 0.001
      const tintMul: [number, number, number] = [tint[0] / baseLum * 0.8, tint[1] / baseLum * 0.8, tint[2] / baseLum * 0.8]
      return {
        position: sample.position,
        scale: baseSize * sample.sizeMul,
        rotation: sample.rotation,
        tint: [
          tintMul[0] * sample.tintHeat,
          tintMul[1] * sample.tintHeat,
          tintMul[2] * sample.tintHeat,
        ],
        opacity: sample.opacity,
        aspect: sample.aspect,
        spriteIndex: sample.spriteIndex,
      }
    })
  }, [fieldId, dustCount, props.innerRadius, radialThickness, startRad, spanRad, verticalThickness, baseSize, profile, baseHsl])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    const samples = sampleRingChunks({
      fieldId,
      count: chunkCount,
      innerRadius: props.innerRadius,
      radialThickness,
      startRad,
      spanRad,
      verticalThickness,
      profile,
      kind: 'chunk',
    })
    return samples.map((sample) => ({
      position: sample.position,
      scale: sample.sizeMul * Math.max(0.32, meanRadius * 0.048),
      rotation: sample.rotation,
      brightness: sample.brightness,
      stretch: sample.stretch,
    }))
  }, [fieldId, chunkCount, props.innerRadius, radialThickness, startRad, spanRad, verticalThickness, meanRadius, profile])

  const hazeGeometry = useMemo(
    () => new THREE.RingGeometry(props.innerRadius * 0.9, props.outerRadius * 1.1, 96, 1),
    [props.innerRadius, props.outerRadius],
  )

  useEffect(() => () => { hazeGeometry.dispose() }, [hazeGeometry])

  const hazeMaterial = useMemo(() => (
    profile.chaos > 0.42
      ? makeChaoticDustMaterial({
          color: props.color,
          opacity: Math.min(0.55, Math.max(0.16, props.opacity * profile.hazeOpacity)),
          innerRadius: props.innerRadius * 0.9,
          outerRadius: props.outerRadius * 1.1,
          chaos: profile.chaos,
          seed: hashToUnit(`debris-haze-seed#${fieldId}`) * 1000,
        })
      : getHazeRingMaterial({
          color: props.color,
          opacity: Math.min(0.24, Math.max(0.06, props.opacity * profile.hazeOpacity)),
          innerRadius: props.innerRadius * 0.9,
          outerRadius: props.outerRadius * 1.1,
          seed: hashToUnit(`debris-haze-seed#${fieldId}`) * 1000,
        })
  ), [props.color, props.opacity, props.innerRadius, props.outerRadius, fieldId, profile])

  useEffect(() => () => { hazeMaterial.dispose() }, [hazeMaterial])

  return (
    <group rotation={[Math.PI / 2 - inclinationRad, 0, 0]}>
      <DebrisVolumeFog
        fieldId={fieldId}
        mode="disk"
        innerRadius={props.innerRadius * 0.82}
        outerRadius={props.outerRadius * 1.18}
        thetaStart={startRad}
        thetaLength={spanRad}
        verticalThickness={Math.max(verticalThickness * 1.65, meanRadius * 0.18)}
        opacity={Math.min(0.42, props.opacity * profile.hazeOpacity)}
        color={props.color}
        profile={profile}
        qualityScale={quality}
      />
      <mesh geometry={hazeGeometry} material={hazeMaterial} renderOrder={1} raycast={() => undefined} />
      <DustBillboards fieldId={fieldId} color={props.color} opacity={Math.min(0.48, props.opacity)} billboards={billboards} />
      <DebrisChunks fieldId={fieldId} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
