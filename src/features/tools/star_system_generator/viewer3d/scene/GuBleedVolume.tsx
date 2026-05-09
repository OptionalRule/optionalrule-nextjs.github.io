'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { GuBleedVisual } from '../types'
import { useLayers, usePrefersReducedMotion, useSelectionActions } from '../chrome/ViewerContext'
import { makeVolumetricMaterial } from './volumetricShader'

export function GuBleedVolume({ bleed }: { bleed: GuBleedVisual }) {
  const { layers } = useLayers()
  const prefersReducedMotion = usePrefersReducedMotion()
  const { hover, select } = useSelectionActions()
  const matRef = useRef<THREE.ShaderMaterial | null>(null)
  const material = useMemo(
    () => makeVolumetricMaterial({ color: '#a880ff', intensity: bleed.intensity, pulsing: true }),
    [bleed.intensity],
  )

  useEffect(() => {
    matRef.current = material
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
      position={bleed.center}
      scale={bleed.radius}
      onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'gu-bleed', id: bleed.id }); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); select({ kind: 'gu-bleed', id: bleed.id }) }}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
