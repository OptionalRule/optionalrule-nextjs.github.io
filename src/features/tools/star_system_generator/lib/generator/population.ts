import type {
  BodyOrbitalPresence,
  BodyPopulation,
  BodyPopulationBand,
  BodySurfacePresence,
  BodyUnnamedSiteCount,
  Fact,
  Gate,
  GenerationOptions,
  GeneratedSystem,
  GuOverlay,
  Moon,
  OrbitingBody,
  Reachability,
  Settlement,
  SettlementPopulation,
  StellarCompanion,
  SystemArchitecture,
  TerraformState,
} from '../../types'

export type HabitabilityTier = 'hostile' | 'harsh' | 'shielded-viable' | 'viable' | 'comfortable'
export type ResourceTier = 'minimal' | 'modest' | 'substantial' | 'rich'
export type StrategicTier = 'none' | 'minor' | 'notable' | 'critical'
export type LoadTier = 'empty' | 'light' | 'moderate' | 'heavy'

export interface BandSelectionModifiers {
  stabilizedTerraform: boolean
  hubReachability: boolean
  failedTerraform: boolean
  severeGu: boolean
  flareStressed: boolean
  settlementDensityHub: boolean
}

export interface BandSelectionInput {
  habitability: HabitabilityTier
  resource: ResourceTier
  strategic: StrategicTier
  load: LoadTier
  modifiers: BandSelectionModifiers
  maxSettlementPopulation?: SettlementPopulation
}

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

const HABITABILITY_SCORE: Record<HabitabilityTier, number> = {
  hostile: 0,
  harsh: 1,
  'shielded-viable': 2,
  viable: 3,
  comfortable: 4,
}

const RESOURCE_SCORE: Record<ResourceTier, number> = {
  minimal: 0,
  modest: 1,
  substantial: 2,
  rich: 3,
}

const STRATEGIC_SCORE: Record<StrategicTier, number> = {
  none: 0,
  minor: 1,
  notable: 2,
  critical: 3,
}

const LOAD_SCORE: Record<LoadTier, number> = {
  empty: 0,
  light: 1,
  moderate: 2,
  heavy: 3,
}

function scoreToBand(score: number): BodyPopulationBand {
  if (score <= 0) return 'empty'
  if (score === 1) return 'automated'
  if (score <= 3) return 'transient'
  if (score <= 5) return 'outpost'
  if (score <= 8) return 'frontier'
  if (score <= 11) return 'colony'
  if (score === 12) return 'established'
  if (score <= 14) return 'populous'
  return 'dense-world'
}

function bandIndex(band: BodyPopulationBand): number {
  return BAND_ORDER.indexOf(band)
}

function capBand(band: BodyPopulationBand, ceiling: BodyPopulationBand): BodyPopulationBand {
  return bandIndex(band) <= bandIndex(ceiling) ? band : ceiling
}

function shiftBandDown(band: BodyPopulationBand, steps: number): BodyPopulationBand {
  const next = Math.max(0, bandIndex(band) - steps)
  return BAND_ORDER[next]
}

export function selectBand(input: BandSelectionInput): BodyPopulationBand {
  const habScore = HABITABILITY_SCORE[input.habitability]
  const stableAtmosphere = habScore >= HABITABILITY_SCORE['shielded-viable']

  let score =
    habScore +
    RESOURCE_SCORE[input.resource] +
    STRATEGIC_SCORE[input.strategic] +
    LOAD_SCORE[input.load]

  if (input.modifiers.stabilizedTerraform) score += 2
  if (input.modifiers.hubReachability && stableAtmosphere) score += 1
  if (input.modifiers.settlementDensityHub) score += 1

  let band = scoreToBand(score)

  if (input.modifiers.severeGu) band = shiftBandDown(band, 1)

  if (input.modifiers.failedTerraform) band = capBand(band, 'colony')
  if (input.modifiers.flareStressed) band = capBand(band, 'frontier')

  if (band === 'populous' || band === 'dense-world') {
    if (!stableAtmosphere) band = 'colony'
  }
  if (band === 'dense-world') {
    if (!input.modifiers.stabilizedTerraform && input.habitability !== 'comfortable') {
      band = 'populous'
    }
  }

  if (input.maxSettlementPopulation) {
    band = floorBand(band, floorForSettlementPopulation(input.maxSettlementPopulation))
  }

  return band
}

function floorBand(band: BodyPopulationBand, floor: BodyPopulationBand): BodyPopulationBand {
  return bandIndex(band) >= bandIndex(floor) ? band : floor
}

function floorForSettlementPopulation(pop: SettlementPopulation): BodyPopulationBand {
  switch (pop) {
    case '10+ million':
    case '1-10 million':
      return 'colony'
    case '100,001-1 million':
      return 'frontier'
    case '10,001-100,000':
      return 'outpost'
    case '1,001-10,000':
      return 'outpost'
    case '101-1,000':
      return 'transient'
    case '21-100':
    case '1-20':
    case 'Minimal (<5)':
      return 'transient'
    case 'Unknown':
      return 'empty'
  }
}

export interface PresenceDistributionInput {
  band: BodyPopulationBand
  habitability: HabitabilityTier
  hasGate: boolean
  isBeltAnchor: boolean
  architectureCompact: boolean
}

export interface PresenceDistribution {
  surface: BodySurfacePresence
  underground: BodySurfacePresence
  orbital: BodyOrbitalPresence
}

const ORBITAL_ORDER: BodyOrbitalPresence[] = ['none', 'minimal', 'substantial', 'ring-city']

function bumpOrbital(current: BodyOrbitalPresence, steps = 1): BodyOrbitalPresence {
  const idx = ORBITAL_ORDER.indexOf(current)
  const next = Math.min(ORBITAL_ORDER.length - 1, idx + steps)
  return ORBITAL_ORDER[next]
}

function bandAtLeast(band: BodyPopulationBand, floor: BodyPopulationBand): boolean {
  return bandIndex(band) >= bandIndex(floor)
}

function surfaceForBand(band: BodyPopulationBand, habitability: HabitabilityTier): BodySurfacePresence {
  if (!bandAtLeast(band, 'outpost')) return 'none'
  switch (habitability) {
    case 'hostile':
      return 'none'
    case 'harsh':
    case 'shielded-viable':
      return 'scattered'
    case 'viable':
      if (band === 'outpost') return 'scattered'
      if (band === 'frontier' || band === 'colony') return 'widespread'
      return 'dominant'
    case 'comfortable':
      if (band === 'outpost') return 'scattered'
      if (band === 'frontier') return 'widespread'
      return 'dominant'
  }
}

function undergroundForBand(band: BodyPopulationBand, habitability: HabitabilityTier): BodySurfacePresence {
  if (!bandAtLeast(band, 'outpost')) return 'none'
  if (habitability === 'hostile') {
    return bandAtLeast(band, 'frontier') ? 'dominant' : 'none'
  }
  if (habitability === 'harsh' || habitability === 'shielded-viable') {
    return bandAtLeast(band, 'colony') ? 'widespread' : 'scattered'
  }
  return 'scattered'
}

function orbitalForBand(
  band: BodyPopulationBand,
  hasGate: boolean,
  isBeltAnchor: boolean,
  architectureCompact: boolean,
): BodyOrbitalPresence {
  if (!bandAtLeast(band, 'transient')) return 'none'

  let base: BodyOrbitalPresence = 'none'
  if (band === 'transient' || band === 'outpost') {
    base = architectureCompact ? 'minimal' : 'none'
  } else if (band === 'frontier') {
    base = 'minimal'
  } else {
    base = 'substantial'
  }

  if (hasGate) base = bumpOrbital(base)

  if (isBeltAnchor && bandAtLeast(band, 'colony')) {
    base = bandAtLeast(band, 'populous') ? 'ring-city' : 'substantial'
  }

  return base
}

export function distributePresence(input: PresenceDistributionInput): PresenceDistribution {
  return {
    surface: surfaceForBand(input.band, input.habitability),
    underground: undergroundForBand(input.band, input.habitability),
    orbital: orbitalForBand(input.band, input.hasGate, input.isBeltAnchor, input.architectureCompact),
  }
}

interface BodyContext {
  settlements: Settlement[]
  reachability: Reachability
  architecture: SystemArchitecture
  guOverlay: GuOverlay
  gates: Gate[]
  options: GenerationOptions
}

function classifyHabitability(body: OrbitingBody): HabitabilityTier {
  const cat = body.category.value
  if (cat === 'belt' || cat === 'gas-giant' || cat === 'ice-giant' || cat === 'anomaly' || cat === 'rogue-captured') {
    return 'hostile'
  }
  const zone = body.thermalZone.value
  if (zone === 'Furnace' || zone === 'Inferno') return 'hostile'

  const atm = body.detail.atmosphere.value.toLowerCase()
  const rad = body.detail.radiation.value.toLowerCase()
  const bio = body.detail.biosphere.value.toLowerCase()

  if (/vacuum|no ordinary|rock-vapor|metal vapor|hard vacuum/.test(atm)) return 'hostile'
  if (rad.includes('lethal') || rad.includes('flare-lethal')) return 'harsh'
  if (zone === 'Deep cold' || zone === 'Frozen') return 'harsh'

  const isBreathable = /oxygen-rich|breathable|earth-like|nitrogen-oxygen/.test(atm)
  const hasLife = /photosynthetic|macroscopic|chimeric|microbial life|engineered remnant/.test(bio)
  const niceZone = zone === 'Temperate band' || zone === 'Cool'

  if (isBreathable && hasLife && niceZone) return 'comfortable'
  if (isBreathable && niceZone) return 'viable'
  if (hasLife && niceZone) return 'viable'
  if (rad.includes('severe')) return 'shielded-viable'
  return 'shielded-viable'
}

function classifyResource(body: OrbitingBody, guOverlay: GuOverlay): ResourceTier {
  let score = 0
  const cat = body.category.value
  if (cat === 'belt' || cat === 'gas-giant' || cat === 'ice-giant') score += 2
  if (body.rings) score += 1
  if (body.sites.length > 0) score += 1
  if (body.traits.some((t) => /resource|rich|deposit|vein|ore/i.test(t.value))) score += 1
  if (guOverlay.resource.value && guOverlay.resource.value !== 'None') score += 1
  if (cat === 'dwarf-body') score += 1

  if (score >= 4) return 'rich'
  if (score >= 3) return 'substantial'
  if (score >= 1) return 'modest'
  return 'minimal'
}

function classifyStrategic(body: OrbitingBody, reachability: Reachability, gates: Gate[]): StrategicTier {
  const reach = reachability.className.value.toLowerCase()
  const hasGate = gates.some((g) => g.bodyId === body.id || (g.moonId && body.moons.some((m) => m.id === g.moonId)))

  let score = 0
  if (hasGate) score += 2
  if (/hub|crossroads|iggygate/.test(reach)) score += 2
  if (/military|trade|corporate/.test(reach)) score += 1
  if (body.rings) score += 1

  if (score >= 5) return 'critical'
  if (score >= 3) return 'notable'
  if (score >= 1) return 'minor'
  return 'none'
}

function classifyLoad(body: OrbitingBody, settlements: Settlement[]): LoadTier {
  const moonIds = new Set(body.moons.map((m) => m.id))
  const onBody = settlements.filter((s) => s.bodyId === body.id || (s.moonId && moonIds.has(s.moonId)))
  if (onBody.length === 0) return 'empty'

  let weight = 0
  for (const s of onBody) {
    const pop = s.population.value
    if (pop === '10+ million' || pop === '1-10 million') weight += 3
    else if (pop === '100,001-1 million' || pop === '10,001-100,000') weight += 2
    else weight += 1
  }

  if (weight >= 6) return 'heavy'
  if (weight >= 3) return 'moderate'
  return 'light'
}

function deriveTerraformState(body: OrbitingBody, settlements: Settlement[]): TerraformState {
  if (body.category.value === 'belt' || body.category.value === 'gas-giant' || body.category.value === 'ice-giant' || body.category.value === 'anomaly') {
    return 'none'
  }
  const settlementsOnBody = settlements.filter((s) => s.bodyId === body.id)
  const allText = settlementsOnBody
    .flatMap((s) => [s.location.value, s.condition.value, s.builtForm.value, s.siteCategory.value])
    .join(' ')
    .toLowerCase()

  if (/failed terraform|terraforming liability|broken terraformer|failed garden|recently failed terraforming/.test(allText)) {
    return 'failed'
  }
  if (/terraforming camp|terraforming command|mirror-shadow agricultural|terraforming dome/.test(allText)) {
    return 'in-progress'
  }

  const atm = body.detail.atmosphere.value.toLowerCase()
  const stableAtm = /oxygen-rich|breathable|earth-like|nitrogen-oxygen/.test(atm)
  const hasMajor = settlementsOnBody.some((s) => s.population.value === '10+ million' || s.population.value === '1-10 million')
  if (stableAtm && hasMajor && body.category.value === 'rocky-planet') return 'stabilized'

  const zone = body.thermalZone.value
  if (zone === 'Temperate band' && settlementsOnBody.length === 0 && (body.category.value === 'rocky-planet' || body.category.value === 'super-earth')) {
    return 'candidate'
  }
  return 'none'
}

const PROMINENT_FORMS_BY_HABITABILITY: Record<HabitabilityTier, string[]> = {
  hostile: ['Lava-tube arcology', 'Asteroid tunnel city', 'Borehole habitat', 'Buried pressure complex'],
  harsh: ['Ice-vault city', 'Sealed arcology', 'Storm-shelter trench city', 'Subsurface ocean bore station'],
  'shielded-viable': ['Sealed arcology', 'Terminator rail city', 'Ice-vault city', 'Hub complex'],
  viable: ['Terminator rail city', 'Aerostat city', 'Surface arcology', 'Hub complex'],
  comfortable: ['Hub complex', 'Surface arcology', 'Distributed metropolis', 'Terminator rail city'],
}

function stableHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h, 31) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function selectProminentForm(band: BodyPopulationBand, habitability: HabitabilityTier, bodyId: string): string | null {
  if (bandIndex(band) < bandIndex('colony')) return null
  const pool = PROMINENT_FORMS_BY_HABITABILITY[habitability]
  return pool[stableHash(bodyId) % pool.length]
}

function unnamedSiteCountForBand(band: BodyPopulationBand): BodyUnnamedSiteCount {
  switch (band) {
    case 'empty':
    case 'automated':
    case 'transient':
      return 'none'
    case 'outpost':
      return 'a handful'
    case 'frontier':
      return 'dozens'
    case 'colony':
      return 'hundreds'
    case 'established':
    case 'populous':
      return 'thousands'
    case 'dense-world':
      return 'continuous'
  }
}

function terraformNoteFor(state: TerraformState): string | null {
  switch (state) {
    case 'in-progress':
      return 'early atmospheric seeding under shielded domes'
    case 'failed':
      return 'mirror array collapsed; surface returned to base climate'
    case 'stabilized':
      return 'biosphere holds under perpetual mirror management'
    case 'candidate':
      return 'habitable-zone candidate; no active terraform project'
    case 'none':
      return null
  }
}

function maxSettlementPopulationOn(body: OrbitingBody, settlements: Settlement[]): SettlementPopulation | undefined {
  const moonIds = new Set(body.moons.map((m) => m.id))
  const onBody = settlements.filter((s) => s.bodyId === body.id || (s.moonId && moonIds.has(s.moonId)))
  if (!onBody.length) return undefined
  const populationOrder: SettlementPopulation[] = [
    'Unknown',
    'Minimal (<5)',
    '1-20',
    '21-100',
    '101-1,000',
    '1,001-10,000',
    '10,001-100,000',
    '100,001-1 million',
    '1-10 million',
    '10+ million',
  ]
  let highest: SettlementPopulation = 'Unknown'
  for (const s of onBody) {
    if (populationOrder.indexOf(s.population.value) > populationOrder.indexOf(highest)) {
      highest = s.population.value
    }
  }
  return highest
}

function deriveBodyPopulation(body: OrbitingBody, ctx: BodyContext): Fact<BodyPopulation> {
  const habitability = classifyHabitability(body)
  const resource = classifyResource(body, ctx.guOverlay)
  const strategic = classifyStrategic(body, ctx.reachability, ctx.gates)
  const load = classifyLoad(body, ctx.settlements)
  const terraformState = deriveTerraformState(body, ctx.settlements)
  const maxSettlementPopulation = maxSettlementPopulationOn(body, ctx.settlements)

  const reach = ctx.reachability.className.value.toLowerCase()
  const guIntensity = ctx.guOverlay.intensity.value
  const rad = body.detail.radiation.value.toLowerCase()

  const modifiers: BandSelectionModifiers = {
    stabilizedTerraform: terraformState === 'stabilized',
    hubReachability: /hub|iggygate|crossroads/.test(reach),
    failedTerraform: terraformState === 'failed',
    severeGu: /Rich|fracture|shear/i.test(guIntensity),
    flareStressed: /flare-lethal|severe/.test(rad),
    settlementDensityHub: ctx.options.settlements === 'hub',
  }

  const band = selectBand({ habitability, resource, strategic, load, modifiers, maxSettlementPopulation })
  const presence = distributePresence({
    band,
    habitability,
    hasGate: ctx.gates.some((g) => g.bodyId === body.id),
    isBeltAnchor: body.category.value === 'belt',
    architectureCompact: /compact/i.test(ctx.architecture.name.value),
  })

  const population: BodyPopulation = {
    band,
    surface: presence.surface,
    underground: presence.underground,
    orbital: presence.orbital,
    unnamedSiteCount: unnamedSiteCountForBand(band),
    prominentForm: selectProminentForm(band, habitability, body.id),
    terraformState,
    terraformNote: terraformNoteFor(terraformState),
  }

  return {
    value: population,
    confidence: 'inferred',
    source: 'Derived from body habitability, reachability, settlement load, and terraform state',
  }
}

function withMoonPopulations(body: OrbitingBody): Moon[] {
  return body.moons.map((moon) => ({ ...moon, population: null }))
}

function applyToBodies(bodies: OrbitingBody[], ctx: BodyContext): OrbitingBody[] {
  return bodies.map((body) => ({
    ...body,
    population: deriveBodyPopulation(body, ctx),
    moons: withMoonPopulations(body),
  }))
}

export function derivePopulationLayer(system: GeneratedSystem): GeneratedSystem {
  const mainCtx: BodyContext = {
    settlements: system.settlements,
    reachability: system.reachability,
    architecture: system.architecture,
    guOverlay: system.guOverlay,
    gates: system.gates,
    options: system.options,
  }
  const populatedBodies = applyToBodies(system.bodies, mainCtx)

  const companions: StellarCompanion[] = system.companions.map((companion) => {
    if (!companion.subSystem) return companion
    const subCtx: BodyContext = {
      settlements: companion.subSystem.settlements,
      reachability: system.reachability,
      architecture: system.architecture,
      guOverlay: system.guOverlay,
      gates: companion.subSystem.gates,
      options: system.options,
    }
    const subBodies = applyToBodies(companion.subSystem.bodies, subCtx)
    return { ...companion, subSystem: { ...companion.subSystem, bodies: subBodies } }
  })

  return { ...system, bodies: populatedBodies, companions }
}
