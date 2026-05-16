'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { hashToUnit } from '../../lib/motion'
import { getDustMaterial } from './dustMaterial'
import { DebrisChunks, type ChunkPlacement } from './debrisChunks'

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

function jitterTint(seed: string): [number, number, number] {
  const r = 0.78 + hashToUnit(`${seed}-r`) * 0.44
  const g = 0.78 + hashToUnit(`${seed}-g`) * 0.44
  const b = 0.78 + hashToUnit(`${seed}-b`) * 0.44
  return [r, g, b]
}

export function DebrisFieldHalo(props: DebrisFieldHaloProps) {
  const fieldId = props.fieldId ?? `halo-${props.innerRadius}-${props.outerRadius}`
  const quality = props.qualityScale ?? 1
  const dustCount = Math.max(0, Math.round(props.particleCount * quality))
  const defaultChunks = Math.min(40, dustCount * 0.06)
  const chunkCount = Math.max(6, Math.round((props.chunkCount ?? defaultChunks) * quality))
  const maxTiltRad = props.inclinationDeg * Math.PI / 180
  const meanRadius = (props.outerRadius + props.innerRadius) * 0.5
  const baseSize = Math.max(0.5, meanRadius * 0.035)

  const dustGeometry = useMemo(() => {
    const positions = new Float32Array(dustCount * 3)
    const sizes = new Float32Array(dustCount)
    const tints = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const u = hashToUnit(`debris-halo-u#${fieldId}#${i}`)
      const v = hashToUnit(`debris-halo-v#${fieldId}#${i}`)
      const w = hashToUnit(`debris-halo-w#${fieldId}#${i}`)
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * Math.pow(u, 0.8)
      const phi = 2 * Math.PI * v
      const tilt = (w - 0.5) * 2 * maxTiltRad
      positions[i * 3] = r * Math.cos(phi) * Math.cos(tilt)
      positions[i * 3 + 1] = r * Math.sin(tilt)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.cos(tilt)
      const sizeRoll = hashToUnit(`debris-halo-size#${fieldId}#${i}`)
      sizes[i] = baseSize * (0.35 + Math.pow(sizeRoll, 3.0) * 2.4)
      const [tr, tg, tb] = jitterTint(`debris-halo-tint#${fieldId}#${i}`)
      const brightness = 0.6 + hashToUnit(`debris-halo-bright#${fieldId}#${i}`) * 0.6
      tints[i * 3] = tr * brightness
      tints[i * 3 + 1] = tg * brightness
      tints[i * 3 + 2] = tb * brightness
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    g.setAttribute('aTint', new THREE.BufferAttribute(tints, 3))
    return g
  }, [fieldId, dustCount, props.innerRadius, props.outerRadius, maxTiltRad, baseSize])

  useEffect(() => () => { dustGeometry.dispose() }, [dustGeometry])

  const dustMaterial = useMemo(() => getDustMaterial({
    color: props.color,
    opacity: Math.min(1, props.opacity * 0.78),
  }), [props.color, props.opacity])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    const out: ChunkPlacement[] = []
    for (let i = 0; i < chunkCount; i++) {
      const u = hashToUnit(`debris-halo-chunk-u#${fieldId}#${i}`)
      const v = hashToUnit(`debris-halo-chunk-v#${fieldId}#${i}`)
      const w = hashToUnit(`debris-halo-chunk-w#${fieldId}#${i}`)
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * u
      const phi = 2 * Math.PI * v
      const tilt = (w - 0.5) * 2 * maxTiltRad
      const chunkSize = (0.5 + Math.pow(hashToUnit(`debris-halo-chunk-size#${fieldId}#${i}`), 2.4) * 1.4)
        * Math.max(0.6, meanRadius * 0.11)
      const brightness = 0.55 + hashToUnit(`debris-halo-chunk-bright#${fieldId}#${i}`) * 0.55
      out.push({
        position: [
          r * Math.cos(phi) * Math.cos(tilt),
          r * Math.sin(tilt),
          r * Math.sin(phi) * Math.cos(tilt),
        ],
        scale: chunkSize,
        rotation: [
          hashToUnit(`debris-halo-chunk-rx#${fieldId}#${i}`) * Math.PI,
          hashToUnit(`debris-halo-chunk-ry#${fieldId}#${i}`) * Math.PI,
          hashToUnit(`debris-halo-chunk-rz#${fieldId}#${i}`) * Math.PI,
        ],
        brightness,
      })
    }
    return out
  }, [fieldId, chunkCount, props.innerRadius, props.outerRadius, maxTiltRad, meanRadius])

  return (
    <group>
      <points geometry={dustGeometry} material={dustMaterial} renderOrder={2} raycast={() => undefined} />
      <DebrisChunks fieldId={fieldId} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
