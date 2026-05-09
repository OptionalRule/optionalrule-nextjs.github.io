'use client'

import type { RuinMarker } from '../types'
import { useLayers } from '../chrome/ViewerContext'
import { ruinGeometry, ruinMaterial } from './renderAssets'

export function RuinPin({ ruin }: { ruin: RuinMarker }) {
  const { layers } = useLayers()
  if (!layers.human) return null
  return (
    <mesh
      geometry={ruinGeometry}
      material={ruinMaterial}
      position={ruin.position}
      scale={1.4}
      dispose={null}
    />
  )
}
