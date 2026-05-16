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
    }
    geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3))
    geometry.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1))
    geometry.setAttribute('aRotation', new THREE.InstancedBufferAttribute(rotations, 1))
    geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 3))
    geometry.setAttribute('aSpriteIndex', new THREE.InstancedBufferAttribute(spriteIndices, 1))
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
