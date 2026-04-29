import type { GeneratedSystem, OrbitingBody } from '../types'

export function BodyDetailPanel({ body, system }: { body: OrbitingBody; system: GeneratedSystem }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <BodyDetailContent body={body} system={system} showHeader />
    </section>
  )
}

export function BodyDetailContent({
  body,
  system,
  showHeader = false,
  compact = false,
}: {
  body: OrbitingBody
  system: GeneratedSystem
  showHeader?: boolean
  compact?: boolean
}) {
  const isAnomaly = body.category.value === 'anomaly'
  const isBelt = body.category.value === 'belt'
  const physicalRows = [
    ...(isBelt
      ? [
          ['Structure', 'Distributed belt or swarm'],
          ['Mass', 'Not estimated for a distributed belt'],
        ]
      : [
          [isAnomaly ? 'Scale' : 'Radius', isAnomaly ? `${body.physical.radiusEarth.value} operational scale index` : `${body.physical.radiusEarth.value} Earth radii`],
          ['Mass', body.physical.massEarth.value === null ? 'Not applicable' : `${body.physical.massEarth.value} Earth masses`],
          ['Gravity', body.physical.gravityLabel.value],
        ]),
    ['Orbit', `${body.orbitAu.value} AU · ${formatOrbitContext(body.orbitAu.value, system)}`],
    ['Period', `${body.physical.periodDays.value} days`],
    ['Atmosphere', body.detail.atmosphere.value],
    ['Volatiles', body.detail.hydrosphere.value],
    ['Geology', body.detail.geology.value],
    ['Radiation', body.detail.radiation.value],
    ['Biosphere', body.detail.biosphere.value],
    ['Climate', body.detail.climate.map((tag) => tag.value).join(', ')],
  ]

  return (
    <div>
      {showHeader ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{body.name.value}</h2>
            <p className="text-sm text-[var(--text-tertiary)]">
              {body.bodyClass.value} · {body.massClass.value} · {body.orbitAu.value} AU · {formatOrbitContext(body.orbitAu.value, system)}
            </p>
          </div>
        </div>
      ) : null}

      <dl className={`${showHeader ? 'mt-4' : ''} grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3`}>
        {physicalRows.map(([label, value]) => (
          <Detail key={label} label={label} value={value} compact={compact} />
        ))}
      </dl>

      <div className={compact ? 'mt-4 border-t border-[var(--border)] pt-3 text-sm' : 'mt-3 rounded-md border border-[var(--border)] bg-[var(--card-elevated)] p-3 text-sm'}>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Why It Matters</h3>
        <p className="mt-1 text-[var(--text-primary)]">{body.whyInteresting.value}</p>
        {body.bodyProfile ? (
          <p className="mt-2 text-[var(--text-secondary)]">{body.bodyProfile.value}</p>
        ) : null}
      </div>

      <div className="mt-5 space-y-5 text-sm">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Orbital Companions</h3>
          {body.moons.length ? (
            <div className="mt-2 space-y-3">
              {body.moons.map((moon) => (
                <div key={moon.id} className="border-l-2 border-[var(--border)] pl-3">
                  <p className="font-semibold text-[var(--text-primary)]">
                    {moon.name.value}
                    <span className="font-normal text-[var(--text-tertiary)]"> · {moon.scale.value} · {moon.moonType.value}</span>
                  </p>
                  <dl className="mt-1 grid gap-x-4 gap-y-1 text-[var(--text-secondary)] sm:grid-cols-3">
                    <InlineDetail label="Use" value={moon.use.value} />
                    <InlineDetail label="Resource" value={moon.resource.value} />
                    <InlineDetail label="Hazard" value={moon.hazard.value} />
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[var(--text-tertiary)]">No major moons generated.</p>
          )}
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <ListBlock
            title="Survey Notes"
            empty="No modern exoplanet filter notes."
            items={body.filterNotes.map((note) => note.value)}
          />
          <ListBlock
            title="Rings, Economy, Sites"
            empty="No notable rings, economy note, or human sites logged."
            items={[
              ...(body.rings ? [`Ring system: ${body.rings.type.value}`] : []),
              ...(body.giantEconomy ? [body.giantEconomy.value] : []),
              ...body.sites.map((site) => site.value),
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value, compact }: { label: string; value: string; compact: boolean }) {
  return (
    <div className={compact ? 'min-w-0 rounded-md border border-[var(--border)] bg-[var(--card-elevated)] p-2' : 'min-w-0 rounded-md border border-[var(--border)] bg-[var(--card-elevated)] p-2.5'}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</dt>
      <dd className="mt-1 text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}

function formatOrbitContext(orbitAu: number, system: GeneratedSystem): string {
  const hzCenter = system.zones.habitableCenterAu.value
  const snowLine = system.zones.snowLineAu.value
  if (snowLine > 0 && orbitAu >= snowLine * 0.7) return `${formatRatio(orbitAu / snowLine)}x snow line`
  if (hzCenter > 0) return `${formatRatio(orbitAu / hzCenter)}x HZ center`
  return 'no stellar zone scale'
}

function formatRatio(value: number): string {
  if (value >= 10) return value.toFixed(0)
  if (value >= 1) return value.toFixed(1)
  return value.toFixed(2)
}

function InlineDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline font-semibold text-[var(--text-secondary)]">{label}: </dt>
      <dd className="inline">{value}</dd>
    </div>
  )
}

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{title}</h3>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-[var(--text-primary)]">
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[var(--text-tertiary)]">{empty}</p>
      )}
    </div>
  )
}
