'use client'

import { useEffect, useMemo } from 'react'
import type { HazardVisual } from '../types'
import { useLayers, useSelectionActions } from '../chrome/ViewerContext'
import { makeVolumetricMaterial } from './volumetricShader'
import { hazardSphereGeometry } from './renderAssets'

export function HazardVolume({ hazard }: { hazard: HazardVisual }) {
  const { layers } = useLayers()
  const { hover, select } = useSelectionActions()
  const material = useMemo(
    () => makeVolumetricMaterial({ color: '#ff5773', intensity: hazard.intensity }),
    [hazard.intensity],
  )

  useEffect(() => () => material.dispose(), [material])

  if (hazard.unclassified || !layers.physical) return null

  return (
    <mesh
      geometry={hazardSphereGeometry}
      position={hazard.center}
      scale={hazard.radius}
      dispose={null}
      onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'hazard', id: hazard.id }); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); select({ kind: 'hazard', id: hazard.id }) }}
    >
      <primitive object={material} attach="material" />
    </mesh>
  )
}
