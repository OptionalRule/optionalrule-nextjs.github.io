import type { GeneratedSystem, HumanRemnant, OrbitingBody } from '../../types'
import { hashToUnit } from './motion'

export interface RuinClassification {
  body: OrbitingBody
}

interface ClassifierRule {
  keywords: readonly string[]
  resolve: (system: GeneratedSystem) => OrbitingBody | null
}

function bodiesByOrbit(system: GeneratedSystem): OrbitingBody[] {
  return [...system.bodies].sort((a, b) => a.orbitAu.value - b.orbitAu.value)
}

function firstBeltBody(system: GeneratedSystem, key: string): OrbitingBody | null {
  const belts = system.bodies.filter((b) => b.category.value === 'belt')
  if (belts.length === 0) return null
  const idx = Math.floor(hashToUnit(`ruin-belt-pick#${key}`) * belts.length)
  return belts[Math.min(belts.length - 1, idx)] ?? null
}

function firstGiantBody(system: GeneratedSystem, key: string): OrbitingBody | null {
  const giants = system.bodies.filter((b) => b.category.value === 'gas-giant' || b.category.value === 'ice-giant')
  if (giants.length === 0) return null
  const idx = Math.floor(hashToUnit(`ruin-giant-pick#${key}`) * giants.length)
  return giants[Math.min(giants.length - 1, idx)] ?? null
}

function innermostRocky(system: GeneratedSystem): OrbitingBody | null {
  const inner = bodiesByOrbit(system).find((b) =>
    b.category.value === 'rocky-planet'
    || b.category.value === 'super-earth'
    || b.category.value === 'dwarf-body',
  )
  return inner ?? null
}

function outermostBody(system: GeneratedSystem): OrbitingBody | null {
  const ordered = bodiesByOrbit(system).filter((b) => b.category.value !== 'belt')
  return ordered[ordered.length - 1] ?? null
}

const NO_ANCHOR_KEYWORDS: readonly string[] = [
  'derelict route',
  'derelict-route',
  'drift',
  'transit',
  'cloud',
  'deep space',
  'between worlds',
  'no fixed',
  'rogue',
  'lagrange',
]

function buildRules(ruinKey: string): readonly ClassifierRule[] {
  return [
    {
      keywords: ['asteroid', 'belt', 'rubble', 'rockfield', 'rock field'],
      resolve: (system) => firstBeltBody(system, ruinKey),
    },
    {
      keywords: ['gas giant', 'ice giant', 'giant moon', 'jovian'],
      resolve: (system) => firstGiantBody(system, ruinKey),
    },
    {
      keywords: ['inner system', 'inner world', 'hot world', 'melted', 'sunward', 'inside the snowline'],
      resolve: (system) => innermostRocky(system),
    },
    {
      keywords: ['outer system', 'outer reaches', 'dark edge', 'beyond the snow', 'past the snow', 'far edge'],
      resolve: (system) => outermostBody(system),
    },
  ]
}

export function classifyRuin(ruin: HumanRemnant, system: GeneratedSystem): RuinClassification | null {
  const location = ruin.location.value.toLowerCase()
  if (!location) return null

  if (NO_ANCHOR_KEYWORDS.some((k) => location.includes(k))) return null

  const rules = buildRules(ruin.id)
  for (const rule of rules) {
    if (rule.keywords.some((k) => location.includes(k))) {
      const body = rule.resolve(system)
      if (body) return { body }
    }
  }
  return null
}
