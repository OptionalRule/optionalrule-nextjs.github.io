'use client'

import type { BeltVisual } from '../types'
import { hashToUnit } from '../lib/motion'
import { BodySettlements } from './BodySettlements'

const BELT_MARKER_SIZE = 0.55

export interface BeltSettlementsProps {
  belt: BeltVisual
}

export function BeltSettlements({ belt }: BeltSettlementsProps) {
  const midRadius = (belt.innerRadius + belt.outerRadius) / 2
  const angle = hashToUnit(`belt-settlement-angle#${belt.id}`) * Math.PI * 2
  const x = Math.cos(angle) * midRadius
  const z = Math.sin(angle) * midRadius
  return (
    <group position={[x, 0, z]}>
      <BodySettlements bodyId={belt.id} bodySize={BELT_MARKER_SIZE} />
    </group>
  )
}
