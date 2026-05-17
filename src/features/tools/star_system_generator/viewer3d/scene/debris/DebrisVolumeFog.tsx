'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { hashToUnit } from '../../lib/motion'
import { type DebrisVisualProfile } from './debrisVisualProfile'
import { makeVolumeFogMaterial, type VolumeFogMode } from './volumeFogMaterial'

interface DebrisVolumeFogProps {
  fieldId: string
  mode: VolumeFogMode
  innerRadius: number
  outerRadius: number
  opacity: number
  color: string
  profile: DebrisVisualProfile
  qualityScale?: number
  thetaStart?: number
  thetaLength?: number
  verticalThickness?: number
  flattenY?: number
}

interface VolumeFogLayer {
  key: string
  geometry: THREE.BufferGeometry
  material: THREE.ShaderMaterial
  position: [number, number, number]
  scale: [number, number, number]
}

export function shouldRenderVolumeFog(profile: DebrisVisualProfile): boolean {
  return (
    profile.style === 'chaotic-disk' ||
    profile.style === 'ejecta-shell' ||
    profile.style === 'scattered-halo' ||
    profile.chaos >= 0.52
  )
}

export function volumeFogLayerCount(profile: DebrisVisualProfile, qualityScale: number, mode: VolumeFogMode): number {
  if (!shouldRenderVolumeFog(profile)) return 0
  const quality = Math.min(1.35, Math.max(0.35, qualityScale))
  const base = mode === 'disk'
    ? 6 + profile.chaos * 14 + profile.clumpiness * 4
    : 5 + profile.chaos * 10 + profile.clumpiness * 3
  const min = mode === 'disk' ? 6 : 5
  const max = mode === 'disk' ? 24 : 18
  return Math.max(min, Math.min(max, Math.round(base * quality)))
}

function layerOpacity(totalOpacity: number, layerCount: number, profile: DebrisVisualProfile): number {
  if (layerCount <= 0) return 0
  const chaosBoost = 0.72 + profile.chaos * 0.42
  return Math.min(0.075, totalOpacity * chaosBoost / Math.sqrt(layerCount) * 0.48)
}

function buildDiskLayers(props: DebrisVolumeFogProps, count: number): VolumeFogLayer[] {
  const verticalThickness = props.verticalThickness ?? Math.max(0.2, (props.outerRadius - props.innerRadius) * 0.6)
  const baseOpacity = layerOpacity(props.opacity, count, props.profile)
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const layerCenter = 1 - Math.abs(t * 2 - 1)
    const z = (t - 0.5) * verticalThickness
    const seed = hashToUnit(`volume-fog-disk#${props.fieldId}#${i}`) * 1000
    const xStretch = 1 + (hashToUnit(`volume-fog-disk-x#${props.fieldId}#${i}`) - 0.5) * 0.08 * props.profile.chaos
    const yStretch = 1 + (hashToUnit(`volume-fog-disk-y#${props.fieldId}#${i}`) - 0.5) * 0.08 * props.profile.chaos
    const opacity = baseOpacity * (0.72 + layerCenter * 0.38)

    return {
      key: `${props.fieldId}-volume-disk-${i}`,
      geometry: new THREE.RingGeometry(
        props.innerRadius,
        props.outerRadius,
        128,
        2,
        props.thetaStart ?? 0,
        props.thetaLength ?? Math.PI * 2,
      ),
      material: makeVolumeFogMaterial({
        color: props.color,
        opacity,
        innerRadius: props.innerRadius,
        outerRadius: props.outerRadius,
        chaos: props.profile.chaos,
        clumpiness: props.profile.clumpiness,
        filamentCount: props.profile.filamentCount,
        layerT: t,
        mode: 'disk',
        seed,
      }),
      position: [0, 0, z],
      scale: [xStretch, yStretch, 1],
    }
  })
}

function buildShellLayers(props: DebrisVolumeFogProps, count: number): VolumeFogLayer[] {
  const flattenY = props.flattenY ?? 1
  const radiusSpan = Math.max(0.001, props.outerRadius - props.innerRadius)
  const baseOpacity = layerOpacity(props.opacity, count, props.profile)
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const radius = props.innerRadius + radiusSpan * (0.08 + t * 0.84)
    const seed = hashToUnit(`volume-fog-shell#${props.fieldId}#${i}`) * 1000
    const offsetMag = radiusSpan * 0.018 * props.profile.chaos
    const position: [number, number, number] = [
      (hashToUnit(`volume-fog-shell-x#${props.fieldId}#${i}`) - 0.5) * offsetMag,
      (hashToUnit(`volume-fog-shell-y#${props.fieldId}#${i}`) - 0.5) * offsetMag * flattenY,
      (hashToUnit(`volume-fog-shell-z#${props.fieldId}#${i}`) - 0.5) * offsetMag,
    ]
    const xStretch = 1 + (hashToUnit(`volume-fog-shell-sx#${props.fieldId}#${i}`) - 0.5) * 0.08 * props.profile.chaos
    const yStretch = 1 + (hashToUnit(`volume-fog-shell-sy#${props.fieldId}#${i}`) - 0.5) * 0.08 * props.profile.chaos
    const zStretch = 1 + (hashToUnit(`volume-fog-shell-sz#${props.fieldId}#${i}`) - 0.5) * 0.08 * props.profile.chaos

    return {
      key: `${props.fieldId}-volume-shell-${i}`,
      geometry: new THREE.SphereGeometry(1, 48, 24),
      material: makeVolumeFogMaterial({
        color: props.color,
        opacity: baseOpacity,
        innerRadius: props.innerRadius,
        outerRadius: props.outerRadius,
        chaos: props.profile.chaos,
        clumpiness: props.profile.clumpiness,
        filamentCount: props.profile.filamentCount,
        layerT: t,
        mode: 'shell',
        seed,
      }),
      position,
      scale: [radius * xStretch, radius * flattenY * yStretch, radius * zStretch],
    }
  })
}

export function DebrisVolumeFog(props: DebrisVolumeFogProps) {
  const qualityScale = props.qualityScale ?? 1
  const layerCount = volumeFogLayerCount(props.profile, qualityScale, props.mode)

  const layers = useMemo(() => {
    if (layerCount <= 0 || props.opacity <= 0) return []
    return props.mode === 'disk'
      ? buildDiskLayers(props, layerCount)
      : buildShellLayers(props, layerCount)
  }, [layerCount, props])

  useEffect(() => () => {
    layers.forEach((layer) => {
      layer.geometry.dispose()
      layer.material.dispose()
    })
  }, [layers])

  if (layers.length === 0) return null

  return (
    <>
      {layers.map((layer) => (
        <mesh
          key={layer.key}
          geometry={layer.geometry}
          material={layer.material}
          position={layer.position}
          scale={layer.scale}
          renderOrder={1}
          raycast={() => undefined}
        />
      ))}
    </>
  )
}
