'use client'

import { useEffect, useMemo } from 'react'
import type { HazardVisual } from '../types'
import { useLayers } from '../chrome/ViewerContext'
import { makeVolumetricMaterial } from './volumetricShader'
import { hazardSphereGeometry, volumeRibbonGeometry, volumeTorusGeometry } from './renderAssets'
import { OverlayMarker } from './overlay/OverlayMarker'

function geometryForHazard(hazard: HazardVisual) {
  if (hazard.shape === 'torus') return volumeTorusGeometry
  if (hazard.shape === 'ribbon') return volumeRibbonGeometry
  return hazardSphereGeometry
}

export function HazardVolume({ hazard }: { hazard: HazardVisual }) {
  const { layers } = useLayers()
  const material = useMemo(
    () => makeVolumetricMaterial({ color: hazard.color, intensity: hazard.intensity }),
    [hazard.color, hazard.intensity],
  )

  useEffect(() => () => material.dispose(), [material])

  if (hazard.unclassified || !layers.physical) return null

  return (
    <>
      <mesh
        geometry={geometryForHazard(hazard)}
        position={hazard.center}
        rotation={[hazard.tilt, 0, hazard.shape === 'ribbon' ? hazard.tilt * 0.5 : 0]}
        scale={[hazard.radius * hazard.stretch[0], hazard.radius * hazard.stretch[1], hazard.radius * hazard.stretch[2]]}
        dispose={null}
        raycast={() => undefined}
      >
        <primitive object={material} attach="material" />
      </mesh>
      <OverlayMarker
        position={hazard.center}
        glyphId="HZ"
        kind="hazard"
        id={hazard.id}
        label="Hazard"
      />
    </>
  )
}
