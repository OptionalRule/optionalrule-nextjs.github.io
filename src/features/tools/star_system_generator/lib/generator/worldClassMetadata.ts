import type { BodyCategory } from '../../types'
import {
  envelopeCategories,
  fullPlanetCategories,
  giantCategories,
  minorBodyCategories,
  rockyChainCategories,
  type WorldClassArchitectureTag,
  type WorldClassEnvironmentProfile,
  type WorldClassOption,
  type WorldClassPhysicalTag,
  type WorldClassSpecialHandling,
} from './domain'

export interface WorldClassMetadata {
  environmentProfileHint: WorldClassEnvironmentProfile
  architectureTags: WorldClassArchitectureTag[]
  physicalTags: WorldClassPhysicalTag[]
  specialHandling: WorldClassSpecialHandling[]
}

function includesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value))
}

function addArchitectureTags(tags: Set<WorldClassArchitectureTag>, category: BodyCategory): void {
  if (fullPlanetCategories.has(category)) tags.add('full-planet')
  if (minorBodyCategories.has(category)) tags.add('minor-body')
  if (rockyChainCategories.has(category)) tags.add('rocky-chain')
  if (giantCategories.has(category)) tags.add('giant')
  if (category === 'anomaly') tags.add('anomaly')
}

function derivedEnvironmentProfile(option: WorldClassOption, physicalTags: Set<WorldClassPhysicalTag>): WorldClassEnvironmentProfile {
  if (option.category === 'belt') return 'belt'
  if (physicalTags.has('facility')) return 'facility'
  if (option.category === 'anomaly') return 'anomaly'
  if (physicalTags.has('airless')) return 'airless'
  if (physicalTags.has('desert')) return 'desert'
  if (physicalTags.has('hycean')) return 'ocean'
  if (physicalTags.has('water-ocean')) return 'ocean'
  if (physicalTags.has('ocean')) return 'ocean'
  if (envelopeCategories.has(option.category)) return 'envelope'
  return 'terrestrial'
}

export function deriveWorldClassMetadata(option: WorldClassOption): WorldClassMetadata {
  const className = option.className.toLowerCase()
  const physicalTags = new Set<WorldClassPhysicalTag>()
  const architectureTags = new Set<WorldClassArchitectureTag>()
  const specialHandling = new Set<WorldClassSpecialHandling>()

  addArchitectureTags(architectureTags, option.category)

  if (option.category === 'belt') {
    physicalTags.add('airless')
  }

  if (envelopeCategories.has(option.category) || includesAny(className, [/volatile-rich/, /sub-neptune/, /neptune/, /jupiter/, /gas giant/, /ice giant/, /hydrogen/])) {
    physicalTags.add('volatile-rich')
  }

  if (includesAny(className, [/\bairless\b/, /\bhard vacuum\b/, /\bscorched rock\b/])) {
    physicalTags.add('airless')
  }

  if (includesAny(className, [/\bdesert\b/, /\bdry\b/, /\bmars-like\b/, /\bmercury-like\b/, /hot neptune desert/, /hot super-earth/, /stripped mini-neptune core/])) {
    physicalTags.add('desert')
  }

  if (includesAny(className, [/\bgreenhouse\b/])) {
    physicalTags.add('greenhouse')
  }

  if (includesAny(className, [/\bsteam\b/])) {
    physicalTags.add('steam')
    physicalTags.add('greenhouse')
  }

  if (includesAny(className, [/\bcloud\b/, /\bcloudy\b/])) {
    physicalTags.add('cloud')
    physicalTags.add('greenhouse')
  }

  if (includesAny(className, [/\bhycean\b/])) {
    physicalTags.add('hycean')
    physicalTags.add('water-ocean')
    physicalTags.add('ocean')
  }

  if (includesAny(className, [/\bmagma ocean\b/, /\blava\b/])) {
    physicalTags.add('magma-ocean')
  }

  if (includesAny(className, [/\bocean\b/, /\bwaterworld\b/]) && !includesAny(className, [/\bmagma ocean\b/, /\blava\b/])) {
    physicalTags.add('water-ocean')
    physicalTags.add('ocean')
  }

  if (includesAny(className, [/\bhydrogen-atmosphere\b/, /\bhydrogen atmosphere\b/])) {
    physicalTags.add('hydrogen-atmosphere')
  }

  if (includesAny(className, [/\bfacility\b/, /\bplatform\b/, /\bterraforming\b/, /\bsettlement zone\b/, /\bindustry\b/, /\bblack-lab\b/, /\bexile habitat\b/, /\bsmuggler ice depot\b/])) {
    physicalTags.add('facility')
    specialHandling.add('managed-habitat')
  }

  if (includesAny(className, [/\bgu\b/, /\bchiral\b/, /\bbleed\b/, /\bobserviverse\b/, /\bmetric\b/, /\banomaly\b/, /\bfracture\b/, /\bgardener-shadowed\b/, /\bdark-sector\b/])) {
    physicalTags.add('gu-anomaly')
  }

  if (includesAny(className, [/\bstripped\b/, /\bremnant core\b/, /\biron remnant\b/, /\broche-distorted\b/])) {
    physicalTags.add('stripped-core')
  }

  if (option.category === 'anomaly') {
    specialHandling.add('no-moons')
    specialHandling.add('no-rings')
    specialHandling.add('metric-phenomenon')
  }

  const derived: WorldClassMetadata = {
    environmentProfileHint: derivedEnvironmentProfile(option, physicalTags),
    architectureTags: [...architectureTags],
    physicalTags: [...physicalTags],
    specialHandling: [...specialHandling],
  }

  return {
    environmentProfileHint: option.environmentProfileHint ?? derived.environmentProfileHint,
    architectureTags: [...new Set([...derived.architectureTags, ...(option.architectureTags ?? [])])],
    physicalTags: [...new Set([...derived.physicalTags, ...(option.physicalTags ?? [])])],
    specialHandling: [...new Set([...derived.specialHandling, ...(option.specialHandling ?? [])])],
  }
}

export function hasWorldClassPhysicalTag(option: WorldClassOption, tag: WorldClassPhysicalTag): boolean {
  return deriveWorldClassMetadata(option).physicalTags.includes(tag)
}

export function worldClassEnvironmentProfile(option: WorldClassOption): WorldClassEnvironmentProfile {
  return deriveWorldClassMetadata(option).environmentProfileHint
}

export function metadataForClassName(className: string): Pick<WorldClassMetadata, 'environmentProfileHint' | 'physicalTags'> {
  return deriveWorldClassMetadata({
    className,
    category: 'rocky-planet',
    massClass: 'Unknown',
  })
}
