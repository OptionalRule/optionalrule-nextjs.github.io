'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BodyVisual } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'
import { makeBodyMaterial } from './bodyShader'
import { shaderUniforms } from '../lib/bodyShading'
import { useGeneratedBodyLookup } from './bodyLookup'
import { Ring } from './Ring'
import { Moon } from './Moon'
import { SettlementPin } from './SettlementPin'

export interface BodyProps {
  body: BodyVisual
}

export function Body({ body }: BodyProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const { prefersReducedMotion, hover, select } = useViewerContext()
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

  const worldPos = useMemo(() => new THREE.Vector3(), [])
  const posTuple = useRef<[number, number, number]>([0, 0, 0])

  useEffect(() => {
    const dict = window as Window & { __viewer3dBodyPositions?: Record<string, [number, number, number]> }
    if (!dict.__viewer3dBodyPositions) dict.__viewer3dBodyPositions = {}
    dict.__viewer3dBodyPositions[body.id] = posTuple.current
    return () => { delete dict.__viewer3dBodyPositions?.[body.id] }
  }, [body.id])

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    const speed = prefersReducedMotion ? 0 : body.angularSpeed
    groupRef.current.rotation.y -= speed * delta
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
      meshRef.current.getWorldPosition(worldPos)
      posTuple.current[0] = worldPos.x
      posTuple.current[1] = worldPos.y
      posTuple.current[2] = worldPos.z
    }
  })

  return (
    <group ref={groupRef} rotation={[body.orbitTiltY, body.phase0, 0]}>
      <mesh
        ref={meshRef}
        position={[body.orbitRadius, 0, 0]}
        onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'body', id: body.id }); document.body.style.cursor = 'pointer' }}
        onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); select({ kind: 'body', id: body.id }) }}
      >
        <sphereGeometry args={[body.visualSize, 32, 32]} />
        <primitive object={material} attach="material" />
        {body.rings ? <Ring ring={body.rings} /> : null}
        {body.moons.map((moon) => (
          <Moon key={moon.id} moon={moon} />
        ))}
        {body.hasSettlements ? <SettlementPin size={body.visualSize} settlementIds={body.settlementIds} /> : null}
      </mesh>
    </group>
  )
}
