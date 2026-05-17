import type { ReactNode } from 'react'
import { Compass, FileSearch, Layers, Moon, Telescope, Users } from 'lucide-react'
import type { GeneratedSystem, OrbitingBody, PlanetaryDetail } from '../types'
import {
  bandLabel,
  formatBodyPopulationSuffix,
  orbitalPresenceLabel,
  presenceLabel,
  terraformLabel,
  unnamedSiteCountLabel,
} from '../lib/populationDisplay'
import { BodyCategoryIcon, FieldRow, ThermalZoneTag, sectionShellClasses } from './visual'

function debrisRegionsForBody(body: OrbitingBody, system: GeneratedSystem): Array<{ id: string; archetypeName: string }> {
  const orbit = body.orbitAu.value
  return system.debrisFields
    .filter((field) => {
      const inExtent = orbit >= field.spatialExtent.innerAu.value && orbit <= field.spatialExtent.outerAu.value
      if (!inExtent) return false
      return system.settlements.some((s) => s.debrisFieldId === field.id)
    })
    .map((field) => ({ id: field.id, archetypeName: field.archetypeName.value }))
}

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
  const regions = debrisRegionsForBody(body, system)

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
    ...regions.map((region) => ({
      label: 'Region',
      value: <span className="text-[var(--text-primary)]">{region.archetypeName}</span>,
    })),
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

      <PopulationBlock body={body} compact={compact} />

      <DeeperSurvey detail={body.detail} compact={compact} />

      <div className="mt-5 space-y-5 text-sm">
        <SubBlock title="Orbital Companions" icon={Moon}>
          {body.moons.length ? (
            <div className="space-y-3">
              {body.moons.map((moon) => (
                <div
                  key={moon.id}
                  className="overflow-hidden rounded-md border border-[var(--border-light)] border-l-2 border-l-[var(--accent)] bg-[var(--card-elevated)]"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-[var(--border-light)] bg-[var(--card)] px-3 py-2">
                    <h4 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                      {moon.name.value}
                    </h4>
                    <span className="text-[0.68rem] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                      {moon.scale.value} · {moon.moonType.value}
                    </span>
                  </div>
                  <dl className="divide-y divide-[var(--border-light)]">
                    <MoonAttr label="Use" value={moon.use.value} />
                    <MoonAttr label="Resource" value={moon.resource.value} />
                    <MoonAttr label="Hazard" value={moon.hazard.value} />
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

function PopulationBlock({ body, compact }: { body: OrbitingBody; compact: boolean }) {
  const pop = body.population?.value
  if (!pop) return null

  const presenceLines: string[] = []
  if (pop.surface !== 'none') presenceLines.push(`Surface ${presenceLabel(pop.surface)}`)
  if (pop.underground !== 'none') presenceLines.push(`Subsurface ${presenceLabel(pop.underground)}`)
  if (pop.orbital !== 'none') presenceLines.push(`Orbital ${orbitalPresenceLabel(pop.orbital)}`)

  const suffix = formatBodyPopulationSuffix(body)

  return (
    <SubBlock
      title="Population"
      icon={Users}
      className={compact ? 'mt-4 border-t border-[var(--border-light)] pt-3' : 'mt-3 rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3'}
    >
      <div className="space-y-1.5">
        <p>
          <span className="font-semibold text-[var(--accent-warm)]">{bandLabel(pop.band)}</span>
          {suffix ? <span className="text-[var(--text-tertiary)]">{' '}— {suffix}</span> : null}
        </p>
        {presenceLines.length ? (
          <p className="text-[var(--text-secondary)]">{presenceLines.join(' · ')}</p>
        ) : null}
        <p className="text-[var(--text-tertiary)]">
          {unnamedSiteCountLabel(pop.unnamedSiteCount)}
          {pop.prominentForm ? <>{' · prominent form '}<span className="text-[var(--text-secondary)]">{pop.prominentForm}</span></> : null}
        </p>
        {pop.terraformState !== 'none' ? (
          <p className="text-[var(--text-secondary)]">
            <span className="font-medium">Terraform:</span> {terraformLabel(pop.terraformState)}
            {pop.terraformNote ? <span className="text-[var(--text-tertiary)]">{' '}— {pop.terraformNote}</span> : null}
          </p>
        ) : null}
      </div>
    </SubBlock>
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

interface DeeperGroup {
  title: string
  rows: Array<{ label: string; value: string }>
}

function buildDeeperGroups(detail: PlanetaryDetail): DeeperGroup[] {
  const groups: DeeperGroup[] = [
    {
      title: 'Surface & Geology',
      rows: [
        { label: 'Minerals', value: detail.mineralComposition.value },
        { label: 'Topography', value: detail.topography.value },
        { label: 'Surface hazards', value: detail.surfaceHazards.value },
        { label: 'Hydrology', value: detail.hydrology.value },
        { label: 'Seismic activity', value: detail.seismicActivity.value },
      ],
    },
    {
      title: 'Atmosphere',
      rows: [
        { label: 'Pressure', value: detail.atmosphericPressure.value },
        { label: 'Traces', value: detail.atmosphericTraces.value },
        { label: 'Wind regime', value: detail.windRegime.value },
      ],
    },
    {
      title: 'Rotation & Light',
      rows: [
        { label: 'Rotation profile', value: detail.rotationProfile.value },
        { label: 'Day length', value: detail.dayLength.value },
        { label: 'Surface light', value: detail.surfaceLight.value },
        { label: 'Axial tilt', value: detail.axialTilt.value },
      ],
    },
    {
      title: 'Magnetic & Sky',
      rows: [
        { label: 'Magnetic field', value: detail.magneticField.value },
        { label: 'Sky phenomena', value: detail.skyPhenomena.value },
        { label: 'Tidal regime', value: detail.tidalRegime.value },
      ],
    },
    {
      title: 'Biosphere & Economy',
      rows: [
        { label: 'Distribution', value: detail.biosphereDistribution.value },
        { label: 'Resource access', value: detail.resourceAccess.value },
        { label: 'Acoustic environment', value: detail.acousticEnvironment.value },
      ],
    },
  ]
  return groups.map((g) => ({ ...g, rows: g.rows.filter((r) => r.value && r.value.trim().length > 0) })).filter((g) => g.rows.length > 0)
}

function DeeperSurvey({ detail, compact }: { detail: PlanetaryDetail; compact: boolean }) {
  const groups = buildDeeperGroups(detail)
  if (groups.length === 0) return null
  return (
    <SubBlock
      title="Deeper Survey"
      icon={Telescope}
      className={compact ? 'mt-4 border-t border-[var(--border-light)] pt-3' : 'mt-3 rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3'}
    >
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              {group.title}
            </h4>
            <dl className="mt-1.5 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {group.rows.map((row) => (
                <FieldRow key={row.label} label={row.label} layer="physical">
                  {row.value}
                </FieldRow>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </SubBlock>
  )
}

function MoonAttr({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 px-3 py-2 leading-snug">
      <dt className="w-20 shrink-0 pt-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        {label}
      </dt>
      <dd className="flex-1 text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}
