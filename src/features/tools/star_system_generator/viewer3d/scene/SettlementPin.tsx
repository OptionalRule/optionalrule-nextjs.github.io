'use client'

import { useLayers, useSelectionActions } from '../chrome/ViewerContext'

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
      <mesh>
        <sphereGeometry args={[size * 0.18, 8, 8]} />
        <meshBasicMaterial color="#ff9d4a" toneMapped={false} />
      </mesh>
      <mesh position={[0, -size * 0.4, 0]}>
        <cylinderGeometry args={[size * 0.03, size * 0.03, size * 0.8, 6]} />
        <meshBasicMaterial color="#ff9d4a" toneMapped={false} />
      </mesh>
    </group>
  )
}
