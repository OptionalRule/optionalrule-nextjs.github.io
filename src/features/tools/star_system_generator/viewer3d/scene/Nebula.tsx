'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export interface NebulaProps {
  sceneRadius: number
}

interface Cloud {
  dir: [number, number, number]
  color: string
  scale: number
  opacity: number
}

// Hand-placed so the backdrop reads as a few deliberate gas clouds rather than
// random noise. Directions are unit-ish vectors; positions are derived from
// sceneRadius so the nebula always sits behind the system at any zoom.
const CLOUDS: ReadonlyArray<Cloud> = [
  { dir: [-0.8, 0.35, -0.5], color: '#5a2f8a', scale: 3.4, opacity: 0.1 },
  { dir: [0.7, -0.25, -0.6], color: '#1f4f8a', scale: 3.0, opacity: 0.09 },
  { dir: [0.45, 0.5, 0.55], color: '#256a7a', scale: 2.6, opacity: 0.07 },
  { dir: [-0.55, -0.45, 0.5], color: '#6a2f6a', scale: 2.8, opacity: 0.065 },
  { dir: [0.1, 0.6, -0.7], color: '#2a3f8a', scale: 3.2, opacity: 0.06 },
]

const nebulaVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const nebulaFragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float d = distance(vUv, vec2(0.5));
    // Soft, slightly lumpy radial falloff so edges dissolve into the void.
    float a = smoothstep(0.5, 0.04, d);
    a *= a;
    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`

export function Nebula({ sceneRadius }: NebulaProps) {
  const groupRef = useRef<THREE.Group | null>(null)

  const planes = useMemo(() => {
    const distance = sceneRadius * 3.8
    return CLOUDS.map((cloud) => {
      const dir = new THREE.Vector3(...cloud.dir).normalize()
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(cloud.color) },
          uOpacity: { value: cloud.opacity },
        },
        vertexShader: nebulaVertexShader,
        fragmentShader: nebulaFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })
      return {
        position: dir.multiplyScalar(distance),
        size: sceneRadius * cloud.scale,
        material,
      }
    })
  }, [sceneRadius])

  // Billboard each cloud toward the camera each frame (keeping its world position)
  // so the clouds hold a consistent soft shape as the CameraRig orbits. Cheap for
  // a handful of planes.
  useFrame((state) => {
    const group = groupRef.current
    if (!group) return
    for (const child of group.children) child.quaternion.copy(state.camera.quaternion)
  })

  useEffect(() => () => {
    planes.forEach((plane) => plane.material.dispose())
  }, [planes])

  return (
    <group ref={groupRef}>
      {planes.map((plane, index) => (
        <mesh
          key={index}
          position={plane.position}
          material={plane.material}
          renderOrder={-5}
        >
          <planeGeometry args={[plane.size, plane.size]} />
        </mesh>
      ))}
    </group>
  )
}
