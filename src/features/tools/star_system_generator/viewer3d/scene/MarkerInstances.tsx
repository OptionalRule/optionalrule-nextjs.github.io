'use client'

import type { RuinMarker } from '../types'
import { useLayers } from '../chrome/ViewerContext'
import { OverlayMarker } from './overlay/OverlayMarker'
import { useRuinLookup } from './bodyLookup'

export function RuinPins({ ruins }: { ruins: RuinMarker[] }) {
  const { layers } = useLayers()
  const lookup = useRuinLookup()
  if (!layers.human || ruins.length === 0) return null
  return (
    <>
      {ruins.map((r) => (
        <OverlayMarker
          key={r.id}
          position={r.position}
          glyphId="RU"
          kind="ruin"
          id={r.id}
          label={lookup(r.id)?.remnantType.value}
          size={r.attachedBeltId ? 20 : 24}
        />
      ))}
    </>
  )
}
