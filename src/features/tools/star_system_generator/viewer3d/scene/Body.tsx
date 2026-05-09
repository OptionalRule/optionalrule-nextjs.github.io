'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BodyVisual } from '../types'
import { useLayers, usePrefersReducedMotion, useSelectionActions } from '../chrome/ViewerContext'
import { makeBodyMaterial } from './bodyShader'
import { shaderUniforms } from '../lib/bodyShading'
import { useGeneratedBodyLookup } from './bodyLookup'
import { Ring } from './Ring'
import { Moon } from './Moon'
import { SettlementPin } from './SettlementPin'
import { bodySphereGeometry } from './renderAssets'

export interface BodyProps {
  body: BodyVisual
}

export function Body({ body }: BodyProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const { layers } = useLayers()
  const prefersReducedMotion = usePrefersReducedMotion()
  const { hover, select } = useSelectionActions()
  const lookup = useGeneratedBodyLookup()
  const orbitingBody = lookup(body.id)
  const material = useMemo(() => {
    const mat = makeBodyMaterial(body)
    if (orbitingBody) {
      const u = shaderUniforms(orbitingBody)
      mat.uniforms.uBaseColor.value.set(u.baseColor)
      mat.uniforms.uSecondaryColor.value.set(u.secondaryColor)
      mat.uniforms.uAccentColor.value.set(u.accentColor)
      mat.uniforms.uNoiseScale.value = u.noiseScale
      mat.uniforms.uAtmosphere.value = u.atmosphereStrength
      mat.uniforms.uHeatTint.value = u.heatTint
      mat.uniforms.uBandStrength.value = u.bandStrength
      mat.uniforms.uBandFrequency.value = u.bandFrequency
      mat.uniforms.uWaterCoverage.value = u.waterCoverage
      mat.uniforms.uIceCoverage.value = u.iceCoverage
      mat.uniforms.uCloudStrength.value = u.cloudStrength
      mat.uniforms.uCraterStrength.value = u.craterStrength
      mat.uniforms.uVolcanicStrength.value = u.volcanicStrength
      mat.uniforms.uStormStrength.value = u.stormStrength
      mat.uniforms.uSurfaceSeed.value = u.surfaceSeed
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

  useEffect(() => () => material.dispose(), [material])

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
      <group position={[body.orbitRadius, 0, 0]}>
        {layers.physical ? (
          <>
            <mesh
              ref={meshRef}
              geometry={bodySphereGeometry}
              scale={body.visualSize}
              dispose={null}
              onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'body', id: body.id }); document.body.style.cursor = 'pointer' }}
              onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
              onClick={(e) => { e.stopPropagation(); select({ kind: 'body', id: body.id }) }}
            >
              <primitive object={material} attach="material" />
            </mesh>
            {body.rings ? <Ring ring={body.rings} /> : null}
            {body.moons.map((moon) => (
              <Moon key={moon.id} moon={moon} />
            ))}
          </>
        ) : null}
        {body.hasSettlements ? <SettlementPin size={body.visualSize} settlementIds={body.settlementIds} /> : null}
      </group>
    </group>
  )
}
