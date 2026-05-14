'use client'

import * as THREE from 'three'
import { useEffect, useMemo } from 'react'

export interface StarfieldProps {
  radius: number
  count: number
}

function hashUnit(n: number, salt: number): number {
  let h = (n + 1) * 374761393 + salt * 668265263
  h = (h ^ (h >>> 13)) * 1274126177
  h = h ^ (h >>> 16)
  return ((h >>> 0) % 1_000_000) / 1_000_000
}

const STAR_PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [1.00, 1.00, 1.00],
  [1.00, 1.00, 1.00],
  [1.00, 1.00, 1.00],
  [1.00, 1.00, 1.00],
  [1.00, 1.00, 1.00],
  [1.00, 1.00, 1.00],
  [0.86, 0.92, 1.00],
  [0.92, 0.96, 1.00],
  [1.00, 0.97, 0.86],
  [1.00, 0.85, 0.72],
]

const STARFIELD_VERTEX_SHADER = /* glsl */ `
attribute float aSize;
attribute float aBrightness;
attribute vec3 aColor;
varying float vBrightness;
varying vec3 vColor;
void main() {
  vBrightness = aBrightness;
  vColor = aColor;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize;
}
`

const STARFIELD_FRAGMENT_SHADER = /* glsl */ `
varying float vBrightness;
varying vec3 vColor;
void main() {
  vec2 d = gl_PointCoord - vec2(0.5);
  float dist = length(d);
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.05, dist) * vBrightness;
  gl_FragColor = vec4(vColor, alpha);
}
`

export function Starfield({ radius, count }: StarfieldProps) {
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const brightness = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const u = hashUnit(i, 1)
      const v = hashUnit(i, 2)
      const rJitter = hashUnit(i, 3)
      const sizeJitter = hashUnit(i, 4)
      const brightJitter = hashUnit(i, 5)
      const paletteRoll = hashUnit(i, 6)
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const r = radius * (0.85 + rJitter * 0.3)
      positions[3 * i] = r * Math.sin(phi) * Math.cos(theta)
      positions[3 * i + 1] = r * Math.cos(phi)
      positions[3 * i + 2] = r * Math.sin(phi) * Math.sin(theta)
      sizes[i] = 1.1 + sizeJitter * 1.4
      brightness[i] = 0.45 + brightJitter * 0.55
      const color = STAR_PALETTE[Math.floor(paletteRoll * STAR_PALETTE.length)]
      colors[3 * i] = color[0]
      colors[3 * i + 1] = color[1]
      colors[3 * i + 2] = color[2]
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.ShaderMaterial({
      vertexShader: STARFIELD_VERTEX_SHADER,
      fragmentShader: STARFIELD_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    })
    return { geometry: geo, material: mat }
  }, [radius, count])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  return <points geometry={geometry} material={material} />
}
