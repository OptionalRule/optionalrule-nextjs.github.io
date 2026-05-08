'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BodyVisual } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'
import { makeBodyMaterial } from './bodyShader'
import { shaderUniforms } from '../lib/bodyShading'
import { useGeneratedBodyLookup } from './bodyLookup'
import { Ring } from './Ring'
import { Moon } from './Moon'

export interface BodyProps {
  body: BodyVisual
}

export function Body({ body }: BodyProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const { prefersReducedMotion } = useViewerContext()
  const lookup = useGeneratedBodyLookup()
  const orbitingBody = lookup(body.id)
  const material = useMemo(() => {
    const mat = makeBodyMaterial(body)
    if (orbitingBody) {
      const u = shaderUniforms(orbitingBody)
      mat.uniforms.uBaseColor.value.set(u.baseColor)
      mat.uniforms.uNoiseScale.value = u.noiseScale
      mat.uniforms.uAtmosphere.value = u.atmosphereStrength
      mat.uniforms.uHeatTint.value = u.heatTint
      mat.uniforms.uBandStrength.value = u.bandStrength
    }
    return mat
  }, [body, orbitingBody])

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    const speed = prefersReducedMotion ? 0 : body.angularSpeed
    groupRef.current.rotation.y -= speed * delta
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.3
  })

  return (
    <group ref={groupRef} rotation={[body.orbitTiltY, body.phase0, 0]}>
      <mesh ref={meshRef} position={[body.orbitRadius, 0, 0]}>
        <sphereGeometry args={[body.visualSize, 32, 32]} />
        <primitive object={material} attach="material" />
        {body.rings ? <Ring ring={body.rings} /> : null}
        {body.moons.map((moon) => (
          <Moon key={moon.id} moon={moon} />
        ))}
      </mesh>
    </group>
  )
}
