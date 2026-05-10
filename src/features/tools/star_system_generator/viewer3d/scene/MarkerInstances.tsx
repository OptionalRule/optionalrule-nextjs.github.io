'use client'

import type { PhenomenonMarker, RuinMarker } from '../types'
import { useLayers } from '../chrome/ViewerContext'
import { OverlayMarker } from './overlay/OverlayMarker'
import { usePhenomenonLookup, useRuinLookup } from './bodyLookup'

export function PhenomenonGlyphs({ phenomena }: { phenomena: PhenomenonMarker[] }) {
  const { layers } = useLayers()
  const lookup = usePhenomenonLookup()
  if (!layers.gu || phenomena.length === 0) return null
  return (
    <>
      {phenomena.map((p) => (
        <OverlayMarker
          key={p.id}
          position={p.position}
          glyphId="PH"
          kind="phenomenon"
          id={p.id}
          label={lookup(p.id)?.phenomenon.value}
        />
      ))}
    </>
  )
}

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
