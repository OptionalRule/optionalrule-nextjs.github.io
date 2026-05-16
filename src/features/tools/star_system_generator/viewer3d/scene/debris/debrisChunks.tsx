'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { hashToUnit } from '../../lib/motion'
import { beltChunkGeometry, beltParticleGeometry, beltShardGeometry } from '../renderAssets'

export interface ChunkPlacement {
  position: [number, number, number]
  scale: number
  rotation: [number, number, number]
  brightness: number
  stretch?: [number, number, number]
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
  vec3 litColor = vColor * (0.15 + facet * 0.45);
  vec3 rimColor = mix(vColor, vec3(0.62, 0.58, 0.5), 0.18) * rim * 0.14;
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

    // Assign each placement to a geometry bucket via hash so spatial neighbors
    // get visually distinct geometries.
    const buckets: number[][] = [[], [], []]
    for (let i = 0; i < placements.length; i++) {
      const roll = hashToUnit(`debris-chunk-geom#${fieldId}#${i}`)
      const bucket = roll < 0.42 ? 0 : (roll < 0.78 ? 1 : 2)
      buckets[bucket].push(i)
    }

    const dummy = new THREE.Object3D()
    const tint = new THREE.Color()
    const base = new THREE.Color(color)
    const warm = new THREE.Color('#a0796a')
    const cool = new THREE.Color('#7080a0')

    CHUNK_GEOMETRIES.forEach((geometry, idx) => {
      const indices = buckets[idx]
      if (indices.length === 0) return
      const mesh = new THREE.InstancedMesh(geometry, SHARED_CHUNK_MATERIAL, indices.length)
      mesh.name = `debris-chunks-${fieldId}-${idx}`
      for (let local = 0; local < indices.length; local++) {
        const p = placements[indices[local]]
        const stretch = p.stretch ?? [1, 1, 1]
        dummy.position.set(p.position[0], p.position[1], p.position[2])
        dummy.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2])
        dummy.scale.set(p.scale * stretch[0], p.scale * stretch[1], p.scale * stretch[2])
        dummy.updateMatrix()
        mesh.setMatrixAt(local, dummy.matrix)
        // Material variant: even-indexed warm-toned, odd-indexed cool-toned, slightly shifted from base.
        const variant = indices[local] % 2 === 0 ? warm : cool
        tint.copy(base).lerp(variant, 0.25).multiplyScalar(p.brightness)
        mesh.setColorAt(local, tint)
      }
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      g.add(mesh)
    })
    return g
  }, [fieldId, color, placements])

  useEffect(() => () => {
    group.traverse((object) => {
      if (object instanceof THREE.InstancedMesh) {
        // Do not dispose SHARED_CHUNK_MATERIAL; it is module-scoped.
        // Geometry is shared from renderAssets too.
      }
    })
  }, [group])

  if (placements.length === 0) return null
  return <primitive object={group} dispose={null} />
}
