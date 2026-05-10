'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BeltVisual } from '../types'
import { hashToUnit } from '../lib/motion'
import { usePrefersReducedMotion } from '../chrome/ViewerContext'
import { beltParticleGeometry } from './renderAssets'

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
  float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.4);
  float facet = pow(starFacing, 1.35);
  vec3 litColor = vColor * (0.28 + facet * 0.52);
  vec3 rimColor = mix(vColor, vec3(0.92, 0.86, 0.72), 0.22) * rim * 0.26;
  gl_FragColor = vec4(litColor + rimColor, 1.0);
}
`

export interface BeltProps {
  belt: BeltVisual
}

export function Belt({ belt }: BeltProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const instancedMesh = useMemo(() => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1
    const count = Math.round(belt.particleCount * (dpr < 1.5 ? 0.5 : 1))
    const mat = new THREE.ShaderMaterial({
      vertexShader: asteroidVertexShader,
      fragmentShader: asteroidFragmentShader,
      toneMapped: false,
    })
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
      const anchorScale = hashToUnit(`anchor#${belt.id}#${i}`) < 0.02
        ? 1.65 + hashToUnit(`anchor-size#${belt.id}#${i}`) * 0.9
        : 1
      const stretchX = 0.7 + hashToUnit(`sx#${belt.id}#${i}`) * 0.9
      const stretchY = 0.7 + hashToUnit(`sy#${belt.id}#${i}`) * 0.9
      const stretchZ = 0.7 + hashToUnit(`sz#${belt.id}#${i}`) * 0.9
      dummy.scale.set(baseScale * anchorScale * stretchX, baseScale * anchorScale * stretchY, baseScale * anchorScale * stretchZ)
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
      groupRef.current.rotation.y -= delta * BELT_ROTATION_SPEED
    }
  })

  return (
    <group ref={groupRef} rotation={[belt.inclination, 0, 0]}>
      <primitive object={instancedMesh} dispose={null} />
    </group>
  )
}
