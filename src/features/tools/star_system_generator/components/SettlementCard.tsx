import type { ReactNode } from 'react'
import { AlertTriangle, Building2, Cog, Drama } from 'lucide-react'
import type { Settlement } from '../types'

export function SettlementCard({ settlement }: { settlement: Settlement }) {
  return (
    <article className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-[var(--accent-warm)]">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent-warm-light)] text-[var(--accent-warm)] ring-1 ring-inset ring-[var(--accent-warm)]/25"
          aria-hidden="true"
        >
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg">
            {settlement.name.value}
          </h3>
          <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">
            <span className="font-medium text-[var(--text-secondary)]">{settlement.siteCategory.value}</span>{' '}
            <span className="text-[var(--text-tertiary)]">·</span> {settlement.location.value}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <section className="border-t border-[var(--border-light)] pt-3">
          <dl className="space-y-2">
            <InlineDetail label="Activity level" value={settlement.presence.tier.value} />
            <InlineDetail label="Anchor" value={`${settlement.anchorName.value} (${settlement.anchorKind.value})`} />
            <InlineDetail label="Placement" value={settlement.anchorDetail.value} />
            <InlineDetail label="Why here" value={settlement.whyHere.value} />
          </dl>
        </section>

        <div className="grid gap-3 lg:grid-cols-2">
          <Section title="Operations" icon={Cog} variant="card">
            <dl className="space-y-2">
              <InlineDetail label="Function" value={settlement.function.value} />
              <InlineDetail label="Scale" value={settlement.scale.value} />
              <InlineDetail label="Authority" value={settlement.authority.value} />
              <InlineDetail label="Built form" value={settlement.builtForm.value} />
            </dl>
          </Section>

          <Section title="Trouble" icon={AlertTriangle} variant="card" tone="warning">
            <dl className="space-y-2">
              <InlineDetail label="Condition" value={settlement.condition.value} />
              <InlineDetail label="Current crisis" value={settlement.crisis.value} />
              <InlineDetail label="Hidden truth" value={settlement.hiddenTruth.value} />
              <InlineDetail label="AI" value={settlement.aiSituation.value} />
            </dl>
          </Section>
        </div>

        <Section title="Adventure Texture" icon={Drama}>
          <dl className="space-y-2">
            <InlineDetail label="Tags" value={settlement.tags.map((tag) => tag.value).join(' + ')} />
            <InlineDetail label="Tag hook" value={settlement.tagHook.value} />
            <InlineDetail label="Local sites" value={settlement.encounterSites.map((site) => site.value).join(', ')} />
          </dl>
        </Section>
      </div>
    </article>
  )
}

interface SectionProps {
  title: string
  children: ReactNode
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  variant?: 'divider' | 'card'
  tone?: 'neutral' | 'warning'
}

function Section({ title, children, icon: Icon, variant = 'divider', tone = 'neutral' }: SectionProps) {
  const iconTint = tone === 'warning' ? 'text-[var(--warning)]' : 'text-[var(--accent-warm)]'
  const wrapper =
    variant === 'card'
      ? 'rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3'
      : 'border-t border-[var(--border-light)] pt-3'
  return (
    <section className={wrapper}>
      <h4 className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        <Icon aria-hidden="true" className={`h-3.5 w-3.5 ${iconTint}`} />
        {title}
      </h4>
      <div className="mt-2 text-[var(--text-primary)]">{children}</div>
    </section>
  )
}

function InlineDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="leading-snug">
      <dt className="inline font-semibold text-[var(--text-secondary)]">{label}: </dt>
      <dd className="inline text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}
