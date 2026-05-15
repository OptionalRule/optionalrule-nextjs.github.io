import type {
  BodyOrbitalPresence,
  BodyPopulation,
  BodyPopulationBand,
  BodySurfacePresence,
  BodyUnnamedSiteCount,
  GeneratedSystem,
  OrbitingBody,
  SystemPopulationBand,
  SystemPopulationSummary,
  TerraformState,
} from '../types'

const BAND_ORDER: BodyPopulationBand[] = [
  'empty',
  'automated',
  'transient',
  'outpost',
  'frontier',
  'colony',
  'established',
  'populous',
  'dense-world',
]

export function bandRank(band: BodyPopulationBand): number {
  return BAND_ORDER.indexOf(band)
}

export function bandLabel(band: BodyPopulationBand): string {
  switch (band) {
    case 'empty':
      return 'Empty'
    case 'automated':
      return 'Automated only'
    case 'transient':
      return 'Transient crews'
    case 'outpost':
      return 'Outpost scatter'
    case 'frontier':
      return 'Frontier population'
    case 'colony':
      return 'Colony'
    case 'established':
      return 'Established world'
    case 'populous':
      return 'Populous world'
    case 'dense-world':
      return 'Dense civilization'
  }
}

export function presenceLabel(presence: BodySurfacePresence): string {
  switch (presence) {
    case 'none':
      return 'absent'
    case 'scattered':
      return 'scattered'
    case 'widespread':
      return 'widespread'
    case 'dominant':
      return 'dominant'
  }
}

export function orbitalPresenceLabel(presence: BodyOrbitalPresence): string {
  switch (presence) {
    case 'none':
      return 'absent'
    case 'minimal':
      return 'minimal'
    case 'substantial':
      return 'substantial'
    case 'ring-city':
      return 'ring-city'
  }
}

export function terraformLabel(state: TerraformState): string {
  switch (state) {
    case 'none':
      return 'untouched (natural state)'
    case 'candidate':
      return 'terraform candidate'
    case 'in-progress':
      return 'terraform in progress'
    case 'stabilized':
      return 'stabilized terraform'
    case 'failed':
      return 'failed terraform'
  }
}

export function unnamedSiteCountLabel(count: BodyUnnamedSiteCount): string {
  return count === 'none' ? 'no unnamed support' : `${count} of unnamed support sites`
}

const SYSTEM_BAND_THRESHOLDS: Array<{ minBand: BodyPopulationBand; systemBand: SystemPopulationBand }> = [
  { minBand: 'dense-world', systemBand: 'dense-sector' },
  { minBand: 'populous', systemBand: 'dense-sector' },
  { minBand: 'established', systemBand: 'established-hub' },
  { minBand: 'colony', systemBand: 'working' },
  { minBand: 'outpost', systemBand: 'frontier-scatter' },
]

export function systemBandLabel(band: SystemPopulationBand): string {
  switch (band) {
    case 'skeleton':
      return 'Skeleton system'
    case 'frontier-scatter':
      return 'Frontier scatter'
    case 'working':
      return 'Working system'
    case 'established-hub':
      return 'Established hub'
    case 'dense-sector':
      return 'Dense sector'
  }
}

function allPopulatedBodies(system: GeneratedSystem): OrbitingBody[] {
  const main = system.bodies
  const sub = system.companions.flatMap((c) => c.subSystem?.bodies ?? [])
  return [...main, ...sub]
}

export function systemPopulationSummary(system: GeneratedSystem): SystemPopulationSummary {
  const all = allPopulatedBodies(system)
  if (!all.length) {
    return { systemBand: 'skeleton', anchorBodyId: null, populatedBodyCount: 0, totalUnnamedSiteScale: 'none' }
  }

  let maxRank = -1
  let anchorId: string | null = null
  let maxBand: BodyPopulationBand = 'empty'
  let populatedBodyCount = 0
  let unnamedSites: BodyUnnamedSiteCount = 'none'

  for (const body of all) {
    const pop = body.population?.value
    if (!pop) continue
    const rank = bandRank(pop.band)
    if (rank > maxRank) {
      maxRank = rank
      anchorId = body.id
      maxBand = pop.band
    }
    if (!['empty', 'automated', 'transient'].includes(pop.band)) populatedBodyCount += 1
    if (UNNAMED_SCALE_RANK[pop.unnamedSiteCount] > UNNAMED_SCALE_RANK[unnamedSites]) {
      unnamedSites = pop.unnamedSiteCount
    }
  }

  let systemBand: SystemPopulationBand = 'skeleton'
  for (const threshold of SYSTEM_BAND_THRESHOLDS) {
    if (bandRank(maxBand) >= bandRank(threshold.minBand)) {
      systemBand = threshold.systemBand
      break
    }
  }

  return {
    systemBand,
    anchorBodyId: anchorId,
    populatedBodyCount,
    totalUnnamedSiteScale: aggregateUnnamedScale(unnamedSites),
  }
}

const UNNAMED_SCALE_RANK: Record<BodyUnnamedSiteCount, number> = {
  none: 0,
  'a handful': 1,
  dozens: 2,
  hundreds: 3,
  thousands: 4,
  continuous: 5,
}

function aggregateUnnamedScale(count: BodyUnnamedSiteCount): SystemPopulationSummary['totalUnnamedSiteScale'] {
  switch (count) {
    case 'none':
      return 'none'
    case 'a handful':
    case 'dozens':
      return 'scattered'
    case 'hundreds':
    case 'thousands':
      return 'extensive'
    case 'continuous':
      return 'continuous'
  }
}

const BODY_SUFFIX_BY_POPULATION: Record<BodyPopulationBand, ((pop: BodyPopulation) => string) | null> = {
  empty: null,
  automated: null,
  transient: null,
  outpost: (pop) => suffixForPresence(pop, 'scattered outposts'),
  frontier: (pop) => suffixForPresence(pop, 'tunnel-stack housing'),
  colony: (pop) => suffixForPresence(pop, 'satellite towns'),
  established: (pop) => suffixForPresence(pop, 'continental cities'),
  populous: (pop) => suffixForPresence(pop, 'planetary metropolis'),
  'dense-world': () => 'continuous urban surface',
}

function suffixForPresence(pop: BodyPopulation, surfaceHint: string): string {
  if (pop.underground === 'dominant') return 'subsurface tunnel cities'
  if (pop.underground === 'widespread' && pop.surface === 'none') return 'buried habitats'
  if (pop.orbital === 'ring-city') return 'orbital ring-city'
  if (pop.surface === 'none' && pop.orbital === 'substantial') return 'orbital habitats'
  return surfaceHint
}

export function formatBodyPopulationSuffix(body: OrbitingBody): string | null {
  const pop = body.population?.value
  if (!pop) return null
  const fn = BODY_SUFFIX_BY_POPULATION[pop.band]
  if (!fn) return null
  return fn(pop)
}

export function formatSystemPopulationLine(system: GeneratedSystem): string {
  const summary = systemPopulationSummary(system)
  const bandLine = systemBandLabel(summary.systemBand)
  if (!summary.anchorBodyId) {
    return `${bandLine}. Effectively uninhabited beyond passing crews.`
  }
  const anchor = allPopulatedBodies(system).find((b) => b.id === summary.anchorBodyId)
  if (!anchor) return `${bandLine}.`
  const anchorBand = anchor.population?.value.band
  const others = summary.populatedBodyCount - 1
  const others_phrase = others <= 0
    ? 'with peripheral bodies otherwise quiet'
    : others === 1
      ? 'with one secondary populated body carrying the rest'
      : `with ${others} secondary populated bodies carrying the rest`
  const anchorPhrase = anchorBand
    ? `${anchor.name.value} carries the bulk (${bandLabel(anchorBand).toLowerCase()})`
    : `${anchor.name.value} carries the bulk`
  return `${bandLine}. ${anchorPhrase}, ${others_phrase}.`
}
