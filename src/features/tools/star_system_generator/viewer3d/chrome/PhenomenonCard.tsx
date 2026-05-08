'use client'

import type { GeneratedSystem } from '../../types'

export function PhenomenonCard({ phenomenonId, system }: { phenomenonId: string; system: GeneratedSystem }) {
  const phen = system.phenomena.find((p) => p.id === phenomenonId)
  if (!phen) return null
  return (
    <article className="space-y-2 text-sm">
      <header>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{phen.phenomenon.value}</h3>
        <p className="text-xs text-[var(--text-tertiary)]">System phenomenon</p>
      </header>
      <p className="text-xs text-[var(--text-secondary)]">{phen.note.value}</p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-[11px] text-[var(--text-secondary)]">
        <dt className="text-[var(--text-tertiary)]">Travel effect</dt><dd>{phen.travelEffect.value}</dd>
        <dt className="text-[var(--text-tertiary)]">Conflict hook</dt><dd>{phen.conflictHook.value}</dd>
        <dt className="text-[var(--text-tertiary)]">Scene anchor</dt><dd>{phen.sceneAnchor.value}</dd>
      </dl>
    </article>
  )
}
