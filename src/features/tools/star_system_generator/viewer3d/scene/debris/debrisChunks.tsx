'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { beltChunkGeometry, beltParticleGeometry, beltShardGeometry } from '../renderAssets'

export interface ChunkPlacement {
  position: [number, number, number]
  scale: number
  rotation: [number, number, number]
  brightness: number
}

interface DebrisChunksProps {
  fieldId: string
  color: string
  placements: ChunkPlacement[]
}

const CHUNK_GEOMETRIES: ReadonlyArray<THREE.BufferGeometry> = [
  beltParticleGeometry,
  beltShardGeometry,
  beltChunkGeometry,
]

const chunkVertexShader = /* glsl */ `
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

const chunkFragmentShader = /* glsl */ `
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDirection = normalize(-vWorldPosition);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float starFacing = max(dot(normal, lightDirection), 0.0);
  float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.0);
  float facet = pow(starFacing, 1.6);
  vec3 litColor = vColor * (0.13 + facet * 0.32);
  vec3 rimColor = mix(vColor, vec3(0.62, 0.58, 0.5), 0.18) * rim * 0.10;
  gl_FragColor = vec4(litColor + rimColor, 1.0);
}
`

const SHARED_CHUNK_MATERIAL = new THREE.ShaderMaterial({
  vertexShader: chunkVertexShader,
  fragmentShader: chunkFragmentShader,
  toneMapped: false,
})

export function DebrisChunks({ fieldId, color, placements }: DebrisChunksProps) {
  const group = useMemo(() => {
    const g = new THREE.Group()
    if (placements.length === 0) return g
    const dummy = new THREE.Object3D()
    const tint = new THREE.Color()
    const base = new THREE.Color(color)
    const shares = [0.42, 0.36, 0.22]
    let cursor = 0
    CHUNK_GEOMETRIES.forEach((geometry, idx) => {
      const shapeCount = idx === CHUNK_GEOMETRIES.length - 1
        ? placements.length - cursor
        : Math.max(1, Math.round(placements.length * shares[idx]))
      if (shapeCount <= 0) return
      const mesh = new THREE.InstancedMesh(geometry, SHARED_CHUNK_MATERIAL, shapeCount)
      mesh.name = `debris-chunks-${fieldId}-${idx}`
      for (let local = 0; local < shapeCount; local++) {
        const p = placements[cursor + local]
        dummy.position.set(p.position[0], p.position[1], p.position[2])
        dummy.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2])
        dummy.scale.setScalar(p.scale)
        dummy.updateMatrix()
        mesh.setMatrixAt(local, dummy.matrix)
        tint.copy(base).multiplyScalar(p.brightness)
        mesh.setColorAt(local, tint)
      }
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      g.add(mesh)
      cursor += shapeCount
    })
    return g
  }, [fieldId, color, placements])

  if (placements.length === 0) return null
  return <primitive object={group} dispose={null} />
}
