import type { Settlement } from '../types'
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
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Presence score: </dt>
          <dd className="inline text-[var(--text-primary)]">
            {settlement.presence.score.value} ({presenceLabel(settlement.presence.score.value)})
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Anchor: </dt>
          <dd className="inline text-[var(--text-primary)]">
            {settlement.anchorName.value} ({settlement.anchorKind.value})
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Placement: </dt>
          <dd className="inline text-[var(--text-primary)]">{settlement.anchorDetail.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Why here: </dt>
          <dd className="inline text-[var(--text-primary)]">{settlement.whyHere.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Function: </dt>
          <dd className="inline text-[var(--text-primary)]">{settlement.function.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Scale: </dt>
          <dd className="inline text-[var(--text-primary)]">{settlement.scale.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Authority: </dt>
          <dd className="inline text-[var(--text-primary)]">{settlement.authority.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Built form: </dt>
          <dd className="inline text-[var(--text-primary)]">{settlement.builtForm.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">AI: </dt>
          <dd className="inline text-[var(--text-primary)]">{settlement.aiSituation.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Condition: </dt>
          <dd className="inline text-[var(--text-primary)]">{settlement.condition.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Tags: </dt>
          <dd className="inline text-[var(--text-primary)]">
            {settlement.tags.map((tag) => tag.value).join(' + ')}
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Tag hook: </dt>
          <dd className="inline text-[var(--text-primary)]">{settlement.tagHook.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Current crisis: </dt>
          <dd className="inline text-[var(--text-primary)]">{settlement.crisis.value}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-secondary)]">Hidden truth: </dt>
          <dd className="inline text-[var(--text-primary)]">{settlement.hiddenTruth.value}</dd>
        </div>
      </dl>
      <div className="mt-3 text-sm">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Local Sites</h4>
        <p className="mt-1 text-[var(--text-primary)]">{settlement.encounterSites.map((site) => site.value).join(', ')}</p>
      </div>
      <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs leading-relaxed text-[var(--text-tertiary)]">
        {settlement.methodNotes.map((note) => note.value).join(' ')}
      </p>
    </article>
  )
}

function presenceLabel(score: number): string {
  if (score >= 15) return 'major campaign location'
  if (score >= 12) return 'major hub'
  if (score >= 9) return 'settled site'
  if (score >= 7) return 'outpost'
  return 'minor marker'
}
