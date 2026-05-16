'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { hashToUnit } from '../../lib/motion'
import { getDustMaterial } from './dustMaterial'
import { DebrisChunks, type ChunkPlacement } from './debrisChunks'

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
}

function jitterTint(seed: string): [number, number, number] {
  const r = 0.78 + hashToUnit(`${seed}-r`) * 0.44
  const g = 0.78 + hashToUnit(`${seed}-g`) * 0.44
  const b = 0.78 + hashToUnit(`${seed}-b`) * 0.44
  return [r, g, b]
}

export function DebrisFieldStream(props: DebrisFieldStreamProps) {
  const fieldId = props.fieldId ?? `stream-${props.centerAngleDeg}-${props.startRadius}`
  const quality = props.qualityScale ?? 1
  const dustCount = Math.max(0, Math.round((props.dustCount ?? 250) * quality))
  const chunkCount = Math.max(4, Math.round((props.chunkCount ?? 8) * quality))
  const angleRad = props.centerAngleDeg * Math.PI / 180
  const length = Math.max(0.0001, Math.abs(props.endRadius - props.startRadius))
  const sheathRadius = Math.max(0.4, length * 0.06)
  const baseSize = Math.max(0.4, sheathRadius * 0.85)

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

  const dustGeometry = useMemo(() => {
    const positions = new Float32Array(dustCount * 3)
    const sizes = new Float32Array(dustCount)
    const tints = new Float32Array(dustCount * 3)
    const axisX = Math.cos(angleRad)
    const axisZ = Math.sin(angleRad)
    const perpX = -axisZ
    const perpZ = axisX
    for (let i = 0; i < dustCount; i++) {
      const t = hashToUnit(`debris-stream-t#${fieldId}#${i}`)
      const r = props.startRadius + (props.endRadius - props.startRadius) * t
      const cx = r * axisX
      const cz = r * axisZ
      const sagPhase = hashToUnit(`debris-stream-phase#${fieldId}#${i}`)
      const sag = (Math.sin(t * Math.PI * 2 + sagPhase * Math.PI * 2)) * sheathRadius * 0.4
      const radialU = hashToUnit(`debris-stream-radial#${fieldId}#${i}`)
      const radialAngle = hashToUnit(`debris-stream-angle#${fieldId}#${i}`) * Math.PI * 2
      const taper = 1 - Math.abs(t - 0.5) * 0.3
      const ringR = Math.sqrt(radialU) * sheathRadius * taper
      const offY = Math.sin(radialAngle) * ringR + sag * 0.4
      const offPerp = Math.cos(radialAngle) * ringR
      positions[i * 3] = cx + perpX * offPerp
      positions[i * 3 + 1] = offY
      positions[i * 3 + 2] = cz + perpZ * offPerp
      const sizeRoll = hashToUnit(`debris-stream-size#${fieldId}#${i}`)
      sizes[i] = baseSize * (0.4 + Math.pow(sizeRoll, 3.0) * 2.0)
      const [tr, tg, tb] = jitterTint(`debris-stream-tint#${fieldId}#${i}`)
      // Hotter end glows brighter.
      const heatBoost = 0.7 + (1 - t) * 0.5
      tints[i * 3] = tr * heatBoost
      tints[i * 3 + 1] = tg * heatBoost
      tints[i * 3 + 2] = tb * heatBoost
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    g.setAttribute('aTint', new THREE.BufferAttribute(tints, 3))
    return g
  }, [fieldId, dustCount, props.startRadius, props.endRadius, angleRad, sheathRadius, baseSize])

  useEffect(() => () => { dustGeometry.dispose() }, [dustGeometry])

  const dustMaterial = useMemo(() => getDustMaterial({
    color: props.color,
    opacity: Math.min(1, props.opacity * 0.75),
  }), [props.color, props.opacity])

  const chunkPlacements = useMemo<ChunkPlacement[]>(() => {
    const out: ChunkPlacement[] = []
    const axisX = Math.cos(angleRad)
    const axisZ = Math.sin(angleRad)
    const perpX = -axisZ
    const perpZ = axisX
    for (let i = 0; i < chunkCount; i++) {
      const t = hashToUnit(`debris-stream-chunk-t#${fieldId}#${i}`)
      const r = props.startRadius + (props.endRadius - props.startRadius) * t
      const cx = r * axisX
      const cz = r * axisZ
      const offY = (hashToUnit(`debris-stream-chunk-y#${fieldId}#${i}`) - 0.5) * sheathRadius * 0.9
      const offPerp = (hashToUnit(`debris-stream-chunk-p#${fieldId}#${i}`) - 0.5) * sheathRadius * 1.2
      const chunkSize = (0.55 + Math.pow(hashToUnit(`debris-stream-chunk-size#${fieldId}#${i}`), 2.5) * 1.4)
        * Math.max(0.55, sheathRadius * 0.45)
      const brightness = 0.6 + hashToUnit(`debris-stream-chunk-bright#${fieldId}#${i}`) * 0.5
      out.push({
        position: [cx + perpX * offPerp, offY, cz + perpZ * offPerp],
        scale: chunkSize,
        rotation: [
          hashToUnit(`debris-stream-chunk-rx#${fieldId}#${i}`) * Math.PI,
          hashToUnit(`debris-stream-chunk-ry#${fieldId}#${i}`) * Math.PI,
          hashToUnit(`debris-stream-chunk-rz#${fieldId}#${i}`) * Math.PI,
        ],
        brightness,
      })
    }
    return out
  }, [fieldId, chunkCount, props.startRadius, props.endRadius, angleRad, sheathRadius])

  const hotSpotX = props.endRadius * Math.cos(angleRad)
  const hotSpotZ = props.endRadius * Math.sin(angleRad)

  return (
    <group>
      <primitive object={streamLine} />
      <points geometry={dustGeometry} material={dustMaterial} renderOrder={2} raycast={() => undefined} />
      <DebrisChunks fieldId={fieldId} color={props.color} placements={chunkPlacements} />
      <mesh position={[hotSpotX, 0, hotSpotZ]}>
        <sphereGeometry args={[Math.max(0.3, sheathRadius * 0.65), 12, 12]} />
        <meshBasicMaterial color="#ffe6aa" transparent opacity={Math.min(1, props.opacity + 0.2)} />
      </mesh>
    </group>
  )
}
