import type {
  DebrisField,
  DebrisFieldShape,
  DebrisFieldSpatialExtent,
  DebrisAnchorMode,
  DebrisDensityBand,
  Fact,
  GeneratedSystem,
  GenerationOptions,
  HumanRemnant,
  Settlement,
  StellarCompanion,
  Star,
  SystemPhenomenon,
} from '../../types'
import { fact } from './index'
import { createSeededRng } from './rng'
import type { SeededRng } from './rng'
import { separationToBucketAu } from './companionGeometry'
import { siblingOuterAuLimit, circumbinaryInnerAuLimit } from './companionStability'
import { debrisArchetypeData } from './data/debrisFields'

export interface SpatialInputs {
  separationAu: number
  primaryMass: number
  companionMass: number
  hwInner: number
  hwOuter: number
}

export function spatialExtentForShape(shape: DebrisFieldShape, inputs: SpatialInputs): DebrisFieldSpatialExtent {
  const f = (n: number, src: string): Fact<number> => fact(n, 'derived', src)

  switch (shape) {
    case 'polar-ring':
      return {
        innerAu: f(inputs.hwInner, 'circumbinary inner keep-out'),
        outerAu: f(inputs.hwInner * 3, 'polar-ring outer = 3x inner'),
        inclinationDeg: f(90, 'polar by definition'),
        spanDeg: f(360, 'full ring'),
        centerAngleDeg: f(0, 'rotationally symmetric'),
      }
    case 'mass-transfer-stream':
      return {
        innerAu: f(inputs.separationAu * 0.3, 'stream inner ~0.3x sep'),
        outerAu: f(inputs.separationAu * 1.2, 'stream outer ~1.2x sep'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(5, 'narrow stream'),
        centerAngleDeg: f(0, 'L1 axis'),
      }
    case 'common-envelope-shell':
      return {
        innerAu: f(inputs.separationAu * 5, 'shell inner ~5x sep'),
        outerAu: f(inputs.separationAu * 50, 'shell outer ~50x sep'),
        inclinationDeg: f(0, 'spherical, no preferred plane'),
        spanDeg: f(360, 'full shell'),
        centerAngleDeg: f(0, 'spherical'),
      }
    case 'inner-pair-halo':
      return {
        innerAu: f(inputs.hwInner * 1.1, 'just outside keep-out'),
        outerAu: f(inputs.hwInner * 4, 'inner halo extent'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(360, 'annulus'),
        centerAngleDeg: f(0, 'symmetric'),
      }
    case 'trojan-camp': {
      const side = (inputs.separationAu * 1000) % 2 < 1 ? 60 : -60
      return {
        innerAu: f(inputs.separationAu * 0.9, 'co-orbital with companion'),
        outerAu: f(inputs.separationAu * 1.1, 'co-orbital'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(30, 'tadpole'),
        centerAngleDeg: f(side, 'L4 or L5'),
      }
    }
    case 'kozai-scattered-halo':
      return {
        innerAu: f(inputs.hwOuter * 0.5, 'inner halo'),
        outerAu: f(inputs.hwOuter * 0.95, 'just inside S-type cutoff'),
        inclinationDeg: f(60, 'Kozai inclination'),
        spanDeg: f(360, 'scattered'),
        centerAngleDeg: f(0, 'isotropic'),
      }
    case 'hill-sphere-capture-cone':
      return {
        innerAu: f(inputs.separationAu * 0.3, 'companion Hill sphere'),
        outerAu: f(inputs.separationAu * 0.5, 'capture boundary'),
        inclinationDeg: f(15, 'mild scatter'),
        spanDeg: f(120, 'trailing cone'),
        centerAngleDeg: f(180, 'opposite companion motion'),
      }
    case 'exocomet-swarm':
      return {
        innerAu: f(inputs.hwOuter * 2, 'reservoir start'),
        outerAu: f(inputs.hwOuter * 10, 'reservoir extent'),
        inclinationDeg: f(20, 'mild scatter'),
        spanDeg: f(360, 'reservoir'),
        centerAngleDeg: f(0, 'symmetric'),
      }
    case 'accretion-bridge':
      return {
        innerAu: f(0, 'star surface'),
        outerAu: f(inputs.separationAu, 'star to star'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(3, 'very narrow'),
        centerAngleDeg: f(0, 'star-star axis'),
      }
    case 'gardener-cordon':
      return {
        innerAu: f(inputs.hwOuter * 0.7, 'cordon radius'),
        outerAu: f(inputs.hwOuter * 0.72, 'cordon thin'),
        inclinationDeg: f(0, 'in plane'),
        spanDeg: f(360, 'full perimeter'),
        centerAngleDeg: f(0, 'symmetric'),
      }
  }
}

interface SelectionContext {
  hierarchicalTriple: boolean
}

interface SelectionResult {
  shape: DebrisFieldShape
}

const EVOLVED_AGE_STATES = new Set([
  'Old',
  'Very old',
  'Ancient/remnant-associated',
  // Legacy labels kept so older tests/imports still classify correctly.
  'Aging',
  'Evolved',
])
const YOUNG_CHAOS_AGE_STATES = new Set(['Embryonic/very young', 'Young'])

export function selectArchetypeForCompanion(
  rngSeed: { seed: string },
  companion: StellarCompanion,
  primary: Star,
  context: SelectionContext,
): SelectionResult | null {
  const rng = createSeededRng(`${rngSeed.seed}:debris:${companion.id}`)
  const massRatio = companion.star.massSolar.value / (primary.massSolar.value + companion.star.massSolar.value)
  const activity = companion.star.activity.value
  const mode = companion.mode
  const primaryAge = primary.ageState.value
  const companionAge = companion.star.ageState.value
  const evolvedSystem = EVOLVED_AGE_STATES.has(primaryAge) || EVOLVED_AGE_STATES.has(companionAge)

  if (mode === 'linked-independent') return null

  if (rng.fork('cordon').next() < 0.03) {
    return { shape: 'gardener-cordon' }
  }

  if (context.hierarchicalTriple && companion.id === 'companion-1') {
    return { shape: 'inner-pair-halo' }
  }

  if (mode === 'volatile') {
    if (evolvedSystem) {
      const evolvedRoll = rng.fork('volatile-evolved').next()
      if (evolvedRoll < 0.5) return { shape: 'accretion-bridge' }
      return { shape: 'common-envelope-shell' }
    }
    return { shape: 'mass-transfer-stream' }
  }

  if (mode === 'circumbinary') {
    if (evolvedSystem && rng.fork('cb-evolved').next() < 0.5) {
      return { shape: 'common-envelope-shell' }
    }
    if (massRatio <= 0.15) return { shape: 'trojan-camp' }
    return { shape: 'polar-ring' }
  }

  if (mode === 'orbital-sibling') {
    if (
      activity === 'Flare-prone' ||
      activity === 'Violent flare cycle' ||
      activity === 'Extreme activity / metric-amplified events'
    ) {
      return { shape: 'kozai-scattered-halo' }
    }
    const roll = rng.next()
    if (roll < 0.4) return { shape: 'hill-sphere-capture-cone' }
    return { shape: 'exocomet-swarm' }
  }

  return null
}

const ANCHOR_BY_SHAPE: Record<DebrisFieldShape, DebrisAnchorMode> = {
  'mass-transfer-stream': 'edge-only',
  'common-envelope-shell': 'embedded',
  'polar-ring': 'edge-only',
  'trojan-camp': 'embedded',
  'inner-pair-halo': 'edge-only',
  'kozai-scattered-halo': 'transient-only',
  'hill-sphere-capture-cone': 'transient-only',
  'exocomet-swarm': 'unanchorable',
  'accretion-bridge': 'unanchorable',
  'gardener-cordon': 'unanchorable',
}

const DENSITY_BY_SHAPE: Record<DebrisFieldShape, DebrisDensityBand> = {
  'mass-transfer-stream': 'stream',
  'common-envelope-shell': 'shell-dense',
  'polar-ring': 'asteroid-fleet',
  'trojan-camp': 'asteroid-fleet',
  'inner-pair-halo': 'asteroid-fleet',
  'kozai-scattered-halo': 'sparse',
  'hill-sphere-capture-cone': 'sparse',
  'exocomet-swarm': 'sparse',
  'accretion-bridge': 'dust',
  'gardener-cordon': 'dust',
}

function pickOneFromPool<T>(rng: SeededRng, pool: T[]): T {
  if (pool.length === 0) throw new Error('empty pool')
  return pool[Math.floor(rng.next() * pool.length) % pool.length]
}

function spawnPhenomenonForField(
  rng: SeededRng,
  fieldId: string,
  shape: DebrisFieldShape,
): SystemPhenomenon {
  const data = debrisArchetypeData(shape)
  return {
    id: `phen-debris-${fieldId}`,
    phenomenon: fact(pickOneFromPool(rng.fork('label'), data.phenomenon.labelPool), 'inferred', `Spawned by debris field ${fieldId}`),
    note: fact(pickOneFromPool(rng.fork('note'), data.phenomenon.notePool), 'inferred', 'Debris-spawned phenomenon'),
    travelEffect: fact(pickOneFromPool(rng.fork('travel'), data.phenomenon.travelEffectPool), 'inferred', 'Debris-spawned'),
    surveyQuestion: fact(pickOneFromPool(rng.fork('survey'), data.phenomenon.surveyQuestionPool), 'inferred', 'Debris-spawned'),
    conflictHook: fact(pickOneFromPool(rng.fork('conflict'), data.phenomenon.conflictHookPool), 'inferred', 'Debris-spawned'),
    sceneAnchor: fact(pickOneFromPool(rng.fork('anchor'), data.phenomenon.sceneAnchorPool), 'inferred', 'Debris-spawned'),
  }
}

export interface DebrisDerivationResult {
  debrisFields: DebrisField[]
  spawnedPhenomena: SystemPhenomenon[]
}

export interface SystemDebrisContext {
  architectureName?: string
  habitableOuterAu?: number
  snowLineAu?: number
}

interface SystemDebrisSelection {
  shape: DebrisFieldShape
  densityBand: DebrisDensityBand
  anchorMode: DebrisAnchorMode
  archetypeName: string
  whyHere: string
}

function selectSystemOriginDebris(primary: Star, context?: SystemDebrisContext): SystemDebrisSelection | null {
  const age = primary.ageState.value
  const architecture = context?.architectureName ?? ''

  if (age === 'Embryonic/very young') {
    return {
      shape: 'exocomet-swarm',
      densityBand: 'shell-dense',
      anchorMode: 'transient-only',
      archetypeName: 'Primordial debris chaos',
      whyHere: 'The system is still young enough that planetesimal debris has not settled into clean belts.',
    }
  }

  if (YOUNG_CHAOS_AGE_STATES.has(age) || architecture === 'Debris-dominated') {
    return {
      shape: 'exocomet-swarm',
      densityBand: 'asteroid-fleet',
      anchorMode: 'transient-only',
      archetypeName: 'Young-system debris storm',
      whyHere: 'Recent formation and migration left broken lanes of dust, ice, and planetesimal rubble across the outer system.',
    }
  }

  if (architecture === 'Giant-rich or chaotic' || architecture === 'Migrated giant') {
    return {
      shape: 'kozai-scattered-halo',
      densityBand: 'sparse',
      anchorMode: 'transient-only',
      archetypeName: 'Dynamically scattered debris',
      whyHere: 'Giant-planet migration and resonance pumping keep the system littered with eccentric debris paths.',
    }
  }

  return null
}

function spatialExtentForSystemOriginDebris(selection: SystemDebrisSelection, context?: SystemDebrisContext): DebrisFieldSpatialExtent {
  const f = (n: number, src: string): Fact<number> => fact(n, 'derived', src)
  const hzOuter = Math.max(0.05, context?.habitableOuterAu ?? 1.6)
  const snowLine = Math.max(hzOuter * 1.4, context?.snowLineAu ?? hzOuter * 2.7)
  const inner = selection.archetypeName.includes('Primordial')
    ? Math.max(0.05, hzOuter * 0.28)
    : Math.max(0.1, hzOuter * 0.75)
  const outer = selection.archetypeName.includes('Primordial')
    ? Math.max(snowLine * 3.6, inner * 8)
    : Math.max(snowLine * 2.8, inner * 4)

  return {
    innerAu: f(inner, 'system-origin debris inner edge'),
    outerAu: f(outer, 'system-origin debris outer extent'),
    inclinationDeg: f(selection.shape === 'kozai-scattered-halo' ? 58 : 24, 'system-origin debris scatter inclination'),
    spanDeg: f(360, 'system-origin debris wraps the system'),
    centerAngleDeg: f(0, 'system-origin debris has no preferred azimuth'),
  }
}

export function deriveDebrisFields(
  rng: SeededRng,
  system: Pick<GeneratedSystem, 'seed' | 'primary' | 'companions'>,
  _options: GenerationOptions,
  context?: SystemDebrisContext,
): DebrisDerivationResult {
  const fields: DebrisField[] = []
  const spawnedPhenomena: SystemPhenomenon[] = []
  const hierarchicalTriple = system.companions.some(c => c.id === 'companion-2')

  for (const companion of system.companions) {
    const selection = selectArchetypeForCompanion(
      { seed: system.seed },
      companion,
      system.primary,
      { hierarchicalTriple },
    )
    if (!selection) continue

    const sepAu = separationToBucketAu(companion.separation.value)
    const hwInner = circumbinaryInnerAuLimit(sepAu, system.primary.massSolar.value, companion.star.massSolar.value)
    const hwOuter = siblingOuterAuLimit(sepAu, system.primary.massSolar.value, companion.star.massSolar.value)

    const fieldRng = rng.fork(`field-${companion.id}`)
    const archetype = debrisArchetypeData(selection.shape)
    const fieldId = `debris-${companion.id}-${selection.shape}`

    const spawned = spawnPhenomenonForField(fieldRng.fork('phenomenon'), fieldId, selection.shape)
    spawnedPhenomena.push(spawned)

    const field: DebrisField = {
      id: fieldId,
      shape: fact(selection.shape, 'derived', `Selected by ${companion.id} mode/mu/activity`),
      archetypeName: fact(archetype.label, 'derived', 'archetype data'),
      companionId: companion.id,
      spatialExtent: spatialExtentForShape(selection.shape, {
        separationAu: sepAu,
        primaryMass: system.primary.massSolar.value,
        companionMass: companion.star.massSolar.value,
        hwInner,
        hwOuter,
      }),
      densityBand: fact(DENSITY_BY_SHAPE[selection.shape], 'inferred', 'shape default'),
      anchorMode: fact(ANCHOR_BY_SHAPE[selection.shape], 'inferred', 'shape default'),
      guCharacter: fact(pickOneFromPool(fieldRng.fork('gu'), archetype.guCharacterPool), 'gu-layer', 'archetype data'),
      prize: fact(pickOneFromPool(fieldRng.fork('prize'), archetype.prizePool), 'inferred', 'archetype data'),
      spawnedPhenomenonId: spawned.id,
      whyHere: fact(pickOneFromPool(fieldRng.fork('why'), archetype.whyHerePool), 'inferred', 'archetype data'),
    }
    fields.push(field)
  }

  const systemSelection = selectSystemOriginDebris(system.primary, context)
  if (systemSelection) {
    const fieldId = `debris-system-${systemSelection.shape}`
    if (!fields.some((field) => field.id === fieldId)) {
      fields.push({
        id: fieldId,
        shape: fact(systemSelection.shape, 'derived', 'Selected by system age/architecture chaos'),
        archetypeName: fact(systemSelection.archetypeName, 'derived', 'system-origin debris profile'),
        companionId: null,
        spatialExtent: spatialExtentForSystemOriginDebris(systemSelection, context),
        densityBand: fact(systemSelection.densityBand, 'inferred', 'system-origin debris density'),
        anchorMode: fact(systemSelection.anchorMode, 'inferred', 'system-origin debris anchor mode'),
        guCharacter: fact('Bleed is uneven across the debris lanes; long exposures are worse near dense knots.', 'gu-layer', 'system-origin debris'),
        prize: fact('freshly exposed planetesimal cores, volatile ice, and unclaimed formation-era debris', 'inferred', 'system-origin debris'),
        spawnedPhenomenonId: null,
        whyHere: fact(systemSelection.whyHere, 'inferred', 'system-origin debris'),
      })
    }
  }

  return { debrisFields: fields, spawnedPhenomena }
}

const ATTACHMENT_PROB: Record<DebrisAnchorMode, number> = {
  embedded: 0.30,
  'edge-only': 0.15,
  'transient-only': 0.50,
  unanchorable: 0,
}

const TRANSIENT_PATTERNS = new Set(['Mobile site', 'Distributed swarm'])

export function attachSettlementsToDebrisFields(
  rng: SeededRng,
  settlements: Settlement[],
  debrisFields: DebrisField[],
  bodyOrbitAuById: Map<string, number>,
): Settlement[] {
  if (debrisFields.length === 0) return settlements
  return settlements.map(settlement => {
    if (!settlement.bodyId) return settlement
    const bodyOrbit = bodyOrbitAuById.get(settlement.bodyId)
    if (bodyOrbit === undefined) return settlement
    for (const field of debrisFields) {
      const inExtent = bodyOrbit >= field.spatialExtent.innerAu.value && bodyOrbit <= field.spatialExtent.outerAu.value
      if (!inExtent) continue
      const anchorMode = field.anchorMode.value
      const prob = ATTACHMENT_PROB[anchorMode]
      if (prob === 0) continue
      if (anchorMode === 'transient-only' && !TRANSIENT_PATTERNS.has(settlement.habitationPattern.value)) continue
      const roll = rng.fork(`s-${settlement.id}-f-${field.id}`).next()
      if (roll > prob) continue
      return { ...settlement, debrisFieldId: field.id, bodyId: undefined }
    }
    return settlement
  })
}

export function attachRuinsToDebrisFields(
  rng: SeededRng,
  ruins: HumanRemnant[],
  debrisFields: DebrisField[],
  ruinBodyOrbitById: Map<string, number>,
): HumanRemnant[] {
  if (debrisFields.length === 0) return ruins
  return ruins.map(ruin => {
    const orbit = ruinBodyOrbitById.get(ruin.id)
    if (orbit === undefined) return ruin
    for (const field of debrisFields) {
      const inExtent = orbit >= field.spatialExtent.innerAu.value && orbit <= field.spatialExtent.outerAu.value
      if (!inExtent) continue
      const prob = ATTACHMENT_PROB[field.anchorMode.value]
      if (prob === 0) continue
      const roll = rng.fork(`r-${ruin.id}-f-${field.id}`).next()
      if (roll > prob) continue
      return { ...ruin, debrisFieldId: field.id }
    }
    return ruin
  })
}
