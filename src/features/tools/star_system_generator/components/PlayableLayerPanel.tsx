import { Landmark, ScrollText, Zap } from 'lucide-react'
import type { GeneratedSystem } from '../types'
import { SectionHeader, sectionShellClasses } from './visual'

export function PlayableLayerPanel({ system }: { system: GeneratedSystem }) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <article className={sectionShellClasses('human')}>
        <SectionHeader
          layer="human"
          icon={ScrollText}
          title="Narrative Lines"
          caption="System-level tensions built from reusable structures."
        />
        <div className="mt-4 space-y-3">
          {system.narrativeThreads.map((thread) => (
            <div
              key={thread.id}
              className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">{thread.title.value}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{thread.domains.map((domain) => domain.value).join(' / ')}</p>
              </div>
              <p className="mt-2 leading-relaxed text-[var(--text-secondary)]">{thread.beats[0]?.text.value}</p>
              <div className="mt-3 space-y-2 border-t border-[var(--border-light)] pt-3">
                {thread.beats.slice(1).map((beat) => (
                  <p key={beat.id} className="leading-relaxed text-[var(--text-tertiary)]">
                    <span className="font-medium text-[var(--text-secondary)]">{beat.kind.replace('-', ' ')}:</span>{' '}
                    {beat.text.value}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className={sectionShellClasses('human')}>
        <SectionHeader
          layer="human"
          icon={Landmark}
          title="Human Remnants"
          caption="Sites left by earlier waves of habitation."
        />
        <div className="mt-4 space-y-3">
          {system.ruins.map((ruin) => (
            <div
              key={ruin.id}
              className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                    {ruin.remnantType.value}
                  </h3>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">{ruin.location.value}</p>
                </div>
              </div>
              <p className="mt-2 leading-relaxed text-[var(--text-secondary)]">{ruin.hook.value}</p>
            </div>
          ))}
        </div>
      </article>

      <article className={sectionShellClasses('gu')}>
        <SectionHeader
          layer="gu"
          icon={Zap}
          title="System Phenomena"
          caption="Standing oddities from the Geometric Unity layer."
        />
        <div className="mt-4 space-y-3">
          {system.phenomena.map((phenomenon) => (
            <div
              key={phenomenon.id}
              className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                  {phenomenon.phenomenon.value}
                </h3>
              </div>
              <p className="mt-2 leading-relaxed text-[var(--text-secondary)]">{phenomenon.note.value}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
