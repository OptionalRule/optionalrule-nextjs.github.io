'use client'

import { Html } from '@react-three/drei'
import { Flame } from 'lucide-react'
import type { HazardVisual, SceneVec3 } from '../types'
import { useSelectionActions, useSelectionState } from '../chrome/ViewerContext'

export interface StellarBadgeProps {
  starPosition: SceneVec3
  starRadius: number
  hazards: HazardVisual[]
}

export function StellarBadge({ starPosition, starRadius, hazards }: StellarBadgeProps) {
  const { select } = useSelectionActions()
  const { selection } = useSelectionState()
  if (hazards.length === 0) return null

  const active = hazards.some((h) => selection?.kind === 'hazard' && selection?.id === h.id)
  const offset = Math.max(starRadius * 0.95, 1.4)
  const position: SceneVec3 = [starPosition[0] + offset, starPosition[1] + offset * 0.75, starPosition[2]]

  return (
    <Html position={position} center sprite zIndexRange={[100, 0]}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          select({ kind: 'hazard', id: hazards[0].id })
        }}
        aria-label={`${hazards.length} stellar hazard${hazards.length > 1 ? 's' : ''}`}
        title={hazards.map((h) => h.sourceText).join('\n')}
        className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
          active
            ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--text-primary)]'
            : 'border-[#ff8a4a]/70 bg-[#0f141c]/90 text-[#ffb27a] hover:bg-[#0f141c] hover:text-[#ffd1a5]'
        }`}
      >
        <Flame className="h-3 w-3" aria-hidden="true" />
        {hazards.length > 1 ? <span>{hazards.length}</span> : null}
      </button>
    </Html>
  )
}
