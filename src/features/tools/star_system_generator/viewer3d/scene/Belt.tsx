'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BeltVisual } from '../types'
import { hashToUnit } from '../lib/motion'
import { usePrefersReducedMotion } from '../chrome/ViewerContext'

export interface BeltProps {
  belt: BeltVisual
}

export function Belt({ belt }: BeltProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const instancedMesh = useMemo(() => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1
    const count = Math.round(belt.particleCount * (dpr < 1.5 ? 0.5 : 1))
    const geo = new THREE.IcosahedronGeometry(0.13, 0)
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(belt.color) })
    const mesh = new THREE.InstancedMesh(geo, mat, count)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const a = (i / count + hashToUnit(`${belt.id}#${i}`) * 0.5) * Math.PI * 2
      const r = belt.innerRadius + (belt.outerRadius - belt.innerRadius) * hashToUnit(`r#${belt.id}#${i}`)
      const jitterY = (hashToUnit(`y#${belt.id}#${i}`) - 0.5) * belt.jitter
      dummy.position.set(Math.cos(a) * r, jitterY, Math.sin(a) * r)
      dummy.rotation.set(hashToUnit(`rx#${belt.id}#${i}`) * Math.PI, hashToUnit(`ry#${belt.id}#${i}`) * Math.PI, 0)
      const baseScale = 0.6 + hashToUnit(`s#${belt.id}#${i}`) * 0.8
      const stretchX = 0.7 + hashToUnit(`sx#${belt.id}#${i}`) * 0.9
      const stretchY = 0.7 + hashToUnit(`sy#${belt.id}#${i}`) * 0.9
      const stretchZ = 0.7 + hashToUnit(`sz#${belt.id}#${i}`) * 0.9
      dummy.scale.set(baseScale * stretchX, baseScale * stretchY, baseScale * stretchZ)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }, [belt])

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    if (!prefersReducedMotion) {
      groupRef.current.rotation.y -= delta * 0.02
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={instancedMesh} />
    </group>
  )
}
