import type { ReactNode } from 'react'
import { Compass, FileSearch, Layers, Moon } from 'lucide-react'
import type { GeneratedSystem, OrbitingBody } from '../types'
import { BodyCategoryIcon, FieldRow, ThermalZoneTag, sectionShellClasses } from './visual'

export function BodyDetailPanel({ body, system }: { body: OrbitingBody; system: GeneratedSystem }) {
  return (
    <section className={sectionShellClasses('physical')}>
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

  const physicalFields: Array<{ label: string; value: ReactNode }> = isBelt
    ? [
        { label: 'Structure', value: 'Distributed belt or swarm' },
        { label: 'Mass', value: 'Not estimated for a distributed belt' },
      ]
    : [
        {
          label: isAnomaly ? 'Scale' : 'Radius',
          value: isAnomaly
            ? `${body.physical.radiusEarth.value} operational scale index`
            : `${body.physical.radiusEarth.value} Earth radii`,
        },
        {
          label: 'Mass',
          value:
            body.physical.massEarth.value === null
              ? 'Not applicable'
              : `${body.physical.massEarth.value} Earth masses`,
        },
        { label: 'Gravity', value: body.physical.gravityLabel.value },
      ]

  const fields: Array<{ label: string; value: ReactNode }> = [
    ...physicalFields,
    {
      label: 'Orbit',
      value: (
        <span>
          <span className="font-mono">{body.orbitAu.value} AU</span>{' '}
          <span className="text-[var(--text-tertiary)]">· {formatOrbitContext(body.orbitAu.value, system)}</span>
        </span>
      ),
    },
    { label: 'Period', value: <span className="font-mono">{body.physical.periodDays.value} days</span> },
    { label: 'Atmosphere', value: body.detail.atmosphere.value },
    { label: 'Volatiles', value: body.detail.hydrosphere.value },
    { label: 'Geology', value: body.detail.geology.value },
    { label: 'Radiation', value: body.detail.radiation.value },
    { label: 'Biosphere', value: body.detail.biosphere.value },
    { label: 'Climate', value: body.detail.climate.map((tag) => tag.value).join(', ') },
  ]

  return (
    <div>
      {showHeader ? (
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent-light)] text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/20"
            aria-hidden="true"
          >
            <BodyCategoryIcon category={body.category.value} className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
              {body.name.value}
            </h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--text-tertiary)]">
              <span className="font-medium text-[var(--text-secondary)]">{body.bodyClass.value}</span>
              <span>·</span>
              <span>{body.massClass.value}</span>
              <span>·</span>
              <ThermalZoneTag zone={body.thermalZone.value} />
              <span>·</span>
              <span className="font-mono">{body.orbitAu.value} AU</span>
              <span className="text-[var(--text-tertiary)]">({formatOrbitContext(body.orbitAu.value, system)})</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          <BodyCategoryIcon category={body.category.value} className="h-3.5 w-3.5" />
          <span className="font-semibold text-[var(--text-secondary)]">{body.bodyClass.value}</span>
          <span>·</span>
          <ThermalZoneTag zone={body.thermalZone.value} />
        </div>
      )}

      <dl className={`${showHeader ? 'mt-4' : 'mt-3'} grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3`}>
        {fields.map((field) => (
          <FieldRow key={field.label} label={field.label} layer="physical">
            {field.value}
          </FieldRow>
        ))}
      </dl>

      <SubBlock
        title="Why It Matters"
        icon={Compass}
        className={compact ? 'mt-4 border-t border-[var(--border-light)] pt-3' : 'mt-3 rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3'}
      >
        <p className="text-[var(--text-primary)]">{body.whyInteresting.value}</p>
        {body.bodyProfile ? (
          <p className="mt-2 text-[var(--text-secondary)]">{body.bodyProfile.value}</p>
        ) : null}
      </SubBlock>

      <div className="mt-5 space-y-5 text-sm">
        <SubBlock title="Orbital Companions" icon={Moon}>
          {body.moons.length ? (
            <div className="space-y-3">
              {body.moons.map((moon) => (
                <div key={moon.id} className="border-l-2 border-[var(--accent)]/40 pl-3">
                  <p className="font-semibold text-[var(--text-primary)]">
                    {moon.name.value}
                    <span className="font-normal text-[var(--text-tertiary)]">
                      {' · '}
                      {moon.scale.value} · {moon.moonType.value}
                    </span>
                  </p>
                  <dl className="mt-1.5 grid gap-x-4 gap-y-1 sm:grid-cols-3">
                    <InlineDetail label="Use" value={moon.use.value} />
                    <InlineDetail label="Resource" value={moon.resource.value} />
                    <InlineDetail label="Hazard" value={moon.hazard.value} />
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="italic text-[var(--text-tertiary)]">No major moons generated.</p>
          )}
        </SubBlock>

        <div className="grid gap-5 lg:grid-cols-2">
          <ListBlock
            title="Survey Notes"
            icon={FileSearch}
            empty="No modern exoplanet filter notes."
            items={body.filterNotes.map((note) => note.value)}
          />
          <ListBlock
            title="Rings, Economy, Sites"
            icon={Layers}
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

function SubBlock({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <h3 className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        <Icon aria-hidden="true" className="h-3.5 w-3.5 text-[var(--accent)]" />
        {title}
      </h3>
      <div className="mt-2 text-sm">{children}</div>
    </section>
  )
}

function ListBlock({
  title,
  icon,
  items,
  empty,
}: {
  title: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  items: string[]
  empty: string
}) {
  return (
    <SubBlock title={title} icon={icon}>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li
              key={`${index}-${item}`}
              className="flex gap-2 text-[var(--text-primary)] before:mt-1.5 before:inline-block before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-[var(--accent)]"
            >
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="italic text-[var(--text-tertiary)]">{empty}</p>
      )}
    </SubBlock>
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
      <dd className="inline text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}
