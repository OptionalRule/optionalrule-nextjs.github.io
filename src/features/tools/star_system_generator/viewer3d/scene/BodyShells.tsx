'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BodyVisual } from '../types'
import { usePrefersReducedMotion } from '../chrome/ViewerContext'
import { bodySphereGeometry } from './renderAssets'

const cloudVertex = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormal;
void main() {
  vPos = position;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const cloudFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
uniform float uSeed;
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p *= 2.04;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 unitPos = normalize(vPos);
  vec3 p = unitPos * 4.2 + vec3(uSeed + uTime * 0.015, uSeed * 0.37, uSeed * 0.61);
  float n = fbm(p);
  float bands = smoothstep(0.2, 0.8, sin(unitPos.y * 14.0 + n * 3.0) * 0.5 + 0.5);
  float alpha = smoothstep(0.48, 0.78, n + bands * 0.14) * uStrength;
  float rim = pow(1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 1.6);
  gl_FragColor = vec4(uColor, alpha * (0.25 + rim * 0.55));
}
`

export function AtmosphereShell({ body }: { body: BodyVisual }) {
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: body.surface.atmosphereColor,
    transparent: true,
    opacity: Math.min(0.32, body.surface.atmosphereStrength * 0.28),
    depthWrite: false,
    side: THREE.BackSide,
    toneMapped: false,
  }), [body.surface.atmosphereColor, body.surface.atmosphereStrength])

  useEffect(() => () => material.dispose(), [material])

  if (body.surface.atmosphereStrength <= 0.04) return null

  return (
    <mesh
      geometry={bodySphereGeometry}
      material={material}
      scale={body.visualSize * body.surface.atmosphereThickness}
      dispose={null}
    />
  )
}

export function CloudShell({ body }: { body: BodyVisual }) {
  const ref = useRef<THREE.Mesh | null>(null)
  const matRef = useRef<THREE.ShaderMaterial | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: cloudVertex,
    fragmentShader: cloudFragment,
    uniforms: {
      uColor: { value: new THREE.Color(body.surface.cloudColor) },
      uStrength: { value: body.surface.cloudStrength },
      uSeed: { value: body.surface.cloudSeed },
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
  }), [body.surface.cloudColor, body.surface.cloudSeed, body.surface.cloudStrength])

  useEffect(() => {
    matRef.current = material
    return () => {
      matRef.current = null
      material.dispose()
    }
  }, [material])

  useFrame((state, delta) => {
    if (!ref.current || !matRef.current) return
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    if (!prefersReducedMotion) ref.current.rotation.y += delta * body.surface.cloudRotationSpeed
  })

  if (body.surface.cloudStrength <= 0.04) return null

  return (
    <mesh
      ref={ref}
      geometry={bodySphereGeometry}
      material={material}
      scale={body.visualSize * 1.035}
      dispose={null}
    />
  )
}
