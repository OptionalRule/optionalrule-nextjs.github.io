import type { Settlement } from '../types'
import type { ReactNode } from 'react'
import { ConfidenceBadge } from './ConfidenceBadge'

export function SettlementCard({ settlement }: { settlement: Settlement }) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{settlement.name.value}</h3>
          <p className="text-sm text-[var(--text-tertiary)]">
            {settlement.siteCategory.value} · {settlement.location.value}
          </p>
        </div>
        <ConfidenceBadge confidence={settlement.name.confidence} />
      </div>

      <div className="mt-4 space-y-4 text-sm">
        <Section title="Why It Exists">
          <dl className="space-y-2">
            <InlineDetail label="Presence" value={`${settlement.presence.score.value} (${settlement.presence.tier.value})`} />
            <InlineDetail label="Presence roll" value={`${settlement.presence.roll.value}`} />
            <InlineDetail label="Anchor" value={`${settlement.anchorName.value} (${settlement.anchorKind.value})`} />
            <InlineDetail label="Placement" value={settlement.anchorDetail.value} />
            <InlineDetail label="Why here" value={settlement.whyHere.value} />
          </dl>
        </Section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Operations">
            <dl className="space-y-2">
              <InlineDetail label="Function" value={settlement.function.value} />
              <InlineDetail label="Scale" value={settlement.scale.value} />
              <InlineDetail label="Authority" value={settlement.authority.value} />
              <InlineDetail label="Built form" value={settlement.builtForm.value} />
            </dl>
          </Section>

          <Section title="Trouble">
            <dl className="space-y-2">
              <InlineDetail label="Condition" value={settlement.condition.value} />
              <InlineDetail label="Current crisis" value={settlement.crisis.value} />
              <InlineDetail label="Hidden truth" value={settlement.hiddenTruth.value} />
              <InlineDetail label="AI" value={settlement.aiSituation.value} />
            </dl>
          </Section>
        </div>

        <Section title="Adventure Texture">
          <dl className="space-y-2">
            <InlineDetail label="Tags" value={settlement.tags.map((tag) => tag.value).join(' + ')} />
            <InlineDetail label="Tag hook" value={settlement.tagHook.value} />
            <InlineDetail label="Local sites" value={settlement.encounterSites.map((site) => site.value).join(', ')} />
          </dl>
        </Section>
      </div>

      <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs leading-relaxed text-[var(--text-tertiary)]">
        {settlement.methodNotes.map((note) => note.value).join(' ')}
      </p>
    </article>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--card-elevated)] p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{title}</h4>
      <div className="mt-2 text-[var(--text-primary)]">{children}</div>
    </section>
  )
}

function InlineDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline font-semibold text-[var(--text-secondary)]">{label}: </dt>
      <dd className="inline text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}
