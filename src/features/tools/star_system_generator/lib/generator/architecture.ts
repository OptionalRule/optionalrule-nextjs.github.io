import type { BodyCategory, OrbitingBody } from '../../types'
import type { BodyPlanKind } from './domain'
import { fullPlanetCategories, giantCategories, minorBodyCategories, rockyChainCategories } from './domain'
import type { SeededRng } from './rng'

export type ArchitectureSlotRole = 'core' | 'support' | 'scar-extra' | 'known-import' | 'replacement'

export type ArchitectureCountTarget = 'full-planet' | 'minor-body' | 'rocky-chain' | 'giant' | 'anomaly'

export type OrbitBand = 'inner' | 'habitable' | 'snowline' | 'outer' | 'deepOuter' | 'extremeOuter'

export interface ArchitectureSlot {
  id: string
  planKind: BodyPlanKind
  role: ArchitectureSlotRole
  countsToward: ArchitectureCountTarget[]
  requirementId?: string
  orbitBand?: OrbitBand
  source: string
}

export interface ArchitectureRequirement {
  id: string
  label: string
  target: ArchitectureCountTarget
  min?: number
  max?: number
  replacementKind?: BodyPlanKind
}

export interface ArchitectureDominanceRequirement {
  id: string
  label: string
  dominantTarget: ArchitectureCountTarget
  secondaryTarget: ArchitectureCountTarget
  tolerance: number
  replacementKind?: BodyPlanKind
}

export interface ArchitectureProfile {
  name: string
  bodyRange: readonly [number, number]
  intent: string
  requirements: ArchitectureRequirement[]
  dominanceRequirements?: ArchitectureDominanceRequirement[]
}

export interface ArchitectureSatisfaction {
  requirementId: string
  label: string
  passed: boolean
  observed: unknown
  expected: string
  deficit: number
  replacementKind?: BodyPlanKind
  message: string
}

function weightedPick<T>(rng: SeededRng, entries: Array<{ weight: number; value: T }>): T {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = rng.float(0, total)
  for (const entry of entries) {
    roll -= entry.weight
    if (roll <= 0) return entry.value
  }
  return entries[entries.length - 1].value
}

function pushRepeated<T>(target: T[], count: number, create: (index: number) => T): void {
  for (let index = 0; index < count; index++) {
    target.push(create(index))
  }
}

function weightedCount(rng: SeededRng, entries: Array<{ weight: number; value: number }>): number {
  return weightedPick(rng, entries)
}

function planetLikeKind(rng: SeededRng): BodyPlanKind {
  return weightedPick(rng, [
    { weight: 45, value: 'rocky' },
    { weight: 35, value: 'super-earth' },
    { weight: 19, value: 'sub-neptune' },
    { weight: 1, value: 'anomaly' },
  ])
}

function corePlanetKind(rng: SeededRng): BodyPlanKind {
  return weightedPick(rng, [
    { weight: 45, value: 'rocky' },
    { weight: 35, value: 'super-earth' },
    { weight: 20, value: 'sub-neptune' },
  ])
}

function rockyOrSuperKind(rng: SeededRng): BodyPlanKind {
  return weightedPick(rng, [
    { weight: 58, value: 'rocky' },
    { weight: 34, value: 'super-earth' },
    { weight: 6, value: 'sub-neptune' },
    { weight: 2, value: 'anomaly' },
  ])
}

function failedRemnantKind(rng: SeededRng): BodyPlanKind {
  return weightedPick(rng, [
    { weight: 50, value: 'dwarf' },
    { weight: 30, value: 'rocky' },
    { weight: 12, value: 'super-earth' },
    { weight: 8, value: 'anomaly' },
  ])
}

function rockySurvivorKind(rng: SeededRng): BodyPlanKind {
  return weightedPick(rng, [
    { weight: 55, value: 'rocky' },
    { weight: 25, value: 'super-earth' },
    { weight: 10, value: 'sub-neptune' },
    { weight: 7, value: 'belt' },
    { weight: 3, value: 'anomaly' },
  ])
}

function debrisKind(rng: SeededRng): BodyPlanKind {
  return weightedPick(rng, [
    { weight: 42, value: 'belt' },
    { weight: 30, value: 'ice-belt' },
    { weight: 18, value: 'dwarf' },
    { weight: 6, value: 'rogue' },
    { weight: 4, value: 'anomaly' },
  ])
}

function giantKind(rng: SeededRng): BodyPlanKind {
  return rng.chance(0.62) ? 'gas-giant' : 'ice-giant'
}

function targetsForPlanKind(planKind: BodyPlanKind): ArchitectureCountTarget[] {
  if (planKind === 'rocky' || planKind === 'super-earth' || planKind === 'sub-neptune') return ['full-planet', 'rocky-chain']
  if (planKind === 'gas-giant' || planKind === 'ice-giant') return ['full-planet', 'giant']
  if (planKind === 'belt' || planKind === 'ice-belt' || planKind === 'dwarf' || planKind === 'rogue') return ['minor-body']
  if (planKind === 'anomaly') return ['anomaly']
  return []
}

function slot(
  id: string,
  planKind: BodyPlanKind,
  role: ArchitectureSlotRole,
  source: string,
  requirementId?: string,
  orbitBand?: OrbitBand
): ArchitectureSlot {
  return {
    id,
    planKind,
    role,
    countsToward: targetsForPlanKind(planKind),
    requirementId,
    orbitBand,
    source,
  }
}

const failedSystemProfile: ArchitectureProfile = {
  name: 'Failed system',
  bodyRange: [4, 9],
  intent: 'Debris, dwarf bodies, and zero or one remnant full planet dominate.',
  requirements: [
    { id: 'failed-full-planet-cap', label: 'full planets', target: 'full-planet', max: 3 },
    { id: 'failed-minor-floor', label: 'debris/minor bodies', target: 'minor-body', min: 2, replacementKind: 'belt' },
  ],
}

const debrisDominatedProfile: ArchitectureProfile = {
  name: 'Debris-dominated',
  bodyRange: [5, 12],
  intent: 'Belts and minor bodies dominate, with zero to two full-planet survivors and rare giant/anomaly crossovers.',
  requirements: [
    { id: 'debris-minor-floor', label: 'debris/minor bodies', target: 'minor-body', min: 2, replacementKind: 'belt' },
  ],
  dominanceRequirements: [
    {
      id: 'debris-minor-dominance',
      label: 'debris/minor dominance',
      dominantTarget: 'minor-body',
      secondaryTarget: 'full-planet',
      tolerance: 1,
      replacementKind: 'belt',
    },
  ],
}

const architectureProfiles: Record<string, ArchitectureProfile> = {
  [failedSystemProfile.name]: failedSystemProfile,
  [debrisDominatedProfile.name]: debrisDominatedProfile,
  'Sparse rocky': {
    name: 'Sparse rocky',
    bodyRange: [2, 8],
    intent: 'One to four rocky or super-terrestrial worlds lead, with limited debris and unusual crossovers.',
    requirements: [
      { id: 'sparse-rocky-survivor', label: 'rocky/super-terrestrial/sub-Neptune survivor', target: 'rocky-chain', min: 1, replacementKind: 'rocky' },
      { id: 'sparse-giant-cap', label: 'giants', target: 'giant', max: 1 },
    ],
  },
  'Compact inner system': {
    name: 'Compact inner system',
    bodyRange: [5, 10],
    intent: 'Three to eight rocky, super-Earth, or sub-Neptune worlds lead, with rare debris or giant exceptions.',
    requirements: [
      { id: 'compact-rocky-core', label: 'rocky/super-Earth/sub-Neptune bodies', target: 'rocky-chain', min: 3, replacementKind: 'rocky' },
    ],
  },
  'Peas-in-a-pod chain': {
    name: 'Peas-in-a-pod chain',
    bodyRange: [4, 9],
    intent: 'Four to seven similar-sized planets form the main chain, with rare debris or giant exceptions.',
    requirements: [
      { id: 'peas-rocky-chain', label: 'chain bodies', target: 'rocky-chain', min: 4, replacementKind: 'super-earth' },
    ],
  },
  'Solar-ish mixed': {
    name: 'Solar-ish mixed',
    bodyRange: [4, 19],
    intent: 'Variable inner rocks, variable belts, one to four giants, and outer minor bodies.',
    requirements: [
      { id: 'solarish-giant-floor', label: 'giant planet', target: 'giant', min: 1, replacementKind: 'gas-giant' },
    ],
  },
  'Migrated giant': {
    name: 'Migrated giant',
    bodyRange: [3, 11],
    intent: 'At least one hot or warm gas giant plus disrupted survivors and outer remnants.',
    requirements: [
      { id: 'migrated-giant-floor', label: 'generated giant', target: 'giant', min: 1, replacementKind: 'gas-giant' },
    ],
  },
  'Giant-rich or chaotic': {
    name: 'Giant-rich or chaotic',
    bodyRange: [5, 16],
    intent: 'Multiple giants, survivor worlds, debris, and possible captured or anomalous bodies.',
    requirements: [
      { id: 'giant-rich-floor', label: 'giants', target: 'giant', min: 2, replacementKind: 'gas-giant' },
    ],
  },
}

export const architectureBodyPlanRules = Object.fromEntries(
  Object.entries(architectureProfiles).map(([name, profile]) => [
    name,
    { bodyRange: profile.bodyRange, intent: profile.intent },
  ])
) as Record<string, { bodyRange: readonly [number, number]; intent: string }>

export function getArchitectureProfile(architectureName: string): ArchitectureProfile {
  return architectureProfiles[architectureName] ?? architectureProfiles['Giant-rich or chaotic']
}

export function getArchitectureProfiles(): ArchitectureProfile[] {
  return Object.values(architectureProfiles)
}

export function buildArchitectureSlots(rng: SeededRng, architectureName: string): ArchitectureSlot[] {
  const slots: ArchitectureSlot[] = []

  if (architectureName === 'Failed system') {
    pushRepeated(slots, weightedCount(rng, [
      { weight: 45, value: 0 },
      { weight: 55, value: 1 },
    ]), (index) => slot(`failed-remnant-${index + 1}`, failedRemnantKind(rng), 'support', 'Failed system remnant slot', undefined, rng.chance(0.65) ? 'outer' : 'deepOuter'))
    pushRepeated(slots, rng.int(4, 8), (index) => slot(`failed-debris-${index + 1}`, debrisKind(rng), 'support', 'Failed system debris slot', 'failed-minor-floor', rng.chance(0.58) ? 'deepOuter' : 'outer'))
    if (rng.chance(0.1)) slots.push(slot('failed-rogue-extra', 'rogue', 'support', 'Failed system rogue extra', undefined, 'extremeOuter'))
    return slots
  }

  if (architectureName === 'Debris-dominated') {
    pushRepeated(slots, rng.int(0, 2), (index) => slot(`debris-survivor-${index + 1}`, rockySurvivorKind(rng), 'support', 'Debris-dominated survivor slot', undefined, rng.chance(0.75) ? 'inner' : 'habitable'))
    pushRepeated(slots, rng.int(5, 9), (index) => slot(`debris-field-${index + 1}`, debrisKind(rng), 'support', 'Debris-dominated debris slot', 'debris-minor-floor', rng.chance(0.64) ? 'outer' : 'deepOuter'))
    if (rng.chance(0.12)) slots.push(slot('debris-giant-extra', giantKind(rng), 'support', 'Debris-dominated giant crossover', undefined, 'snowline'))
    if (rng.chance(0.1)) slots.push(slot('debris-scar-extra', 'anomaly', 'scar-extra', 'Debris-dominated anomaly scar', undefined, rng.chance(0.5) ? 'outer' : 'deepOuter'))
    return slots
  }

  if (architectureName === 'Sparse rocky') {
    slots.push(slot('sparse-rocky-core-1', corePlanetKind(rng), 'core', 'Sparse rocky required survivor', 'sparse-rocky-survivor', rng.chance(0.72) ? 'inner' : 'habitable'))
    pushRepeated(slots, rng.int(1, 3), (index) => slot(`sparse-rocky-support-${index + 1}`, rockyOrSuperKind(rng), 'support', 'Sparse rocky survivor support', undefined, rng.chance(0.72) ? 'inner' : 'habitable'))
    pushRepeated(slots, rng.int(0, 2), (index) => slot(`sparse-debris-${index + 1}`, debrisKind(rng), 'support', 'Sparse rocky debris support', undefined, rng.chance(0.55) ? 'outer' : 'deepOuter'))
    if (rng.chance(0.15)) slots.push(slot('sparse-giant-extra', giantKind(rng), 'support', 'Sparse rocky rare giant', undefined, rng.chance(0.65) ? 'snowline' : 'outer'))
    if (rng.chance(0.1)) slots.push(slot('sparse-unusual-extra', rng.chance(0.55) ? 'sub-neptune' : 'anomaly', 'support', 'Sparse rocky unusual crossover', undefined, rng.chance(0.65) ? 'habitable' : 'outer'))
    return slots
  }

  if (architectureName === 'Compact inner system') {
    const coreCount = rng.int(5, 8)
    pushRepeated(slots, 3, (index) => slot(`compact-core-${index + 1}`, corePlanetKind(rng), 'core', 'Compact inner required rocky-chain core', 'compact-rocky-core', index === 2 ? 'habitable' : 'inner'))
    pushRepeated(slots, coreCount - 3, (index) => slot(`compact-support-${index + 1}`, planetLikeKind(rng), 'support', 'Compact inner supporting planet slot', undefined, rng.chance(0.76) ? 'inner' : 'habitable'))
    pushRepeated(slots, rng.int(0, 1), (index) => slot(`compact-debris-${index + 1}`, rng.chance(0.7) ? 'belt' : 'dwarf', 'support', 'Compact inner limited debris', undefined, rng.chance(0.75) ? 'habitable' : 'snowline'))
    if (rng.chance(0.08)) slots.push(slot('compact-giant-extra', giantKind(rng), 'support', 'Compact inner rare giant', undefined, 'snowline'))
    return slots
  }

  if (architectureName === 'Peas-in-a-pod chain') {
    const family = weightedPick(rng, [
      { weight: 45, value: 'rocky' as const },
      { weight: 35, value: 'super-earth' as const },
      { weight: 20, value: 'sub-neptune' as const },
    ])
    const chainCount = rng.int(4, 7)
    pushRepeated(slots, 4, (index) => slot(`peas-core-${index + 1}`, family, 'core', 'Peas-in-a-pod required chain core', 'peas-rocky-chain', index >= 2 ? 'habitable' : 'inner'))
    pushRepeated(slots, chainCount - 4, (index) => slot(`peas-support-${index + 1}`, rng.chance(0.86) ? family : planetLikeKind(rng), 'support', 'Peas-in-a-pod supporting chain slot', undefined, rng.chance(0.55) ? 'inner' : 'habitable'))
    pushRepeated(slots, rng.int(0, 1), (index) => slot(`peas-debris-${index + 1}`, debrisKind(rng), 'support', 'Peas-in-a-pod limited debris', undefined, 'snowline'))
    if (rng.chance(0.08)) slots.push(slot('peas-giant-extra', giantKind(rng), 'support', 'Peas-in-a-pod rare giant', undefined, 'snowline'))
    return slots
  }

  if (architectureName === 'Solar-ish mixed') {
    pushRepeated(slots, rng.int(2, 5), (index) => slot(`solarish-inner-${index + 1}`, rockyOrSuperKind(rng), 'support', 'Solar-ish inner rocky slot', undefined, rng.chance(0.68) ? 'inner' : 'habitable'))
    pushRepeated(slots, weightedCount(rng, [
      { weight: 12, value: 0 },
      { weight: 48, value: 1 },
      { weight: 30, value: 2 },
      { weight: 10, value: 3 },
    ]), (index) => slot(`solarish-belt-${index + 1}`, rng.chance(0.7) ? 'belt' : 'ice-belt', 'support', 'Solar-ish belt slot', undefined, index === 0 ? 'snowline' : 'outer'))
    const giantCount = weightedCount(rng, [
      { weight: 42, value: 1 },
      { weight: 38, value: 2 },
      { weight: 16, value: 3 },
      { weight: 4, value: 4 },
    ])
    slots.push(slot('solarish-giant-core-1', 'gas-giant', 'core', 'Solar-ish required giant', 'solarish-giant-floor', 'snowline'))
    pushRepeated(slots, giantCount - 1, (index) => slot(`solarish-giant-support-${index + 1}`, giantKind(rng), 'support', 'Solar-ish giant support', undefined, index === 0 ? 'outer' : rng.chance(0.65) ? 'outer' : 'deepOuter'))
    pushRepeated(slots, rng.int(1, 5), (index) => slot(`solarish-outer-${index + 1}`, debrisKind(rng), 'support', 'Solar-ish outer minor-body slot', undefined, rng.chance(0.68) ? 'outer' : 'deepOuter'))
    if (rng.chance(0.14)) slots.push(slot('solarish-rogue-extra', 'rogue', 'support', 'Solar-ish rogue extra', undefined, 'extremeOuter'))
    if (rng.chance(0.08)) slots.push(slot('solarish-scar-extra', 'anomaly', 'scar-extra', 'Solar-ish anomaly scar', undefined, rng.chance(0.5) ? 'outer' : 'deepOuter'))
    return slots
  }

  if (architectureName === 'Migrated giant') {
    slots.push(slot('migrated-giant-core-1', 'gas-giant', 'core', 'Migrated giant required giant', 'migrated-giant-floor', rng.chance(0.76) ? 'inner' : 'habitable'))
    pushRepeated(slots, rng.int(1, 4), (index) => slot(`migrated-survivor-${index + 1}`, rockySurvivorKind(rng), 'support', 'Migrated giant disrupted survivor', undefined, rng.chance(0.65) ? 'inner' : 'habitable'))
    pushRepeated(slots, rng.int(1, 4), (index) => slot(`migrated-outer-${index + 1}`, rng.chance(0.35) ? giantKind(rng) : debrisKind(rng), 'support', 'Migrated giant outer remnant', undefined, rng.chance(0.62) ? 'outer' : 'deepOuter'))
    if (rng.chance(0.25)) slots.splice(rng.int(0, slots.length - 1), 0, slot('migrated-belt-extra', 'belt', 'support', 'Migrated giant injected belt', undefined, 'snowline'))
    if (rng.chance(0.15)) slots.push(slot('migrated-scar-extra', 'anomaly', 'scar-extra', 'Migrated giant anomaly scar', undefined, rng.chance(0.5) ? 'outer' : 'deepOuter'))
    return slots
  }

  pushRepeated(slots, rng.int(1, 4), (index) => slot(`giant-rich-survivor-${index + 1}`, rockySurvivorKind(rng), 'support', 'Giant-rich survivor', undefined, rng.chance(0.7) ? 'inner' : 'habitable'))
  pushRepeated(slots, 2, (index) => slot(`giant-rich-core-${index + 1}`, giantKind(rng), 'core', 'Giant-rich required giant', 'giant-rich-floor', index === 0 ? 'snowline' : 'outer'))
  pushRepeated(slots, rng.int(0, 3), (index) => slot(`giant-rich-support-${index + 1}`, giantKind(rng), 'support', 'Giant-rich supporting giant', undefined, rng.chance(0.75) ? 'outer' : 'deepOuter'))
  pushRepeated(slots, rng.int(2, 5), (index) => slot(`giant-rich-debris-${index + 1}`, debrisKind(rng), 'support', 'Giant-rich debris', undefined, rng.chance(0.58) ? 'outer' : 'deepOuter'))
  if (rng.chance(0.25)) slots.splice(0, 0, slot('giant-rich-inner-giant-extra', giantKind(rng), 'support', 'Giant-rich inner giant extra', undefined, 'habitable'))
  if (rng.chance(0.25)) slots.push(slot('giant-rich-rogue-extra', 'rogue', 'support', 'Giant-rich rogue extra', undefined, 'extremeOuter'))
  if (rng.chance(0.28)) slots.push(slot('giant-rich-scar-extra', 'anomaly', 'scar-extra', 'Giant-rich anomaly scar', undefined, rng.chance(0.5) ? 'outer' : 'deepOuter'))
  return slots
}

export function createKnownImportSlot(index: number): ArchitectureSlot {
  return slot(`known-import-${index + 1}`, 'thermal', 'known-import', 'Additional known imported body slot')
}

function targetCategories(target: ArchitectureCountTarget): ReadonlySet<BodyCategory> {
  if (target === 'full-planet') return fullPlanetCategories
  if (target === 'minor-body') return minorBodyCategories
  if (target === 'rocky-chain') return rockyChainCategories
  if (target === 'giant') return giantCategories
  return new Set<BodyCategory>(['anomaly'])
}

function countTarget(bodies: OrbitingBody[], target: ArchitectureCountTarget): number {
  const categories = targetCategories(target)
  return bodies.filter((body) => categories.has(body.category.value)).length
}

export function evaluateArchitectureSatisfaction(architectureName: string, bodies: OrbitingBody[]): ArchitectureSatisfaction[] {
  const profile = getArchitectureProfile(architectureName)
  const findings: ArchitectureSatisfaction[] = []

  for (const requirement of profile.requirements) {
    const observed = countTarget(bodies, requirement.target)
    if (requirement.min !== undefined && observed < requirement.min) {
      findings.push({
        requirementId: requirement.id,
        label: requirement.label,
        passed: false,
        observed,
        expected: `>= ${requirement.min}`,
        deficit: requirement.min - observed,
        replacementKind: requirement.replacementKind,
        message: `${profile.name} generated only ${observed} ${requirement.label}.`,
      })
    }
    if (requirement.max !== undefined && observed > requirement.max) {
      findings.push({
        requirementId: requirement.id,
        label: requirement.label,
        passed: false,
        observed,
        expected: `<= ${requirement.max}`,
        deficit: 0,
        replacementKind: requirement.replacementKind,
        message: `${profile.name} generated ${observed} ${requirement.label}.`,
      })
    }
  }

  for (const requirement of profile.dominanceRequirements ?? []) {
    const dominant = countTarget(bodies, requirement.dominantTarget)
    const secondary = countTarget(bodies, requirement.secondaryTarget)
    if (dominant + requirement.tolerance < secondary) {
      findings.push({
        requirementId: requirement.id,
        label: requirement.label,
        passed: false,
        observed: { dominant, secondary },
        expected: `${requirement.dominantTarget} + ${requirement.tolerance} >= ${requirement.secondaryTarget}`,
        deficit: secondary - dominant - requirement.tolerance,
        replacementKind: requirement.replacementKind,
        message: `${profile.name} has ${dominant} ${requirement.dominantTarget} bodies versus ${secondary} ${requirement.secondaryTarget} bodies.`,
      })
    }
  }

  return findings
}

export function replacementSlotsForUnsatisfiedRequirements(satisfaction: ArchitectureSatisfaction[]): ArchitectureSlot[] {
  const replacements: ArchitectureSlot[] = []

  for (const result of satisfaction) {
    if (result.passed || result.deficit <= 0 || !result.replacementKind) continue
    const replacementKind = result.replacementKind
    const replacementBand = replacementOrbitBand(result.requirementId)
    pushRepeated(replacements, result.deficit, (index) =>
      slot(
        `${result.requirementId}-replacement-${index + 1}`,
        replacementKind,
        'replacement',
        `Architecture replacement for ${result.label}`,
        result.requirementId,
        replacementBand
      )
    )
  }

  return replacements
}

function replacementOrbitBand(requirementId: string): OrbitBand | undefined {
  if (requirementId === 'compact-rocky-core' || requirementId === 'peas-rocky-chain') return 'inner'
  if (requirementId === 'solarish-giant-floor' || requirementId === 'giant-rich-floor') return 'snowline'
  if (requirementId === 'failed-minor-floor' || requirementId === 'debris-minor-floor') return 'outer'
  if (requirementId === 'sparse-rocky-survivor' || requirementId === 'migrated-giant-floor') return 'habitable'
  return undefined
}
