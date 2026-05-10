'use client'

import { Html } from '@react-three/drei'
import { useSelectionActions, useSelectionState, type SelectionKind } from '../../chrome/ViewerContext'
import { GLYPH_COMPONENTS, GLYPH_META } from './glyphRegistry'
import { visualForRegister } from './statusPalette'
import type { GlyphId, GlyphStatus } from './types'

export interface OverlayMarkerProps {
  position: [number, number, number]
  glyphId: GlyphId
  kind: NonNullable<SelectionKind>
  id: string
  label?: string
  status?: GlyphStatus
  size?: number
  distanceFactor?: number
  leaderOffset?: number
}

export function OverlayMarker({
  position,
  glyphId,
  kind,
  id,
  label,
  status = 'active',
  size = 28,
  distanceFactor = 60,
  leaderOffset = 22,
}: OverlayMarkerProps) {
  const { hover, select } = useSelectionActions()
  const { hovered, selection } = useSelectionState()
  const isHovered = hovered?.kind === kind && hovered.id === id
  const isSelected = selection?.kind === kind && selection.id === id

  const meta = GLYPH_META[glyphId]
  const Glyph = GLYPH_COMPONENTS[glyphId]
  const visual = visualForRegister(meta.register, status)
  const glowColor = visual.color

  const ringSize = size + 10
  const showRing = visual.showAutomatedRing
  const showLabel = isSelected && label

  return (
    <Html
      position={position}
      distanceFactor={distanceFactor}
      occlude={false}
      zIndexRange={[20, 0]}
      pointerEvents="auto"
    >
      <div style={{ position: 'relative', width: 0, height: 0 }}>
        <svg
          width={leaderOffset}
          height={leaderOffset}
          style={{
            position: 'absolute',
            left: 0,
            top: -leaderOffset,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <line
            x1={0}
            y1={leaderOffset}
            x2={leaderOffset}
            y2={0}
            stroke={glowColor}
            strokeWidth={0.8}
            opacity={0.55}
          />
        </svg>
        <div
          onPointerOver={(e) => { e.stopPropagation(); hover({ kind, id }); document.body.style.cursor = 'pointer' }}
          onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
          onClick={(e) => { e.stopPropagation(); select({ kind, id }) }}
          style={{
            position: 'absolute',
            left: leaderOffset,
            top: -leaderOffset,
            transform: isHovered || isSelected
              ? 'translateY(-100%) scale(1.15)'
              : 'translateY(-100%) scale(1)',
            transformOrigin: 'bottom left',
            color: glowColor,
            transition: 'transform 120ms ease-out, filter 120ms ease-out',
            filter: isHovered || isSelected ? `drop-shadow(0 0 4px ${glowColor})` : undefined,
            outline: isSelected ? `1px solid ${glowColor}` : undefined,
            outlineOffset: isSelected ? 4 : undefined,
            borderRadius: 4,
            padding: 2,
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 4,
          }}
        >
          <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
            {showRing ? (
              <svg
                width={ringSize}
                height={ringSize}
                viewBox="0 0 48 48"
                style={{ position: 'absolute', left: (size - ringSize) / 2, top: (size - ringSize) / 2, pointerEvents: 'none' }}
                stroke="currentColor"
                fill="none"
              >
                <circle cx={24} cy={24} r={22} strokeWidth={0.8} strokeDasharray="0.8 1.8" opacity={0.65} />
              </svg>
            ) : null}
            <Glyph size={size} dashed={visual.dashed} />
          </div>
          {showLabel ? (
            <span
              style={{
                fontSize: 10,
                lineHeight: 1.2,
                padding: '2px 6px',
                borderRadius: 3,
                background: 'rgba(15, 20, 28, 0.92)',
                border: `1px solid ${glowColor}88`,
                color: '#e8eef5',
                whiteSpace: 'nowrap',
                fontFamily: 'ui-monospace, monospace',
                letterSpacing: 0.04,
              }}
            >
              {label}
            </span>
          ) : null}
        </div>
      </div>
    </Html>
  )
}
