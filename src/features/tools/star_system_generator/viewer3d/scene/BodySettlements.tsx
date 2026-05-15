'use client'

import { useLayers } from '../chrome/ViewerContext'
import { useGatesForBody, useGeneratedBodyLookup, useSettlementsForBody } from './bodyLookup'
import { OverlayMarker } from './overlay/OverlayMarker'
import { pickGlyphForSettlement } from './overlay/pickGlyph'
import { pickHabitationGlyph } from './overlay/pickHabitation'
import type { GlyphId, GlyphStatus } from './overlay/types'

export interface BodySettlementsProps {
  bodyId: string
  bodySize: number
}

interface MarkerSpec {
  key: string
  glyphId: GlyphId
  kind: 'settlement' | 'gate' | 'body'
  id: string
  label: string
  status?: GlyphStatus
  size?: number
}

export function BodySettlements({ bodyId, bodySize }: BodySettlementsProps) {
  const { layers } = useLayers()
  const settlementsByBody = useSettlementsForBody()
  const gatesByBody = useGatesForBody()
  const lookupBody = useGeneratedBodyLookup()
  if (!layers.human) return null

  const settlements = settlementsByBody(bodyId)
  const gates = gatesByBody(bodyId)
  const body = lookupBody(bodyId)
  const habitation = body?.population?.value ? pickHabitationGlyph(body.population.value) : null

  const markers: MarkerSpec[] = [
    ...settlements.map((s): MarkerSpec => {
      const { glyph, status } = pickGlyphForSettlement(s)
      return { key: s.id, glyphId: glyph, kind: 'settlement', id: s.id, label: s.name.value, status }
    }),
    ...gates.map((g): MarkerSpec => ({
      key: g.id, glyphId: 'GT', kind: 'gate', id: g.id, label: g.name.value,
    })),
  ]
  if (habitation) {
    markers.push({
      key: `${bodyId}-habitation`,
      glyphId: habitation.glyph,
      kind: 'body',
      id: bodyId,
      label: `${body!.name.value} — inhabited body`,
      status: habitation.status,
      size: habitation.dominant ? 32 : 22,
    })
  }
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
          size={m.size}
        />
      ))}
    </>
  )
}
