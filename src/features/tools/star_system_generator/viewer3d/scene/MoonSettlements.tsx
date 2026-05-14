'use client'

import { useLayers } from '../chrome/ViewerContext'
import { useGatesForMoon, useSettlementsForMoon } from './bodyLookup'
import { OverlayMarker } from './overlay/OverlayMarker'
import { pickGlyphForSettlement } from './overlay/pickGlyph'
import type { GlyphId, GlyphStatus } from './overlay/types'

export interface MoonSettlementsProps {
  moonId: string
  moonSize: number
}

interface MarkerSpec {
  key: string
  glyphId: GlyphId
  kind: 'settlement' | 'gate'
  id: string
  label: string
  status?: GlyphStatus
}

export function MoonSettlements({ moonId, moonSize }: MoonSettlementsProps) {
  const { layers } = useLayers()
  const settlementsByMoon = useSettlementsForMoon()
  const gatesByMoon = useGatesForMoon()
  if (!layers.human) return null

  const settlements = settlementsByMoon(moonId)
  const gates = gatesByMoon(moonId)
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

  const yBase = moonSize * 1.4
  const stepX = moonSize * 0.6
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
