'use client'

import type { DebrisField } from '../../types'

function humanizeShape(shape: string): string {
  return shape.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function humanizeDensity(band: string): string {
  return band.replace(/-/g, ' ')
}

function humanizeAnchor(anchor: string): string {
  return anchor.replace(/-/g, ' ')
}

export function DebrisFieldCard({ field }: { field: DebrisField }) {
  const archetype = field.archetypeName.value
  const shape = field.shape.value
  const density = field.densityBand.value
  const anchor = field.anchorMode.value
  const guCharacter = field.guCharacter.value
  const prize = field.prize.value
  const whyHere = field.whyHere.value

  return (
    <article className="space-y-2 text-sm">
      <header>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{archetype}</h3>
        <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
          Debris field · {humanizeShape(shape)}
        </p>
      </header>
      {whyHere ? (
        <p className="rounded border border-[#ff5773]/30 bg-[#ff5773]/5 px-2 py-1.5 text-xs text-[var(--text-primary)]">
          {whyHere}
        </p>
      ) : null}
      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-[11px] text-[var(--text-secondary)]">
        <dt className="text-[var(--text-tertiary)]">Density</dt><dd>{humanizeDensity(density)}</dd>
        <dt className="text-[var(--text-tertiary)]">Anchor</dt><dd>{humanizeAnchor(anchor)}</dd>
        {guCharacter ? (
          <>
            <dt className="text-[var(--text-tertiary)]">GU</dt><dd>{guCharacter}</dd>
          </>
        ) : null}
        {prize ? (
          <>
            <dt className="text-[var(--text-tertiary)]">Prize</dt><dd>{prize}</dd>
          </>
        ) : null}
      </dl>
    </article>
  )
}
