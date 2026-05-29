'use client'

import * as THREE from 'three'
import { useEffect, useMemo } from 'react'

export interface OrbitProps {
  radius: number
  tiltY?: number
  color: string
  opacity?: number
  dashed?: boolean
}

const glowVertexShader = /* glsl */ `
  varying float vRadial;
  uniform float uInner;
  uniform float uOuter;

  void main() {
    float r = length(position.xy);
    vRadial = clamp((r - uInner) / max(uOuter - uInner, 0.0001), 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const glowFragmentShader = /* glsl */ `
  varying float vRadial;
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    // Triangular falloff peaking at the true orbit radius, eased to a soft edge.
    float band = 1.0 - abs(vRadial - 0.5) * 2.0;
    band = smoothstep(0.0, 1.0, band);
    float alpha = pow(band, 1.6) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`

export function Orbit({ radius, tiltY = 0, color, opacity = 0.55, dashed = false }: OrbitProps) {
  const points = useMemo(() => {
    const out: THREE.Vector3[] = []
    const segments = 128
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      out.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    return out
  }, [radius])

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])
  const material = useMemo(() => {
    const mat = dashed
      ? new THREE.LineDashedMaterial({ color: new THREE.Color(color), dashSize: 1.2, gapSize: 1.5, transparent: true, opacity })
      : new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity })
    return mat
  }, [color, opacity, dashed])

  const line = useMemo(() => {
    const object = new THREE.Line(geometry, material)
    if (dashed) object.computeLineDistances()
    return object
  }, [geometry, material, dashed])

  // Soft glow band sitting under the crisp line, giving orbits a designed neon
  // feel instead of a bare wireframe. Width scales gently with radius so distant
  // orbits stay visible without the inner ones becoming fat.
  const halfWidth = useMemo(() => THREE.MathUtils.clamp(radius * 0.02, 0.35, 1.4), [radius])
  const glowGeometry = useMemo(
    () => new THREE.RingGeometry(radius - halfWidth, radius + halfWidth, 128, 1),
    [radius, halfWidth],
  )
  const glowMaterial = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity * 0.5 },
        uInner: { value: radius - halfWidth },
        uOuter: { value: radius + halfWidth },
      },
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    [color, opacity, radius, halfWidth],
  )

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
    glowGeometry.dispose()
    glowMaterial.dispose()
  }, [geometry, material, glowGeometry, glowMaterial])

  return (
    <group rotation={[tiltY, 0, 0]}>
      <mesh geometry={glowGeometry} material={glowMaterial} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1} />
      <primitive object={line} />
    </group>
  )
}
