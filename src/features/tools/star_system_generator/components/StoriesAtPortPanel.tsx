import { Newspaper, Quote, Route, Scroll, Sparkles, Users } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import type { GeneratedSystem, SystemHook } from '../types'
import { SectionHeader, sectionShellClasses } from './visual'

type IconType = ComponentType<SVGProps<SVGSVGElement>>

interface HookGroupProps {
  title: string
  caption: string
  icon: IconType
  hooks: readonly SystemHook[]
  emphasized?: boolean
}

export function StoriesAtPortPanel({ system }: { system: GeneratedSystem }) {
  const hooks = system.hooks
  if (!hooks) return null

  const total =
    hooks.rumors.length +
    hooks.contracts.length +
    hooks.npcs.length +
    hooks.encounters.length +
    hooks.twists.length

  if (total === 0) return null

  return (
    <section id="stories-at-port" className={sectionShellClasses('human')}>
      <SectionHeader
        layer="human"
        icon={Newspaper}
        title="Stories at Port"
        caption="Session hooks — rumors, contracts, faces, encounter, twist — composed in resonance with what this system rolled."
      />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <HookGroup
          title="Rumors"
          caption="Half-confirmed dockside hearsay; some true, some cover for something true."
          icon={Quote}
          hooks={hooks.rumors}
        />
        <HookGroup
          title="Contracts on Offer"
          caption="The job somebody is willing to pay for, terms partial."
          icon={Scroll}
          hooks={hooks.contracts}
        />
        <HookGroup
          title="People You Meet"
          caption="Named faces with stakes."
          icon={Users}
          hooks={hooks.npcs}
        />
        <HookGroup
          title="Encounter en Route"
          caption="What happens between the contract and the destination."
          icon={Route}
          hooks={hooks.encounters}
        />
        <HookGroup
          title="Mid-Session Twist"
          caption="Save for the moment things should change shape."
          icon={Sparkles}
          hooks={hooks.twists}
          emphasized
        />
      </div>
    </section>
  )
}

function HookGroup({ title, caption, icon: Icon, hooks, emphasized }: HookGroupProps) {
  if (hooks.length === 0) return null
  const wrapper = emphasized
    ? 'lg:col-span-2 rounded-md border border-dashed border-[var(--accent-warm)]/40 bg-[var(--card-elevated)] p-3'
    : 'rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3'
  return (
    <section className={wrapper}>
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          <Icon aria-hidden="true" className="h-3.5 w-3.5 text-[var(--accent-warm)]" />
          {title}
        </h3>
        <span className="font-mono text-[0.62rem] uppercase tracking-wide text-[var(--text-tertiary)]">
          {hooks.length} {hooks.length === 1 ? 'pull' : 'pulls'}
        </span>
      </header>
      <p className="mt-1 text-xs italic text-[var(--text-tertiary)]">{caption}</p>
      <ul className="mt-3 space-y-2.5">
        {hooks.map((hook, index) => (
          <li
            key={`${hook.category}-${index}`}
            className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3"
          >
            <p className="flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              {hook.text.value}
            </p>
            <div className="flex shrink-0 flex-wrap gap-1">
              {hook.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--accent-warm)]/30 bg-[var(--accent-warm)]/10 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.06em] text-[var(--accent-warm)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
