'use client'

import { useEffect, useMemo } from 'react'
import type { HazardVisual } from '../types'
import { useLayers, useSelectionActions } from '../chrome/ViewerContext'
import { makeVolumetricMaterial } from './volumetricShader'
import { hazardSphereGeometry, volumeRibbonGeometry, volumeTorusGeometry } from './renderAssets'

function geometryForHazard(hazard: HazardVisual) {
  if (hazard.shape === 'torus') return volumeTorusGeometry
  if (hazard.shape === 'ribbon') return volumeRibbonGeometry
  return hazardSphereGeometry
}

export function HazardVolume({ hazard }: { hazard: HazardVisual }) {
  const { layers } = useLayers()
  const { hover, select } = useSelectionActions()
  const material = useMemo(
    () => makeVolumetricMaterial({ color: hazard.color, intensity: hazard.intensity }),
    [hazard.color, hazard.intensity],
  )

  useEffect(() => () => material.dispose(), [material])

  if (hazard.unclassified || !layers.physical) return null

  return (
    <mesh
      geometry={geometryForHazard(hazard)}
      position={hazard.center}
      rotation={[hazard.tilt, 0, hazard.shape === 'ribbon' ? hazard.tilt * 0.5 : 0]}
      scale={[hazard.radius * hazard.stretch[0], hazard.radius * hazard.stretch[1], hazard.radius * hazard.stretch[2]]}
      dispose={null}
      onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'hazard', id: hazard.id }); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); select({ kind: 'hazard', id: hazard.id }) }}
    >
      <primitive object={material} attach="material" />
    </mesh>
  )
}
