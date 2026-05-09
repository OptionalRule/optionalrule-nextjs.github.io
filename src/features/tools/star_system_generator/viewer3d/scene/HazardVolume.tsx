'use client'

import { useMemo } from 'react'
import type { HazardVisual } from '../types'
import { useLayers, useSelectionActions } from '../chrome/ViewerContext'
import { makeVolumetricMaterial } from './volumetricShader'

export function HazardVolume({ hazard }: { hazard: HazardVisual }) {
  const { layers } = useLayers()
  const { hover, select } = useSelectionActions()
  const material = useMemo(
    () => makeVolumetricMaterial({ color: '#ff5773', intensity: hazard.intensity }),
    [hazard.intensity],
  )

  if (hazard.unclassified || !layers.physical) return null

  return (
    <mesh
      position={hazard.center}
      scale={hazard.radius}
      onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'hazard', id: hazard.id }); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); select({ kind: 'hazard', id: hazard.id }) }}
    >
      <sphereGeometry args={[1, 24, 24]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
