'use client'

import { useLayers, useSelectionActions } from '../chrome/ViewerContext'
import { settlementPinHeadGeometry, settlementPinMaterial, settlementPinStemGeometry } from './renderAssets'

export interface SettlementPinProps {
  size: number
  settlementIds: string[]
}

export function SettlementPin({ size, settlementIds }: SettlementPinProps) {
  const { layers } = useLayers()
  const { hover, select } = useSelectionActions()
  if (!layers.human) return null
  const primary = settlementIds[0]
  return (
    <group
      position={[0, size * 1.6, 0]}
      onPointerOver={(e) => { e.stopPropagation(); if (primary) hover({ kind: 'settlement', id: primary }); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); if (primary) select({ kind: 'settlement', id: primary }) }}
    >
      <mesh
        geometry={settlementPinHeadGeometry}
        material={settlementPinMaterial}
        scale={size * 0.18}
        dispose={null}
      />
      <mesh
        geometry={settlementPinStemGeometry}
        material={settlementPinMaterial}
        position={[0, -size * 0.4, 0]}
        scale={[size * 0.03, size * 0.8, size * 0.03]}
        dispose={null}
      />
    </group>
  )
}
