'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { GuBleedVisual } from '../types'
import { useLayers, usePrefersReducedMotion } from '../chrome/ViewerContext'
import { makeVolumetricMaterial } from './volumetricShader'
import { guBleedSphereGeometry, volumeRibbonGeometry, volumeTorusGeometry } from './renderAssets'

function geometryForBleed(bleed: GuBleedVisual) {
  if (bleed.shape === 'torus') return volumeTorusGeometry
  if (bleed.shape === 'ribbon') return volumeRibbonGeometry
  return guBleedSphereGeometry
}

export function GuBleedVolume({ bleed }: { bleed: GuBleedVisual }) {
  const { layers } = useLayers()
  const prefersReducedMotion = usePrefersReducedMotion()
  const matRef = useRef<THREE.ShaderMaterial | null>(null)
  const material = useMemo(
    () => makeVolumetricMaterial({ color: bleed.color, intensity: bleed.intensity + bleed.distortion * 0.15, pulsing: true }),
    [bleed.color, bleed.distortion, bleed.intensity],
  )

  useEffect(() => {
    matRef.current = material
    return () => {
      matRef.current = null
      material.dispose()
    }
  }, [material])

  useFrame((state) => {
    if (!matRef.current) return
    const t = state.clock.elapsedTime
    const pulse = prefersReducedMotion ? 1 : Math.sin((t / bleed.pulsePeriodSec) * Math.PI * 2 + bleed.pulsePhase)
    matRef.current.uniforms.uPulse.value = pulse
  })

  if (bleed.unclassified || !layers.gu) return null

  return (
    <mesh
      geometry={geometryForBleed(bleed)}
      position={bleed.center}
      rotation={[bleed.tilt, 0, bleed.shape === 'ribbon' ? bleed.tilt * 0.5 : 0]}
      scale={[bleed.radius * bleed.stretch[0], bleed.radius * bleed.stretch[1], bleed.radius * bleed.stretch[2]]}
      dispose={null}
      raycast={() => undefined}
    >
      <primitive object={material} attach="material" />
    </mesh>
  )
}
