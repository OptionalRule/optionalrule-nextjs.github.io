'use client'

import type { PhenomenonMarker } from '../types'
import { useLayers, useSelectionActions } from '../chrome/ViewerContext'
import { phenomenonGeometry, phenomenonMaterial } from './renderAssets'

export function PhenomenonGlyph({ phenomenon }: { phenomenon: PhenomenonMarker }) {
  const { layers } = useLayers()
  const { hover, select } = useSelectionActions()
  if (!layers.gu) return null
  return (
    <mesh
      geometry={phenomenonGeometry}
      material={phenomenonMaterial}
      position={phenomenon.position}
      scale={1.6}
      dispose={null}
      onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'phenomenon', id: phenomenon.id }); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); select({ kind: 'phenomenon', id: phenomenon.id }) }}
    />
  )
}
