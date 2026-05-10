'use client'

import { useLayers } from '../chrome/ViewerContext'
import { useSettlementsForBody } from './bodyLookup'
import { OverlayMarker } from './overlay/OverlayMarker'
import { pickGlyphForSettlement } from './overlay/pickGlyph'

export interface BodySettlementsProps {
  bodyId: string
  bodySize: number
}

export function BodySettlements({ bodyId, bodySize }: BodySettlementsProps) {
  const { layers } = useLayers()
  const settlementsByBody = useSettlementsForBody()
  if (!layers.human) return null
  const settlements = settlementsByBody(bodyId)
  if (settlements.length === 0) return null

  const yBase = bodySize * 1.6
  const stepX = bodySize * 0.55
  const startX = -((settlements.length - 1) * stepX) / 2

  return (
    <>
      {settlements.map((s, i) => {
        const { glyph, status } = pickGlyphForSettlement(s)
        return (
          <OverlayMarker
            key={s.id}
            position={[startX + i * stepX, yBase, 0]}
            glyphId={glyph}
            kind="settlement"
            id={s.id}
            label={s.name.value}
            status={status}
            size={32}
          />
        )
      })}
    </>
  )
}
