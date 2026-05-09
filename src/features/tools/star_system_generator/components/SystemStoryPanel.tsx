import { Network } from 'lucide-react'
import type { GeneratedSystem } from '../types'
import { SectionHeader, sectionShellClasses } from './visual'

export function SystemStoryPanel({ system }: { system: GeneratedSystem }) {
  const story = system.systemStory
  const body = story.body.filter((paragraph) => paragraph.trim())
  const hooks = story.hooks.filter((hook) => hook.trim())
  const hasStory = Boolean(story.spineSummary || body.length || hooks.length)

  if (!hasStory) return null

  return (
    <section id="system-story" className={sectionShellClasses('human')}>
      <SectionHeader layer="human" icon={Network} title="System Story" />

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)]">
        <div className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3">
          {story.spineSummary ? (
            <p className="text-base font-semibold leading-relaxed text-[var(--text-primary)]">
              {story.spineSummary}
            </p>
          ) : null}
          {body.length ? (
            <div className={story.spineSummary ? 'mt-3 space-y-2.5' : 'space-y-2.5'}>
              {body.map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        {hooks.length ? (
          <div className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3">
            <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Hooks
            </h3>
            <ul className="mt-2 space-y-2">
              {hooks.map((hook, index) => (
                <li key={index} className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {hook}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
