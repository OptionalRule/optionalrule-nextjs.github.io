'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { getDustBillboardMaterial } from './dustMaterial'

export interface DustBillboard {
  position: [number, number, number]
  scale: number
  rotation: number
  tint: [number, number, number]
  spriteIndex: number
  opacity?: number
  aspect?: [number, number]
}

interface DustBillboardsProps {
  fieldId: string
  color: string
  opacity: number
  billboards: DustBillboard[]
}

const QUAD_GEOMETRY = new THREE.PlaneGeometry(1, 1)

export function DustBillboards({ fieldId, color, opacity, billboards }: DustBillboardsProps) {
  const material = useMemo(() => getDustBillboardMaterial({ color, opacity }), [color, opacity])

  const instanced = useMemo(() => {
    if (billboards.length === 0) return null
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.index = QUAD_GEOMETRY.index
    geometry.attributes.position = QUAD_GEOMETRY.attributes.position
    geometry.attributes.uv = QUAD_GEOMETRY.attributes.uv
    geometry.attributes.normal = QUAD_GEOMETRY.attributes.normal

    const offsets = new Float32Array(billboards.length * 3)
    const scales = new Float32Array(billboards.length)
    const rotations = new Float32Array(billboards.length)
    const tints = new Float32Array(billboards.length * 3)
    const spriteIndices = new Float32Array(billboards.length)
    const opacities = new Float32Array(billboards.length)
    const aspects = new Float32Array(billboards.length * 2)
    for (let i = 0; i < billboards.length; i++) {
      const b = billboards[i]
      offsets[i * 3] = b.position[0]
      offsets[i * 3 + 1] = b.position[1]
      offsets[i * 3 + 2] = b.position[2]
      scales[i] = b.scale
      rotations[i] = b.rotation
      tints[i * 3] = b.tint[0]
      tints[i * 3 + 1] = b.tint[1]
      tints[i * 3 + 2] = b.tint[2]
      spriteIndices[i] = b.spriteIndex
      opacities[i] = b.opacity ?? 1
      aspects[i * 2] = b.aspect?.[0] ?? 1
      aspects[i * 2 + 1] = b.aspect?.[1] ?? 1
    }
    geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3))
    geometry.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1))
    geometry.setAttribute('aRotation', new THREE.InstancedBufferAttribute(rotations, 1))
    geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 3))
    geometry.setAttribute('aSpriteIndex', new THREE.InstancedBufferAttribute(spriteIndices, 1))
    geometry.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(opacities, 1))
    geometry.setAttribute('aAspect', new THREE.InstancedBufferAttribute(aspects, 2))
    geometry.instanceCount = billboards.length
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = `dust-billboards-${fieldId}`
    mesh.frustumCulled = false
    return { geometry, mesh }
  }, [billboards, fieldId, material])

  useEffect(() => () => {
    if (instanced) instanced.geometry.dispose()
  }, [instanced])

  if (!instanced) return null
  return <primitive object={instanced.mesh} dispose={null} renderOrder={2} raycast={() => undefined} />
}
