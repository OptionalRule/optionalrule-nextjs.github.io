'use client'

import { useState } from 'react'
import type { GeneratedSystem, StellarCompanion } from '../types'
import { formatStellarClass } from '../lib/stellarLabels'
import { SpectralChip, sectionShellClasses } from './visual'

interface CompanionSubSystemProps {
  system: GeneratedSystem
  companion: StellarCompanion
}

export function CompanionSubSystem({ system: _system, companion }: CompanionSubSystemProps) {
  const [expanded, setExpanded] = useState(false)
  const sub = companion.subSystem
  if (!sub) return null

  const bodyCount = sub.bodies.length
  const settlementCount = sub.settlements.length
  const gateCount = sub.gates.length

  return (
    <section className={sectionShellClasses('physical')}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={expanded}
      >
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {companion.star.name.value}{' '}
            <span className="font-normal text-[var(--text-tertiary)]">· companion sub-system</span>
          </h2>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {bodyCount} {bodyCount === 1 ? 'body' : 'bodies'} · {settlementCount} settlements · {gateCount} gates
          </p>
        </div>
        <SpectralChip
          spectralType={companion.star.spectralType.value}
          label={formatStellarClass(companion.star.spectralType.value)}
        />
      </button>

      {expanded ? (
        <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
          <p>
            Mass {companion.star.massSolar.value} M☉ · Luminosity {companion.star.luminositySolar.value} L☉ · Age{' '}
            {companion.star.ageState.value}
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            HZ {sub.zones.habitableInnerAu.value}–{sub.zones.habitableOuterAu.value} AU · Snow line{' '}
            {sub.zones.snowLineAu.value} AU
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {sub.bodies.map((body) => (
              <li key={body.id}>
                <span className="font-mono">{body.orbitAu.value} AU</span> — {body.name.value} ({body.category.value})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
