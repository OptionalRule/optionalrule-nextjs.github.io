import type { OrbitingBody } from '../types'
import { ConfidenceBadge } from './ConfidenceBadge'

export function BodyDetailPanel({ body }: { body: OrbitingBody }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{body.name.value}</h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            {body.bodyClass.value} · {body.massClass.value} · {body.orbitAu.value} AU
          </p>
        </div>
        <ConfidenceBadge confidence={body.name.confidence} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Radius" value={`${body.physical.radiusEarth.value} Earth radii`} />
        <Detail label="Period" value={`${body.physical.periodDays.value} days`} />
        <Detail label="Atmosphere" value={body.detail.atmosphere.value} />
        <Detail label="Volatiles" value={body.detail.hydrosphere.value} />
        <Detail label="Geology" value={body.detail.geology.value} />
        <Detail label="Radiation" value={body.detail.radiation.value} />
        <Detail label="Biosphere" value={body.detail.biosphere.value} />
        <Detail label="Climate" value={body.detail.climate.map((tag) => tag.value).join(', ')} />
      </dl>

      <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--card-elevated)] p-3 text-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Why It Matters</h3>
        <p className="mt-1 text-[var(--text-primary)]">{body.whyInteresting.value}</p>
        {body.bodyProfile ? (
          <p className="mt-2 text-[var(--text-secondary)]">{body.bodyProfile.value}</p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 text-sm lg:grid-cols-4">
        <ListBlock
          title="Exoplanet Notes"
          empty="No modern exoplanet filter notes."
          items={body.filterNotes.map((note) => note.value)}
        />
        <ListBlock
          title="Moons"
          empty="No major moons generated."
          items={body.moons.map((moon) => `${moon.name.value}: ${moon.scale.value} ${moon.moonType.value}. ${moon.use.value}. Resource: ${moon.resource.value}. Hazard: ${moon.hazard.value}.`)}
        />
        <ListBlock
          title="Rings"
          empty="No notable ring system."
          items={body.rings ? [body.rings.type.value] : []}
        />
        <ListBlock
          title="Economy & Sites"
          empty="No human sites logged."
          items={[...(body.giantEconomy ? [body.giantEconomy.value] : []), ...body.sites.map((site) => site.value)]}
        />
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--card-elevated)] p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</dt>
      <dd className="mt-1 text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{title}</h3>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-[var(--text-primary)]">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[var(--text-tertiary)]">{empty}</p>
      )}
    </div>
  )
}
