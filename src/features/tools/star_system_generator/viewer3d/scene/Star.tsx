'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { StarVisual } from '../types'
import { starGlowPlaneGeometry, starSphereGeometry } from './renderAssets'

export interface StarProps {
  star: StarVisual
}

const surfaceVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const surfaceFragmentShader = `
  uniform vec3 uCoreColor;
  uniform vec3 uEdgeColor;
  uniform vec3 uHotColor;
  uniform float uActivity;
  uniform float uGranulationScale;
  uniform float uGranulationStrength;
  uniform float uLimbPower;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z
    );
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float facing = clamp(dot(normal, viewDirection), 0.0, 1.0);
    float limb = pow(1.0 - facing, uLimbPower);

    vec3 drift = vec3(uTime * 0.035, -uTime * 0.022, uTime * 0.017);
    float largeCells = noise(normal * uGranulationScale + drift);
    float fineCells = noise(normal * uGranulationScale * 2.7 - drift.yzx * 1.4);
    float cells = smoothstep(0.28, 0.82, largeCells) * 0.72 + fineCells * 0.28;
    float heat = (cells - 0.48) * uGranulationStrength;

    vec3 color = mix(uEdgeColor, uCoreColor, facing * 0.96 + 0.04);
    color += uHotColor * max(heat, 0.0) * (0.26 + uActivity * 0.28);
    color *= 1.0 - min(0.36, limb * 0.32);
    color = mix(color, uEdgeColor, limb * (0.3 + uActivity * 0.16));

    gl_FragColor = vec4(color, 1.0);
  }
`

const coronaVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const coronaFragmentShader = `
  uniform vec3 uColor;
  uniform float uActivity;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  float hash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float facing = clamp(dot(normal, viewDirection), 0.0, 1.0);
    float rim = pow(1.0 - facing, 2.25);
    float texture = 0.72 + hash(normal * 8.0 + vec3(uTime * 0.12)) * 0.28;
    float alpha = rim * texture * uOpacity * (0.7 + uActivity * 0.45);
    gl_FragColor = vec4(uColor, alpha);
  }
`

const glowVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const glowFragmentShader = `
  uniform vec3 uCoreColor;
  uniform vec3 uCoronaColor;
  uniform float uFalloff;
  uniform float uOpacity;
  uniform float uStreak;
  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - vec2(0.5);
    float distanceFromCenter = length(centered) * 2.0;
    float radial = pow(max(0.0, 1.0 - distanceFromCenter), uFalloff);
    float softEdge = smoothstep(1.0, 0.72, distanceFromCenter);
    float horizontal = pow(max(0.0, 1.0 - abs(centered.y) * 2.0), 22.0) * pow(max(0.0, 1.0 - abs(centered.x) * 2.0), 0.72);
    float vertical = pow(max(0.0, 1.0 - abs(centered.x) * 2.0), 30.0) * pow(max(0.0, 1.0 - abs(centered.y) * 2.0), 1.1) * 0.18;
    float streak = (horizontal + vertical) * uStreak * softEdge;
    float alpha = min(1.0, radial * uOpacity + streak);
    vec3 color = mix(uCoronaColor, uCoreColor, smoothstep(0.62, 1.0, radial));
    gl_FragColor = vec4(color, alpha);
  }
`

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function Star({ star }: StarProps) {
  const billboardRef = useRef<THREE.Group | null>(null)
  const coreSize = star.coronaRadius * 0.48
  const activity = clamp(star.bloomStrength / 1.2, 0.12, 1.35)
  const surfaceMaterial = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: {
        uActivity: { value: activity },
        uCoreColor: { value: new THREE.Color(star.coreColor) },
        uEdgeColor: { value: new THREE.Color(star.coronaColor) },
        uGranulationScale: { value: 5.5 + star.rayCount * 0.36 },
        uGranulationStrength: { value: 0.5 + star.flareStrength * 0.55 },
        uHotColor: { value: new THREE.Color('#ffffff') },
        uLimbPower: { value: 1.55 + star.flareStrength * 0.28 },
        uTime: { value: 0 },
      },
      vertexShader: surfaceVertexShader,
      fragmentShader: surfaceFragmentShader,
      toneMapped: false,
    }),
    [activity, star.coreColor, star.coronaColor, star.flareStrength, star.rayCount],
  )
  const coronaMaterial = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: {
        uActivity: { value: activity },
        uColor: { value: new THREE.Color(star.coronaColor) },
        uOpacity: { value: 0.2 + star.bloomStrength * 0.08 },
        uTime: { value: 0 },
      },
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      toneMapped: false,
    }),
    [activity, star.bloomStrength, star.coronaColor],
  )
  const innerGlowMaterial = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: {
        uCoreColor: { value: new THREE.Color(star.coreColor) },
        uCoronaColor: { value: new THREE.Color(star.coronaColor) },
        uFalloff: { value: 1.8 },
        uOpacity: { value: 0.35 + star.bloomStrength * 0.18 },
        uStreak: { value: 0.12 + star.flareStrength * 0.28 },
      },
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    [star.bloomStrength, star.coreColor, star.coronaColor, star.flareStrength],
  )
  const outerGlowMaterial = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: {
        uCoreColor: { value: new THREE.Color(star.coreColor) },
        uCoronaColor: { value: new THREE.Color(star.coronaColor) },
        uFalloff: { value: 2.9 },
        uOpacity: { value: 0.16 + star.bloomStrength * 0.1 },
        uStreak: { value: 0.035 + star.flareStrength * 0.06 },
      },
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    [star.bloomStrength, star.coreColor, star.coronaColor, star.flareStrength],
  )
  const prominenceMaterial = useMemo(
    () => new THREE.LineBasicMaterial({
      color: star.rayColor,
      transparent: true,
      opacity: 0.18 + star.flareStrength * 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
    [star.flareStrength, star.rayColor],
  )
  const prominenceGeometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    const count = Math.max(5, Math.min(14, star.rayCount))
    for (let i = 0; i < count; i++) {
      const baseAngle = (i / count) * Math.PI * 2
      const arc = 0.18 + (i % 4) * 0.055
      const lift = coreSize * (0.05 + (i % 3) * 0.018)
      const segments = 5
      for (let j = 0; j < segments; j++) {
        const t0 = j / segments
        const t1 = (j + 1) / segments
        const a0 = baseAngle + (t0 - 0.5) * arc
        const a1 = baseAngle + (t1 - 0.5) * arc
        const r0 = coreSize * 1.02 + Math.sin(t0 * Math.PI) * lift
        const r1 = coreSize * 1.02 + Math.sin(t1 * Math.PI) * lift
        points.push(new THREE.Vector3(Math.cos(a0) * r0, Math.sin(a0) * r0, 0))
        points.push(new THREE.Vector3(Math.cos(a1) * r1, Math.sin(a1) * r1, 0))
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [coreSize, star.rayCount])

  useEffect(() => () => {
    coronaMaterial.dispose()
    innerGlowMaterial.dispose()
    outerGlowMaterial.dispose()
    prominenceGeometry.dispose()
    prominenceMaterial.dispose()
    surfaceMaterial.dispose()
  }, [coronaMaterial, innerGlowMaterial, outerGlowMaterial, prominenceGeometry, prominenceMaterial, surfaceMaterial])

  useFrame((state) => {
    surfaceMaterial.uniforms.uTime.value = state.clock.elapsedTime
    coronaMaterial.uniforms.uTime.value = state.clock.elapsedTime
    const pulse = 1 + Math.sin(state.clock.elapsedTime * star.pulseSpeed) * 0.04 * star.flareStrength
    if (!billboardRef.current) return
    billboardRef.current.scale.setScalar(pulse)
    billboardRef.current.lookAt(state.camera.position)
  })

  return (
    <group position={star.position}>
      <group ref={billboardRef}>
        <mesh geometry={starGlowPlaneGeometry} material={outerGlowMaterial} scale={star.coronaRadius * 4.2} renderOrder={-2} dispose={null} />
        <mesh geometry={starGlowPlaneGeometry} material={innerGlowMaterial} scale={star.coronaRadius * 2.25} renderOrder={-1} dispose={null} />
        <lineSegments geometry={prominenceGeometry} material={prominenceMaterial} renderOrder={1} dispose={null} />
      </group>
      <mesh geometry={starSphereGeometry} material={surfaceMaterial} scale={coreSize} dispose={null} />
      <mesh geometry={starSphereGeometry} material={coronaMaterial} scale={coreSize * 1.16} dispose={null} />
    </group>
  )
}
