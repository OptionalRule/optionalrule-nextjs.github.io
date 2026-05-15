'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { hashToUnit } from '../../lib/motion'
import { getDustMaterial } from './dustMaterial'
import { DebrisChunks, type ChunkPlacement } from './debrisChunks'

interface DebrisFieldShellProps {
  fieldId?: string
  innerRadius: number
  outerRadius: number
  particleCount: number
  opacity: number
  color: string
  chunkCount?: number
}

export function DebrisFieldShell(props: DebrisFieldShellProps) {
  const fieldId = props.fieldId ?? `shell-${props.innerRadius}-${props.outerRadius}`
  const dustCount = Math.max(0, Math.round(props.particleCount))
  const chunkCount = Math.max(0, Math.round(props.chunkCount ?? Math.min(40, dustCount * 0.06)))
  const meanRadius = (props.outerRadius + props.innerRadius) * 0.5

  const dustGeometry = useMemo(() => {
    const positions = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const u = hashToUnit(`debris-shell-u#${fieldId}#${i}`)
      const v = hashToUnit(`debris-shell-v#${fieldId}#${i}`)
      const w = hashToUnit(`debris-shell-w#${fieldId}#${i}`)
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * u
      const theta = Math.acos(2 * v - 1)
      const phi = 2 * Math.PI * w
      positions[i * 3] = r * Math.sin(theta) * Math.cos(phi)
      positions[i * 3 + 1] = r * Math.cos(theta)
      positions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [fieldId, dustCount, props.innerRadius, props.outerRadius])

  const dustMaterial = useMemo(() => getDustMaterial({
    color: props.color,
    opacity: Math.min(1, props.opacity * 0.78),
    size: Math.max(0.4, meanRadius * 0.028),
  }), [props.color, props.opacity, meanRadius])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    const out: ChunkPlacement[] = []
    for (let i = 0; i < chunkCount; i++) {
      const u = hashToUnit(`debris-shell-chunk-u#${fieldId}#${i}`)
      const v = hashToUnit(`debris-shell-chunk-v#${fieldId}#${i}`)
      const w = hashToUnit(`debris-shell-chunk-w#${fieldId}#${i}`)
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * u
      const theta = Math.acos(2 * v - 1)
      const phi = 2 * Math.PI * w
      const baseSize = (0.5 + Math.pow(hashToUnit(`debris-shell-chunk-size#${fieldId}#${i}`), 2.4) * 1.4)
        * Math.max(0.6, meanRadius * 0.11)
      const brightness = 0.6 + hashToUnit(`debris-shell-chunk-bright#${fieldId}#${i}`) * 0.5
      out.push({
        position: [r * Math.sin(theta) * Math.cos(phi), r * Math.cos(theta), r * Math.sin(theta) * Math.sin(phi)],
        scale: baseSize,
        rotation: [
          hashToUnit(`debris-shell-chunk-rx#${fieldId}#${i}`) * Math.PI,
          hashToUnit(`debris-shell-chunk-ry#${fieldId}#${i}`) * Math.PI,
          hashToUnit(`debris-shell-chunk-rz#${fieldId}#${i}`) * Math.PI,
        ],
        brightness,
      })
    }
    return out
  }, [fieldId, chunkCount, props.innerRadius, props.outerRadius, meanRadius])

  return (
    <group>
      <points geometry={dustGeometry} material={dustMaterial} renderOrder={2} raycast={() => undefined} />
      <DebrisChunks fieldId={fieldId} count={chunkCount} color={props.color} placements={chunkPlacements} />
    </group>
  )
}
