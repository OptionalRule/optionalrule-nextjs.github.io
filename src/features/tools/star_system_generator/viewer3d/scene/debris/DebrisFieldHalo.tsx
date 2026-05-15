'use client'

import { useMemo } from 'react'
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
}

export function DebrisFieldHalo(props: DebrisFieldHaloProps) {
  const fieldId = props.fieldId ?? `halo-${props.innerRadius}-${props.outerRadius}`
  const dustCount = Math.max(0, Math.round(props.particleCount))
  const chunkCount = Math.max(0, Math.round(props.chunkCount ?? Math.min(40, dustCount * 0.06)))
  const maxTiltRad = props.inclinationDeg * Math.PI / 180
  const meanRadius = (props.outerRadius + props.innerRadius) * 0.5

  const dustGeometry = useMemo(() => {
    const positions = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const u = hashToUnit(`debris-halo-u#${fieldId}#${i}`)
      const v = hashToUnit(`debris-halo-v#${fieldId}#${i}`)
      const w = hashToUnit(`debris-halo-w#${fieldId}#${i}`)
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * u
      const phi = 2 * Math.PI * v
      const tilt = (w - 0.5) * 2 * maxTiltRad
      positions[i * 3] = r * Math.cos(phi) * Math.cos(tilt)
      positions[i * 3 + 1] = r * Math.sin(tilt)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.cos(tilt)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [fieldId, dustCount, props.innerRadius, props.outerRadius, maxTiltRad])

  const dustMaterial = useMemo(() => getDustMaterial({
    color: props.color,
    opacity: Math.min(1, props.opacity * 0.75),
    size: Math.max(0.32, meanRadius * 0.022),
  }), [props.color, props.opacity, meanRadius])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    const out: ChunkPlacement[] = []
    for (let i = 0; i < chunkCount; i++) {
      const u = hashToUnit(`debris-halo-chunk-u#${fieldId}#${i}`)
      const v = hashToUnit(`debris-halo-chunk-v#${fieldId}#${i}`)
      const w = hashToUnit(`debris-halo-chunk-w#${fieldId}#${i}`)
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * u
      const phi = 2 * Math.PI * v
      const tilt = (w - 0.5) * 2 * maxTiltRad
      const baseSize = (0.5 + Math.pow(hashToUnit(`debris-halo-chunk-size#${fieldId}#${i}`), 2.4) * 1.4)
        * Math.max(0.6, meanRadius * 0.11)
      const brightness = 0.55 + hashToUnit(`debris-halo-chunk-bright#${fieldId}#${i}`) * 0.55
      out.push({
        position: [
          r * Math.cos(phi) * Math.cos(tilt),
          r * Math.sin(tilt),
          r * Math.sin(phi) * Math.cos(tilt),
        ],
        scale: baseSize,
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
      <DebrisChunks fieldId={fieldId} count={chunkCount} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
