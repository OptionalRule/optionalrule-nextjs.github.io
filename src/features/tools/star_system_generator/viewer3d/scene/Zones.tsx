'use client'

import * as THREE from 'three'
import { useEffect, useMemo } from 'react'

export interface ZonesProps {
  habitableInner: number
  habitableOuter: number
}

export function Zones({ habitableInner, habitableOuter }: ZonesProps) {
  const habitableMesh = useMemo(() => {
    const inner = habitableInner
    const outer = habitableOuter
    const geo = new THREE.RingGeometry(inner, outer, 160, 12)
    geo.rotateX(-Math.PI / 2)
    const bandWidth = Math.max(outer - inner, 0.001)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color('#5fb6e8') },
        uInner: { value: inner },
        uOuter: { value: outer },
        uFadeWidth: { value: Math.min(bandWidth * 0.42, Math.max(bandWidth * 0.18, 1.2)) },
        uOpacity: { value: 0.105 },
      },
      vertexShader: `
        varying float vRadius;

        void main() {
          vRadius = length(position.xz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uInner;
        uniform float uOuter;
        uniform float uFadeWidth;
        uniform float uOpacity;
        varying float vRadius;

        void main() {
          float innerFade = smoothstep(uInner, uInner + uFadeWidth, vRadius);
          float outerFade = 1.0 - smoothstep(uOuter - uFadeWidth, uOuter, vRadius);
          float centerGlow = 0.72 + 0.28 * sin((vRadius - uInner) / max(uOuter - uInner, 0.001) * 3.14159265);
          float alpha = innerFade * outerFade * centerGlow * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    })
    return new THREE.Mesh(geo, mat)
  }, [habitableInner, habitableOuter])

  useEffect(() => () => {
    habitableMesh.geometry.dispose()
    if (Array.isArray(habitableMesh.material)) {
      habitableMesh.material.forEach((material) => material.dispose())
    } else {
      habitableMesh.material.dispose()
    }
  }, [habitableMesh])

  return (
    <primitive object={habitableMesh} />
  )
}
