'use client'

import type { HazardVisual } from '../types'

export function HazardCard({ hazard }: { hazard: HazardVisual }) {
  return (
    <article className="space-y-2 text-sm">
      <header>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Hazard</h3>
        <p className="text-xs text-[var(--text-tertiary)]">
          {hazard.unclassified ? 'unanchored' : hazard.anchorDescription}
        </p>
      </header>
      <p className="rounded border border-[#ff5773]/30 bg-[#ff5773]/5 px-2 py-1.5 text-xs text-[var(--text-primary)]">
        {hazard.sourceText}
      </p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-[11px] text-[var(--text-secondary)]">
        <dt className="text-[var(--text-tertiary)]">Intensity</dt><dd>{Math.round(hazard.intensity * 100)} / 100</dd>
      </dl>
    </article>
  )
}
