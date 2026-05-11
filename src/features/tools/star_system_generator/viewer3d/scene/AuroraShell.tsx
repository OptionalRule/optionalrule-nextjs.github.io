'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BodyVisual } from '../types'
import { usePrefersReducedMotion } from '../chrome/ViewerContext'
import { bodySphereGeometry } from './renderAssets'

const auroraVertex = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormal;
void main() {
  vPos = position;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const auroraFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uMode;
uniform float uPulse;
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
  float n000 = hash(i);
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
  return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
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
  float lat = abs(unitPos.y);
  int mode = int(uMode + 0.5);

  float bandPattern;
  if (mode == 0) {
    bandPattern = smoothstep(0.55, 0.85, lat) * (1.0 - smoothstep(0.92, 1.0, lat));
  } else if (mode == 1) {
    float n = fbm(unitPos * 4.0 + vec3(uTime * 0.05, 0.0, 0.0));
    bandPattern = smoothstep(0.52, 0.82, n);
  } else if (mode == 2) {
    float lng = atan(unitPos.z, unitPos.x);
    bandPattern = smoothstep(0.55, 0.85, abs(sin(lng * 6.0))) * (1.0 - smoothstep(0.85, 1.0, lat));
  } else if (mode == 3) {
    bandPattern = smoothstep(0.30, 0.95, unitPos.y);
  } else {
    bandPattern = smoothstep(0.35, 0.58, lat) * (1.0 - smoothstep(0.58, 0.78, lat));
  }

  float modulation = fbm(unitPos * 5.0 + vec3(uTime * 0.02, 0.0, 0.0));
  bandPattern *= 0.6 + 0.4 * modulation;

  float pulse = mix(1.0, 0.45 + 0.55 * sin(uTime * 1.2), uPulse);

  vec3 lightDir = normalize(vec3(0.6, 0.4, 0.5));
  float light = clamp(dot(vNormal, lightDir), 0.0, 1.0);
  float night = smoothstep(0.5, 0.0, light);
  float fresnel = pow(1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 1.4);

  float alpha = uIntensity * bandPattern * pulse * fresnel * (0.4 + 0.6 * night);
  gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
}
`

export function AuroraShell({ body }: { body: BodyVisual }) {
  const ref = useRef<THREE.Mesh | null>(null)
  const matRef = useRef<THREE.ShaderMaterial | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: auroraVertex,
    fragmentShader: auroraFragment,
    uniforms: {
      uColor: { value: new THREE.Color(body.surface.auroraColor) },
      uIntensity: { value: body.surface.auroraIntensity },
      uMode: { value: body.surface.auroraMode },
      uPulse: { value: body.surface.auroraPulse },
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [body.surface.auroraColor, body.surface.auroraIntensity, body.surface.auroraMode, body.surface.auroraPulse])

  useEffect(() => {
    matRef.current = material
    return () => {
      matRef.current = null
      material.dispose()
    }
  }, [material])

  useFrame((state) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = prefersReducedMotion ? 0 : state.clock.elapsedTime
  })

  if (body.surface.auroraIntensity <= 0.001) return null

  return (
    <mesh
      ref={ref}
      geometry={bodySphereGeometry}
      material={material}
      scale={body.visualSize * 1.045}
      rotation={[body.surface.auroraAxisOffset, 0, body.surface.auroraAxisOffset * 0.5]}
      dispose={null}
    />
  )
}
