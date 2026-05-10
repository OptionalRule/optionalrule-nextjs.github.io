'use client'

import { useLayers } from '../chrome/ViewerContext'
import { useGatesForBody, useSettlementsForBody } from './bodyLookup'
import { OverlayMarker } from './overlay/OverlayMarker'
import { pickGlyphForSettlement } from './overlay/pickGlyph'
import type { GlyphId, GlyphStatus } from './overlay/types'

export interface BodySettlementsProps {
  bodyId: string
  bodySize: number
}

interface MarkerSpec {
  key: string
  glyphId: GlyphId
  kind: 'settlement' | 'gate'
  id: string
  label: string
  status?: GlyphStatus
}

export function BodySettlements({ bodyId, bodySize }: BodySettlementsProps) {
  const { layers } = useLayers()
  const settlementsByBody = useSettlementsForBody()
  const gatesByBody = useGatesForBody()
  if (!layers.human) return null

  const settlements = settlementsByBody(bodyId)
  const gates = gatesByBody(bodyId)
  const markers: MarkerSpec[] = [
    ...settlements.map((s): MarkerSpec => {
      const { glyph, status } = pickGlyphForSettlement(s)
      return { key: s.id, glyphId: glyph, kind: 'settlement', id: s.id, label: s.name.value, status }
    }),
    ...gates.map((g): MarkerSpec => ({
      key: g.id, glyphId: 'GT', kind: 'gate', id: g.id, label: g.name.value,
    })),
  ]
  if (markers.length === 0) return null

  const yBase = bodySize * 1.0
  const stepX = bodySize * 0.45
  const startX = -((markers.length - 1) * stepX) / 2

  return (
    <>
      {markers.map((m, i) => (
        <OverlayMarker
          key={m.key}
          position={[startX + i * stepX, yBase, 0]}
          glyphId={m.glyphId}
          kind={m.kind}
          id={m.id}
          label={m.label}
          status={m.status}
        />
      ))}
    </>
  )
}
