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
  vec3 litColor = vColor * (0.11 + facet * 0.26);
  vec3 rimColor = mix(vColor, vec3(0.62, 0.58, 0.5), 0.12) * rim * 0.07;
  gl_FragColor = vec4(litColor + rimColor, 1.0);
}
`

const BELT_SHAPES: ReadonlyArray<{ geometry: THREE.BufferGeometry; share: number; salt: string }> = [
  { geometry: beltParticleGeometry, share: 0.42, salt: 'pitted' },
  { geometry: beltShardGeometry, share: 0.36, salt: 'shard' },
  { geometry: beltChunkGeometry, share: 0.22, salt: 'chunk' },
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
    const clusterCount = 9 + Math.floor(hashToUnit(`cluster-count#${belt.id}`) * 5)
    const clusterCenters = Array.from({ length: clusterCount }, (_, idx) => {
      const slot = idx / clusterCount
      const jitter = (hashToUnit(`cluster-slot-jitter#${belt.id}#${idx}`) - 0.5) * (0.7 / clusterCount)
      return ((slot + jitter) % 1 + 1) % 1
    })
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
        const clusterRoll = hashToUnit(`cluster-roll#${shape.salt}#${belt.id}#${i}`)
        const clusterIndex = Math.floor(hashToUnit(`cluster-index#${shape.salt}#${belt.id}#${i}`) * clusterCount)
        const clusterCenter = clusterCenters[clusterIndex]
        const clusterWidth = 0.024 + hashToUnit(`cluster-width#${belt.id}#${clusterIndex}`) * 0.05
        const inCluster = clusterRoll < 0.62
        const randomTurn = hashToUnit(`turn#${shape.salt}#${belt.id}#${i}`)
        const centeredOffset = (
          hashToUnit(`cluster-offset-a#${shape.salt}#${belt.id}#${i}`) -
          hashToUnit(`cluster-offset-b#${shape.salt}#${belt.id}#${i}`)
        ) * clusterWidth
        let turn = inCluster
          ? clusterCenter + centeredOffset
          : randomTurn
        turn = ((turn % 1) + 1) % 1
        if (belt.gapCount > 0) {
          for (let gap = 0; gap < belt.gapCount; gap++) {
            const center = hashToUnit(`gap-center#${belt.id}#${gap}`)
            const width = 0.012 + hashToUnit(`gap-width#${belt.id}#${gap}`) * 0.028
            const distance = Math.abs(((turn - center + 0.5) % 1) - 0.5)
            if (distance < width) turn += width * 1.8
          }
        }
        const clump = Math.sin((turn + hashToUnit(`clump#${belt.id}`)) * Math.PI * 2 * (2 + belt.gapCount)) * belt.clumpiness
        const a = (turn + clump * 0.024 + (hashToUnit(`angle-noise#${shape.salt}#${belt.id}#${i}`) - 0.5) * 0.008) * Math.PI * 2
        const radialSpan = belt.outerRadius - belt.innerRadius
        const preferredR = belt.innerRadius + radialSpan * hashToUnit(`r#${belt.id}#${i}`)
        const radialOffset = inCluster
          ? (hashToUnit(`cluster-radial#${shape.salt}#${belt.id}#${i}`) - 0.5) * radialSpan * 0.46
          : (hashToUnit(`loose-radial#${shape.salt}#${belt.id}#${i}`) - 0.5) * radialSpan * 0.12
        const r = Math.min(belt.outerRadius, Math.max(belt.innerRadius, preferredR + radialOffset))
        const jitterY = (hashToUnit(`y#${belt.id}#${i}`) - 0.5) * belt.jitter * (1.25 + hashToUnit(`y-spread#${shape.salt}#${belt.id}#${i}`) * 1.15)
        dummy.position.set(Math.cos(a) * r, jitterY, Math.sin(a) * r)
        dummy.rotation.set(
          hashToUnit(`rx#${shape.salt}#${belt.id}#${i}`) * Math.PI,
          hashToUnit(`ry#${shape.salt}#${belt.id}#${i}`) * Math.PI,
          hashToUnit(`rz#${shape.salt}#${belt.id}#${i}`) * Math.PI,
        )
        const sizeRoll = hashToUnit(`s#${belt.id}#${i}`)
        const clusterScale = inCluster ? 1.08 + hashToUnit(`cluster-scale#${shape.salt}#${belt.id}#${i}`) * 0.16 : 1
        const baseScale = (0.18 + sizeRoll ** 2.8 * 0.76) * belt.particleSizeScale * clusterScale
        const anchorScale = hashToUnit(`anchor#${belt.id}#${i}`) < 0.006
          ? 1.45 + hashToUnit(`anchor-size#${belt.id}#${i}`) * 0.55
          : 1
        const stretchX = 0.56 + hashToUnit(`sx#${shape.salt}#${belt.id}#${i}`) * 0.95
        const stretchY = 0.48 + hashToUnit(`sy#${shape.salt}#${belt.id}#${i}`) * 0.82
        const stretchZ = 0.52 + hashToUnit(`sz#${shape.salt}#${belt.id}#${i}`) * 1.05
        dummy.scale.set(baseScale * anchorScale * stretchX, baseScale * anchorScale * stretchY, baseScale * anchorScale * stretchZ)
        dummy.updateMatrix()
        mesh.setMatrixAt(localIndex, dummy.matrix)
        const palette = belt.colors.length > 0 ? belt.colors : [belt.color]
        const brightness = (0.5 + hashToUnit(`brightness#${shape.salt}#${belt.id}#${i}`) * 0.48) * (inCluster ? 1.08 : 1)
        mesh.setColorAt(
          localIndex,
          color
            .set(palette[Math.floor(hashToUnit(`c#${belt.id}#${i}`) * palette.length) % palette.length])
            .multiplyScalar(brightness),
        )
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
