'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { GuBleedVisual } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uPulse;
varying float vDist;
void main() {
  float falloff = pow(clamp(1.0 - vDist, 0.0, 1.0), 2.0);
  float pulse = 0.85 + 0.15 * uPulse;
  gl_FragColor = vec4(uColor, falloff * 0.5 * uIntensity * pulse);
}
`

const VERTEX = /* glsl */ `
varying float vDist;
void main() {
  vDist = length(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export function GuBleedVolume({ bleed }: { bleed: GuBleedVisual }) {
  const { layers, prefersReducedMotion, hover, select } = useViewerContext()
  const matRef = useRef<THREE.ShaderMaterial | null>(null)
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uColor: { value: new THREE.Color('#a880ff') },
      uIntensity: { value: bleed.intensity },
      uPulse: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
  }), [bleed.intensity])

  useEffect(() => {
    matRef.current = material
  }, [material])

  useFrame((state) => {
    if (!matRef.current) return
    const t = state.clock.elapsedTime
    const pulse = prefersReducedMotion ? 1 : Math.sin((t / bleed.pulsePeriodSec) * Math.PI * 2 + bleed.pulsePhase)
    matRef.current.uniforms.uPulse.value = pulse
  })

  if (bleed.unclassified || !layers.gu) return null

  return (
    <mesh
      position={bleed.center}
      scale={bleed.radius}
      onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'gu-bleed', id: bleed.id }); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); select({ kind: 'gu-bleed', id: bleed.id }) }}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
