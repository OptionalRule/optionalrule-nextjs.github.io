'use client'

import * as THREE from 'three'
import { useMemo } from 'react'
import type { HazardVisual } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying float vDist;
void main() {
  float falloff = pow(clamp(1.0 - vDist, 0.0, 1.0), 2.0);
  gl_FragColor = vec4(uColor, falloff * 0.55 * uIntensity);
}
`

const VERTEX = /* glsl */ `
varying float vDist;
void main() {
  vDist = length(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export function HazardVolume({ hazard }: { hazard: HazardVisual }) {
  const { layers } = useViewerContext()
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uColor: { value: new THREE.Color('#ff5773') },
      uIntensity: { value: hazard.intensity },
    },
    transparent: true,
    depthWrite: false,
  }), [hazard.intensity])

  if (hazard.unclassified || !layers.physical) return null

  return (
    <mesh position={hazard.center} scale={hazard.radius}>
      <sphereGeometry args={[1, 24, 24]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
