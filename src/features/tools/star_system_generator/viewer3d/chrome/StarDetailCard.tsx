'use client'

import type { GeneratedSystem } from '../../types'
import { SpectralChip } from '../../components/visual'
import { formatStellarClass } from '../../lib/stellarLabels'

export function StarDetailCard({ system }: { system: GeneratedSystem }) {
  const star = system.primary
  const spectralValue = star.spectralType.value
  return (
    <article className="space-y-2 text-sm">
      <header>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{star.name.value}</h3>
        <p className="text-xs text-[var(--text-tertiary)]">Primary star</p>
      </header>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-[var(--text-tertiary)]">Spectral</dt>
        <dd><SpectralChip spectralType={spectralValue} label={formatStellarClass(spectralValue)} /></dd>
        <dt className="text-[var(--text-tertiary)]">Mass</dt><dd>{star.massSolar.value} M☉</dd>
        <dt className="text-[var(--text-tertiary)]">Luminosity</dt><dd>{star.luminositySolar.value} L☉</dd>
        <dt className="text-[var(--text-tertiary)]">Age</dt><dd>{star.ageState.value}</dd>
        <dt className="text-[var(--text-tertiary)]">Activity</dt><dd>{star.activity.value}</dd>
      </dl>
      {system.companions.length > 0 ? (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Companions</p>
          <ul className="mt-1 space-y-1 text-xs">
            {system.companions.map((c) => (
              <li key={c.id} className="rounded border border-[var(--border)] bg-[var(--card-elevated)] px-2 py-1">
                {c.companionType.value} · {c.separation.value}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
