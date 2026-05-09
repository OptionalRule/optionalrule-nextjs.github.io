'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BeltVisual } from '../types'
import { hashToUnit } from '../lib/motion'
import { usePrefersReducedMotion } from '../chrome/ViewerContext'
import { beltParticleGeometry } from './renderAssets'

export interface BeltProps {
  belt: BeltVisual
}

export function Belt({ belt }: BeltProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const instancedMesh = useMemo(() => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1
    const count = Math.round(belt.particleCount * (dpr < 1.5 ? 0.5 : 1))
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(belt.color), vertexColors: true })
    const mesh = new THREE.InstancedMesh(beltParticleGeometry, mat, count)
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      let turn = i / count + hashToUnit(`${belt.id}#${i}`) * 0.5
      if (belt.gapCount > 0) {
        for (let gap = 0; gap < belt.gapCount; gap++) {
          const center = hashToUnit(`gap-center#${belt.id}#${gap}`)
          const width = 0.012 + hashToUnit(`gap-width#${belt.id}#${gap}`) * 0.028
          const distance = Math.abs(((turn - center + 0.5) % 1) - 0.5)
          if (distance < width) turn += width * 1.8
        }
      }
      const clump = Math.sin((turn + hashToUnit(`clump#${belt.id}`)) * Math.PI * 2 * (2 + belt.gapCount)) * belt.clumpiness
      const a = (turn + clump * 0.015) * Math.PI * 2
      const r = belt.innerRadius + (belt.outerRadius - belt.innerRadius) * hashToUnit(`r#${belt.id}#${i}`)
      const jitterY = (hashToUnit(`y#${belt.id}#${i}`) - 0.5) * belt.jitter
      dummy.position.set(Math.cos(a) * r, jitterY, Math.sin(a) * r)
      dummy.rotation.set(hashToUnit(`rx#${belt.id}#${i}`) * Math.PI, hashToUnit(`ry#${belt.id}#${i}`) * Math.PI, 0)
      const baseScale = (0.6 + hashToUnit(`s#${belt.id}#${i}`) * 0.8) * belt.particleSizeScale
      const stretchX = 0.7 + hashToUnit(`sx#${belt.id}#${i}`) * 0.9
      const stretchY = 0.7 + hashToUnit(`sy#${belt.id}#${i}`) * 0.9
      const stretchZ = 0.7 + hashToUnit(`sz#${belt.id}#${i}`) * 0.9
      dummy.scale.set(baseScale * stretchX, baseScale * stretchY, baseScale * stretchZ)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      const palette = belt.colors.length > 0 ? belt.colors : [belt.color]
      mesh.setColorAt(i, color.set(palette[Math.floor(hashToUnit(`c#${belt.id}#${i}`) * palette.length) % palette.length]))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    return mesh
  }, [belt])

  useEffect(() => () => {
    if (Array.isArray(instancedMesh.material)) {
      instancedMesh.material.forEach((material) => material.dispose())
    } else {
      instancedMesh.material.dispose()
    }
  }, [instancedMesh])

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    if (!prefersReducedMotion) {
      groupRef.current.rotation.y -= delta * 0.02
    }
  })

  return (
    <group ref={groupRef} rotation={[belt.inclination, 0, 0]}>
      <primitive object={instancedMesh} dispose={null} />
    </group>
  )
}
