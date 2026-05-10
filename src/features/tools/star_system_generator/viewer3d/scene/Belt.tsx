'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BeltVisual } from '../types'
import { hashToUnit } from '../lib/motion'
import { usePrefersReducedMotion } from '../chrome/ViewerContext'
import { beltChunkGeometry, beltParticleGeometry, beltShardGeometry } from './renderAssets'

const BELT_ROTATION_SPEED = 0.0067

const asteroidVertexShader = /* glsl */ `
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  mat4 instanceModelMatrix = modelMatrix * instanceMatrix;
  vec4 worldPosition = instanceModelMatrix * vec4(position, 1.0);
  vColor = instanceColor;
  vNormal = normalize(mat3(instanceModelMatrix) * normal);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

const asteroidFragmentShader = /* glsl */ `
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDirection = normalize(-vWorldPosition);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float starFacing = max(dot(normal, lightDirection), 0.0);
  float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.1);
  float facet = pow(starFacing, 1.65);
  vec3 litColor = vColor * (0.12 + facet * 0.3);
  vec3 rimColor = mix(vColor, vec3(0.74, 0.68, 0.58), 0.16) * rim * 0.1;
  gl_FragColor = vec4(litColor + rimColor, 1.0);
}
`

const BELT_SHAPES: ReadonlyArray<{ geometry: THREE.BufferGeometry; share: number; salt: string }> = [
  { geometry: beltParticleGeometry, share: 0.46, salt: 'pitted' },
  { geometry: beltShardGeometry, share: 0.34, salt: 'shard' },
  { geometry: beltChunkGeometry, share: 0.2, salt: 'chunk' },
]

export interface BeltProps {
  belt: BeltVisual
}

export function Belt({ belt }: BeltProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const instancedGroup = useMemo(() => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1
    const totalCount = Math.round(belt.particleCount * (dpr < 1.5 ? 0.5 : 1))
    const group = new THREE.Group()
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    let globalIndex = 0

    BELT_SHAPES.forEach((shape, shapeIndex) => {
      const count = shapeIndex === BELT_SHAPES.length - 1
        ? totalCount - globalIndex
        : Math.max(1, Math.round(totalCount * shape.share))
      const material = new THREE.ShaderMaterial({
        vertexShader: asteroidVertexShader,
        fragmentShader: asteroidFragmentShader,
        toneMapped: false,
      })
      const mesh = new THREE.InstancedMesh(shape.geometry, material, Math.max(0, count))
      for (let localIndex = 0; localIndex < count; localIndex++) {
        const i = globalIndex + localIndex
        let turn = i / totalCount + hashToUnit(`${belt.id}#${shape.salt}#${i}`) * 0.52
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
        dummy.rotation.set(
          hashToUnit(`rx#${shape.salt}#${belt.id}#${i}`) * Math.PI,
          hashToUnit(`ry#${shape.salt}#${belt.id}#${i}`) * Math.PI,
          hashToUnit(`rz#${shape.salt}#${belt.id}#${i}`) * Math.PI,
        )
        const sizeRoll = hashToUnit(`s#${belt.id}#${i}`)
        const baseScale = (0.32 + sizeRoll ** 2.4 * 1.35) * belt.particleSizeScale
        const anchorScale = hashToUnit(`anchor#${belt.id}#${i}`) < 0.015
          ? 1.9 + hashToUnit(`anchor-size#${belt.id}#${i}`) * 1.2
          : 1
        const stretchX = 0.42 + hashToUnit(`sx#${shape.salt}#${belt.id}#${i}`) * 1.45
        const stretchY = 0.34 + hashToUnit(`sy#${shape.salt}#${belt.id}#${i}`) * 1.25
        const stretchZ = 0.4 + hashToUnit(`sz#${shape.salt}#${belt.id}#${i}`) * 1.6
        dummy.scale.set(baseScale * anchorScale * stretchX, baseScale * anchorScale * stretchY, baseScale * anchorScale * stretchZ)
        dummy.updateMatrix()
        mesh.setMatrixAt(localIndex, dummy.matrix)
        const palette = belt.colors.length > 0 ? belt.colors : [belt.color]
        mesh.setColorAt(localIndex, color.set(palette[Math.floor(hashToUnit(`c#${belt.id}#${i}`) * palette.length) % palette.length]))
      }
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      group.add(mesh)
      globalIndex += count
    })
    return group
  }, [belt])

  useEffect(() => () => {
    instancedGroup.traverse((object) => {
      if (!(object instanceof THREE.InstancedMesh)) return
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose())
      } else {
        object.material.dispose()
      }
    })
  }, [instancedGroup])

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    if (!prefersReducedMotion) {
      groupRef.current.rotation.y -= delta * BELT_ROTATION_SPEED
    }
  })

  return (
    <group ref={groupRef} rotation={[belt.inclination, 0, 0]}>
      <primitive object={instancedGroup} dispose={null} />
    </group>
  )
}
