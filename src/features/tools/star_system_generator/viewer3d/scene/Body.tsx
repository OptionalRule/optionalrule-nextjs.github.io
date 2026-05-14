'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BodyVisual } from '../types'
import { useLayers, usePrefersReducedMotion, useSelectionActions, useSelectionState } from '../chrome/ViewerContext'
import { makeBodyMaterial } from './bodyShader'
import { shaderUniforms } from '../lib/bodyShading'
import { useGeneratedBodyLookup } from './bodyLookup'
import { Ring } from './Ring'
import { Moon } from './Moon'
import { BodySettlements } from './BodySettlements'
import { bodySphereGeometry, invisibleHitMaterial } from './renderAssets'
import { AtmosphereShell, CloudShell } from './BodyShells'
import { AuroraShell } from './AuroraShell'
import { MoonOrbit } from './MoonOrbit'

export interface BodyProps {
  body: BodyVisual
}

function hashToUnit(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 10000) / 10000
}

export function Body({ body }: BodyProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const { layers } = useLayers()
  const prefersReducedMotion = usePrefersReducedMotion()
  const { hover, select } = useSelectionActions()
  const { selection, hovered } = useSelectionState()
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
      mat.uniforms.uSurfaceSeed.value = body.surface?.surfaceSeed || u.surfaceSeed
      mat.uniforms.uReliefStrength.value = body.surface?.reliefStrength ?? 0.15
      mat.uniforms.uNightLightStrength.value = body.surface?.nightLightStrength ?? 0
      mat.uniforms.uCityLightColor.value.set(body.surface?.cityLightColor ?? '#ffb15c')
      mat.uniforms.uMineralTint.value.set(u.mineralTint)
      mat.uniforms.uMineralBlend.value = u.mineralBlend
      mat.uniforms.uHazardTint.value.set(u.hazardTint)
      mat.uniforms.uHazardBlend.value = u.hazardBlend
      mat.uniforms.uTopographyMode.value = u.topographyMode
      mat.uniforms.uTopographyStrength.value = u.topographyStrength
      mat.uniforms.uShimmerColor.value.set(u.shimmerColor)
      mat.uniforms.uShimmerStrength.value = u.shimmerStrength
      mat.uniforms.uAmbientLevel.value = u.ambientLevel
      mat.uniforms.uVegetationMask.value = u.vegetationMask
      mat.uniforms.uVegetationColor.value.set(u.vegetationColor)
      mat.uniforms.uVegetationLatitudeBias.value = u.vegetationLatitudeBias
      mat.uniforms.uIceCapAsymmetry.value = u.iceCapAsymmetry
      mat.uniforms.uDarkSectorStrength.value = body.surface?.darkSectorStrength ?? 0
    }
    return mat
  }, [body, orbitingBody])

  const worldPos = useMemo(() => new THREE.Vector3(), [])
  const posTuple = useRef<[number, number, number]>([0, 0, 0])
  const isInspected = selection?.kind === 'body' && selection.id === body.id
  const isHovered = hovered?.kind === 'body' && hovered.id === body.id
  const showMoonOrbits = layers.moonOrbits || isInspected || isHovered
  const spinRate = useMemo(() => {
    const jitter = hashToUnit(`${body.id}#spin-rate`)
    const direction = hashToUnit(`${body.id}#spin-direction`) > 0.18 ? 1 : -1
    return (0.055 + jitter * 0.11) * direction
  }, [body.id])
  const hitScale = Math.max(body.visualSize * 1.38, Math.min(1.1, body.visualSize + 0.55))
  const highlightMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#8fd6ff',
    transparent: true,
    opacity: isHovered ? 0.24 : 0,
    wireframe: true,
    depthWrite: false,
    toneMapped: false,
  }), [isHovered])

  useEffect(() => {
    const dict = window as Window & {
      __viewer3dBodyPositions?: Record<string, [number, number, number]>
      __viewer3dBodySizes?: Record<string, number>
    }
    if (!dict.__viewer3dBodyPositions) dict.__viewer3dBodyPositions = {}
    if (!dict.__viewer3dBodySizes) dict.__viewer3dBodySizes = {}
    dict.__viewer3dBodyPositions[body.id] = posTuple.current
    dict.__viewer3dBodySizes[body.id] = body.visualSize
    return () => {
      delete dict.__viewer3dBodyPositions?.[body.id]
      delete dict.__viewer3dBodySizes?.[body.id]
    }
  }, [body.id, body.visualSize])

  useEffect(() => () => material.dispose(), [material])
  useEffect(() => () => highlightMaterial.dispose(), [highlightMaterial])

  useFrame((_state, delta) => {
    if (!groupRef.current) return
    const speed = prefersReducedMotion ? 0 : body.angularSpeed
    groupRef.current.rotation.y -= speed * delta
    if (meshRef.current) {
      if (!prefersReducedMotion) meshRef.current.rotation.y += delta * spinRate
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
            <mesh
              geometry={bodySphereGeometry}
              material={invisibleHitMaterial}
              scale={hitScale}
              dispose={null}
              onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'body', id: body.id }); document.body.style.cursor = 'pointer' }}
              onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
              onClick={(e) => { e.stopPropagation(); select({ kind: 'body', id: body.id }) }}
            />
            {isHovered ? (
              <mesh
                geometry={bodySphereGeometry}
                material={highlightMaterial}
                scale={body.visualSize * 1.18}
                renderOrder={2}
                dispose={null}
              />
            ) : null}
            {body.surface ? (
              <>
                <AtmosphereShell body={body} />
                <CloudShell body={body} />
                <AuroraShell body={body} />
              </>
            ) : null}
            {body.rings ? <Ring ring={body.rings} /> : null}
            {showMoonOrbits ? body.moons.map((moon) => (
              <MoonOrbit key={`moon-orbit-${moon.id}`} moon={moon} parentSize={body.visualSize} />
            )) : null}
            {body.moons.map((moon) => (
              <Moon key={moon.id} moon={moon} />
            ))}
          </>
        ) : null}
        {body.hasSettlements || body.gateIds.length > 0 ? <BodySettlements bodyId={body.id} bodySize={body.visualSize} /> : null}
      </group>
    </group>
  )
}
