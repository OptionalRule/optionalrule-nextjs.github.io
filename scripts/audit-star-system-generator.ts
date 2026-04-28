import { generateSystem } from '../src/features/tools/star_system_generator/lib/generator/index'
import { frontierStarTypes, realisticStarTypes } from '../src/features/tools/star_system_generator/lib/generator/tables'
import type {
  BodyCategory,
  GeneratedSystem,
  GenerationOptions,
  GeneratorDistribution,
  OrbitingBody,
  Settlement,
} from '../src/features/tools/star_system_generator/types'

type Severity = 'error' | 'warning'

interface Finding {
  severity: Severity
  seed: string
  path: string
  message: string
}

interface CorpusStats {
  systems: number
  bodies: number
  settlements: number
  moons: number
  starTypes: Map<string, number>
  starTypesByDistribution: Record<GeneratorDistribution, Map<string, number>>
  architectures: Map<string, number>
  categories: Map<BodyCategory, number>
  settlementCategories: Map<string, number>
}

const corpusPerDistribution = Number.parseInt(process.env.STAR_SYSTEM_AUDIT_COUNT ?? '500', 10)
const findingLimit = Number.parseInt(process.env.STAR_SYSTEM_AUDIT_FINDING_LIMIT ?? '50', 10)
const distributions: GeneratorDistribution[] = ['frontier', 'realistic']

const envelopeCategories = new Set<BodyCategory>(['sub-neptune', 'gas-giant', 'ice-giant'])
const solidSurfaceCategories = new Set<BodyCategory>(['rocky-planet', 'super-earth', 'dwarf-body', 'rogue-captured'])
const coldZones = new Set(['Cold', 'Cryogenic', 'Dark'])
const extremeHotZones = new Set(['Furnace', 'Inferno'])

const forbiddenAlienPatterns = [
  /\balien\b/i,
  /\bnonhuman\b/i,
  /\bnative\s+civilization\b/i,
  /\bancient\s+cities\b/i,
  /\bforbidden\s+archaeology\b/i,
]

const extremeHotAllowedAtmospheres = new Set([
  'None / hard vacuum',
  'Trace exosphere',
  'Rock-vapor atmosphere',
  'Metal vapor atmosphere',
  'Chiral-active atmosphere',
])

const extremeHotAllowedHydrospheres = new Set([
  'Bone dry',
  'Hydrated minerals only',
  'Vaporized volatile traces',
  'Nightside mineral frost',
])

const coldAllowedClimateTags = new Set([
  'Snowball',
  'Cold desert',
  'Aerosol winter',
  'Methane cycle',
  'CO2 glacier cycle',
  'Dark-sector gravity tides',
])

const envelopeAllowedGeologies = new Set([
  'Deep atmospheric circulation',
  'Metallic hydrogen interior',
  'Layered volatile mantle',
  'Magnetosphere-driven weather',
])

const allowedBuiltFormsBySiteCategory: Record<string, ReadonlySet<string>> = {
  'Surface settlement': new Set([
    'Buried pressure cans',
    'Ice-shielded tunnels',
    'Lava-tube arcology',
    'Dome cluster',
    'Rail-linked terminator city',
    'Aerostat city',
    'Submarine habitat',
    'Borehole habitat',
    'Shielded military bunker',
    'Corporate luxury enclave',
    'First-wave retrofitted ruin',
  ]),
  'Orbital station': new Set([
    'Inflatable modules',
    'Rotating cylinder',
    'Non-rotating microgravity stack',
    'Modular orbital lattice',
    'Ring-habitat arc',
    'Corporate luxury enclave',
    'Slum raft cluster',
    'Shielded military bunker',
  ]),
  'Asteroid or belt base': new Set([
    'Buried pressure cans',
    'Ice-shielded tunnels',
    'Asteroid hollow',
    'Modular orbital lattice',
    'Shielded military bunker',
    'First-wave retrofitted ruin',
  ]),
  'Moon base': new Set([
    'Buried pressure cans',
    'Ice-shielded tunnels',
    'Dome cluster',
    'Borehole habitat',
    'Shielded military bunker',
    'First-wave retrofitted ruin',
  ]),
  'Deep-space platform': new Set([
    'Inflatable modules',
    'Rotating cylinder',
    'Non-rotating microgravity stack',
    'Modular orbital lattice',
    'Ring-habitat arc',
    'Corporate luxury enclave',
    'Slum raft cluster',
    'Shielded military bunker',
  ]),
  'Gate or route node': new Set([
    'Non-rotating microgravity stack',
    'Modular orbital lattice',
    'Ring-habitat arc',
    'Shielded military bunker',
    'Partly self-growing programmable structure',
  ]),
  'Mobile site': new Set([
    'Inflatable modules',
    'Crawling mobile base',
    'Modular orbital lattice',
    'Rotating cylinder',
    'Shielded military bunker',
  ]),
  'Derelict or restricted site': new Set([
    'Asteroid hollow',
    'Shielded military bunker',
    'First-wave retrofitted ruin',
    'Partly self-growing programmable structure',
  ]),
}

function increment<Key>(map: Map<Key, number>, key: Key): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function makeSeed(distribution: GeneratorDistribution, index: number): string {
  const prefix = distribution === 'frontier' ? 'fa17a11d0000' : '5eedcafe0000'
  return `${prefix}${index.toString(16).padStart(4, '0')}`
}

function makeOptions(distribution: GeneratorDistribution, seed: string): GenerationOptions {
  return {
    seed,
    distribution,
    tone: 'balanced',
    gu: 'normal',
    settlements: 'normal',
  }
}

function addFinding(findings: Finding[], severity: Severity, seed: string, path: string, message: string): void {
  findings.push({ severity, seed, path, message })
}

function assertText(
  findings: Finding[],
  seed: string,
  path: string,
  value: string | undefined,
  label: string
): void {
  if (!value || value.trim().length === 0) {
    addFinding(findings, 'error', seed, path, `${label} is missing or blank.`)
  }
}

function collectStrings(value: unknown, path = '$'): Array<{ path: string; value: string }> {
  if (typeof value === 'string') return [{ path, value }]
  if (typeof value !== 'object' || value === null) return []
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectStrings(entry, `${path}[${index}]`))
  }

  return Object.entries(value).flatMap(([key, entry]) => {
    if (key === 'noAlienCheck') return []
    if (key === 'source') return []
    return collectStrings(entry, `${path}.${key}`)
  })
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length
}

function auditBody(system: GeneratedSystem, body: OrbitingBody, bodyIndex: number, findings: Finding[]): void {
  const seed = system.seed
  const path = `bodies[${bodyIndex}]`
  const category = body.category.value
  const thermalZone = body.thermalZone.value

  assertText(findings, seed, `${path}.name`, body.name.value, 'Body name')
  assertText(findings, seed, `${path}.bodyClass`, body.bodyClass.value, 'Body class')
  assertText(findings, seed, `${path}.whyInteresting`, body.whyInteresting.value, 'Body interest summary')

  if (body.orbitAu.value <= 0) {
    addFinding(findings, 'error', seed, `${path}.orbitAu`, `Orbit must be positive; got ${body.orbitAu.value}.`)
  }

  if (extremeHotZones.has(thermalZone) && !envelopeCategories.has(category)) {
    if (!extremeHotAllowedAtmospheres.has(body.detail.atmosphere.value)) {
      addFinding(findings, 'error', seed, `${path}.detail.atmosphere`, `${thermalZone} world has implausible atmosphere "${body.detail.atmosphere.value}".`)
    }
    if (!extremeHotAllowedHydrospheres.has(body.detail.hydrosphere.value)) {
      addFinding(findings, 'error', seed, `${path}.detail.hydrosphere`, `${thermalZone} world has implausible hydrosphere "${body.detail.hydrosphere.value}".`)
    }
  }

  if (extremeHotZones.has(thermalZone)) {
    if (body.detail.biosphere.value !== 'Sterile') {
      addFinding(findings, 'error', seed, `${path}.detail.biosphere`, `${thermalZone} world has non-sterile biosphere "${body.detail.biosphere.value}".`)
    }
    if (body.moons.length > 0) {
      addFinding(findings, 'error', seed, `${path}.moons`, `${thermalZone} world generated ${body.moons.length} moons.`)
    }
  }

  if (coldZones.has(thermalZone) && solidSurfaceCategories.has(category)) {
    const badClimate = body.detail.climate.find((tag) => !coldAllowedClimateTags.has(tag.value))
    if (badClimate) {
      addFinding(findings, 'error', seed, `${path}.detail.climate`, `${thermalZone} solid body has hot/temperate climate tag "${badClimate.value}".`)
    }
  }

  if (envelopeCategories.has(category)) {
    if (!body.physical.volatileEnvelope.value) {
      addFinding(findings, 'error', seed, `${path}.physical.volatileEnvelope`, `${category} should be marked as a volatile-envelope world.`)
    }
    if (body.detail.biosphere.value !== 'Sterile') {
      addFinding(findings, 'error', seed, `${path}.detail.biosphere`, `${category} generated non-sterile biosphere "${body.detail.biosphere.value}".`)
    }
    if (!envelopeAllowedGeologies.has(body.detail.geology.value)) {
      addFinding(findings, 'error', seed, `${path}.detail.geology`, `${category} has surface geology "${body.detail.geology.value}".`)
    }
    if (!body.physical.gravityLabel.value.startsWith('Cloud-top/envelope estimate')) {
      addFinding(findings, 'error', seed, `${path}.physical.gravityLabel`, `${category} gravity label should be an envelope estimate.`)
    }
  } else if (category !== 'anomaly' && body.physical.volatileEnvelope.value) {
    addFinding(findings, 'error', seed, `${path}.physical.volatileEnvelope`, `${category} should not be marked as a volatile-envelope world.`)
  }

  if (category === 'belt') {
    if (body.physical.massEarth.value !== null || body.physical.surfaceGravityG.value !== null) {
      addFinding(findings, 'error', seed, `${path}.physical`, 'Belt should not have mass or surface gravity estimates.')
    }
    if (!body.physical.gravityLabel.value.includes('distributed belt')) {
      addFinding(findings, 'error', seed, `${path}.physical.gravityLabel`, 'Belt gravity label should explain distributed belt/swarm.')
    }
    if (body.detail.geology.value !== 'Minor-body rubble and collision families') {
      addFinding(findings, 'error', seed, `${path}.detail.geology`, `Belt has non-belt geology "${body.detail.geology.value}".`)
    }
  }

  if (category === 'anomaly') {
    if (body.physical.massEarth.value !== null || body.physical.surfaceGravityG.value !== null) {
      addFinding(findings, 'error', seed, `${path}.physical`, 'Anomaly should not have ordinary mass or gravity estimates.')
    }
    if (!body.physical.gravityLabel.value.startsWith('Unreliable')) {
      addFinding(findings, 'error', seed, `${path}.physical.gravityLabel`, 'Anomaly gravity label should be marked unreliable.')
    }
  }

  if (!envelopeCategories.has(category) && category !== 'belt' && category !== 'anomaly') {
    if (body.physical.massEarth.value === null || body.physical.surfaceGravityG.value === null) {
      addFinding(findings, 'error', seed, `${path}.physical`, `${category} is missing mass or gravity estimates.`)
    }
    if (!body.physical.gravityLabel.value.startsWith('Estimated surface gravity')) {
      addFinding(findings, 'error', seed, `${path}.physical.gravityLabel`, `${category} gravity label should be a surface estimate.`)
    }
  }

  if (body.rings && category !== 'gas-giant' && category !== 'ice-giant' && category !== 'anomaly') {
    addFinding(findings, 'error', seed, `${path}.rings`, `${category} generated a ring system.`)
  }

  if (hasDuplicates(body.moons.map((moon) => moon.name.value))) {
    addFinding(findings, 'warning', seed, `${path}.moons`, 'Moon names repeat around the same body.')
  }

  body.moons.forEach((moon, moonIndex) => {
    assertText(findings, seed, `${path}.moons[${moonIndex}].moonType`, moon.moonType.value, 'Moon type')
    assertText(findings, seed, `${path}.moons[${moonIndex}].use`, moon.use.value, 'Moon use')
  })
}

function auditSettlement(system: GeneratedSystem, settlement: Settlement, settlementIndex: number, findings: Finding[]): void {
  const seed = system.seed
  const path = `settlements[${settlementIndex}]`
  const body = system.bodies.find((candidate) => candidate.id === settlement.bodyId)
  const siteCategory = settlement.siteCategory.value
  const allowedBuiltForms = allowedBuiltFormsBySiteCategory[siteCategory]

  assertText(findings, seed, `${path}.name`, settlement.name.value, 'Settlement name')
  assertText(findings, seed, `${path}.anchorDetail`, settlement.anchorDetail.value, 'Settlement anchor detail')
  assertText(findings, seed, `${path}.function`, settlement.function.value, 'Settlement function')
  assertText(findings, seed, `${path}.whyHere`, settlement.whyHere.value, 'Settlement reason')
  assertText(findings, seed, `${path}.tagHook`, settlement.tagHook.value, 'Settlement tag hook')

  if (!body) {
    addFinding(findings, 'error', seed, `${path}.bodyId`, `Settlement references missing body "${settlement.bodyId}".`)
    return
  }

  const tags = settlement.tags.map((tag) => tag.value)
  if (tags.length < 2) {
    addFinding(findings, 'error', seed, `${path}.tags`, 'Settlement has fewer than two tags.')
  } else if (hasDuplicates(tags)) {
    addFinding(findings, 'error', seed, `${path}.tags`, `Settlement repeats tag pair "${tags.join(' + ')}".`)
  }

  if (!allowedBuiltForms) {
    addFinding(findings, 'error', seed, `${path}.siteCategory`, `Unknown site category "${siteCategory}".`)
  } else if (!allowedBuiltForms.has(settlement.builtForm.value)) {
    addFinding(findings, 'error', seed, `${path}.builtForm`, `${siteCategory} has incompatible built form "${settlement.builtForm.value}".`)
  }

  if (siteCategory === 'Moon base') {
    if (!settlement.moonId) {
      addFinding(findings, 'error', seed, `${path}.moonId`, 'Moon base lacks a moon id.')
    } else if (!body.moons.some((moon) => moon.id === settlement.moonId)) {
      addFinding(findings, 'error', seed, `${path}.moonId`, `Moon base references missing moon "${settlement.moonId}".`)
    }
  } else if (settlement.moonId) {
    addFinding(findings, 'error', seed, `${path}.moonId`, `${siteCategory} should not carry a moon id.`)
  }

  if (siteCategory === 'Surface settlement' && envelopeCategories.has(body.category.value)) {
    addFinding(findings, 'error', seed, `${path}.siteCategory`, `Surface settlement anchored to ${body.category.value}.`)
  }

  if (siteCategory === 'Surface settlement' && extremeHotZones.has(body.thermalZone.value)) {
    addFinding(findings, 'error', seed, `${path}.siteCategory`, `Surface settlement anchored to ${body.thermalZone.value} body.`)
  }

  if (settlement.methodNotes.length === 0 || settlement.methodNotes.some((note) => !note.value.trim())) {
    addFinding(findings, 'error', seed, `${path}.methodNotes`, 'Settlement method notes are missing or blank.')
  }

  for (const [component, fact] of Object.entries(settlement.presence)) {
    if (!Number.isFinite(fact.value)) {
      addFinding(findings, 'error', seed, `${path}.presence.${component}`, 'Presence component is not finite.')
    }
  }
}

function auditSystem(system: GeneratedSystem, findings: Finding[], stats: CorpusStats): void {
  const seed = system.seed
  stats.systems += 1
  stats.bodies += system.bodies.length
  stats.settlements += system.settlements.length
  stats.moons += system.bodies.reduce((total, body) => total + body.moons.length, 0)
  increment(stats.starTypes, system.primary.spectralType.value)
  increment(stats.starTypesByDistribution[system.options.distribution], system.primary.spectralType.value)
  increment(stats.architectures, system.architecture.name.value)
  system.bodies.forEach((body) => increment(stats.categories, body.category.value))
  system.settlements.forEach((settlement) => increment(stats.settlementCategories, settlement.siteCategory.value))

  assertText(findings, seed, 'name', system.name.value, 'System name')
  assertText(findings, seed, 'primary.spectralType', system.primary.spectralType.value, 'Primary spectral type')

  if (!system.noAlienCheck.passed) {
    addFinding(findings, 'error', seed, 'noAlienCheck', 'No-alien check did not pass.')
  }

  if (system.bodies.length === 0) {
    addFinding(findings, 'error', seed, 'bodies', 'System generated no orbital bodies.')
  }

  if (hasDuplicates(system.bodies.map((body) => body.id))) {
    addFinding(findings, 'error', seed, 'bodies', 'Body ids repeat within a system.')
  }

  if (hasDuplicates(system.bodies.map((body) => body.name.value))) {
    addFinding(findings, 'error', seed, 'bodies', 'Body names repeat within a system.')
  }

  if (hasDuplicates(system.settlements.map((settlement) => settlement.id))) {
    addFinding(findings, 'error', seed, 'settlements', 'Settlement ids repeat within a system.')
  }

  system.bodies.forEach((body, bodyIndex) => auditBody(system, body, bodyIndex, findings))
  system.settlements.forEach((settlement, settlementIndex) => auditSettlement(system, settlement, settlementIndex, findings))

  for (const text of collectStrings(system)) {
    const forbiddenPattern = forbiddenAlienPatterns.find((pattern) => pattern.test(text.value))
    if (forbiddenPattern) {
      addFinding(findings, 'error', seed, text.path, `Forbidden no-alien phrase survived: "${text.value}".`)
    }
  }
}

function auditCoverage(stats: CorpusStats, findings: Finding[]): void {
  const syntheticSeed = 'corpus'
  const expectedStarTypes = ['M dwarf', 'K star', 'G star', 'F star', 'O/B/A bright star', 'White dwarf/remnant', 'Brown dwarf/substellar primary']
  const expectedCategories: BodyCategory[] = [
    'rocky-planet',
    'super-earth',
    'sub-neptune',
    'gas-giant',
    'ice-giant',
    'belt',
    'dwarf-body',
    'rogue-captured',
    'anomaly',
  ]

  for (const starType of expectedStarTypes) {
    if (!stats.starTypes.has(starType)) {
      addFinding(findings, 'warning', syntheticSeed, 'primary.spectralType', `Corpus did not produce star type "${starType}".`)
    }
  }

  for (const category of expectedCategories) {
    if (!stats.categories.has(category)) {
      addFinding(findings, 'warning', syntheticSeed, 'bodies.category', `Corpus did not produce body category "${category}".`)
    }
  }

  if (!stats.settlementCategories.has('Moon base')) {
    addFinding(findings, 'warning', syntheticSeed, 'settlements.siteCategory', 'Corpus did not produce any moon-base settlements.')
  }

  if (!stats.settlementCategories.has('Surface settlement')) {
    addFinding(findings, 'warning', syntheticSeed, 'settlements.siteCategory', 'Corpus did not produce any surface settlements.')
  }

  if (stats.settlements < stats.systems) {
    addFinding(findings, 'warning', syntheticSeed, 'settlements', 'Average settlement count fell below one per system.')
  }

  if (stats.moons < stats.systems) {
    addFinding(findings, 'warning', syntheticSeed, 'bodies.moons', 'Average moon count fell below one per system.')
  }

  auditStarDistribution('realistic', realisticStarTypes, stats, findings)
  auditStarDistribution('frontier', frontierStarTypes, stats, findings)
}

function auditStarDistribution(
  distribution: GeneratorDistribution,
  table: typeof realisticStarTypes,
  stats: CorpusStats,
  findings: Finding[]
): void {
  const observed = stats.starTypesByDistribution[distribution]
  const sampleSize = [...observed.values()].reduce((sum, count) => sum + count, 0)
  const allowedDelta = Math.max(8, Math.ceil(sampleSize * 0.06))

  for (const entry of table) {
    const expected = ((entry.max - entry.min + 1) / 100) * sampleSize
    const actual = observed.get(entry.value.type) ?? 0
    if (Math.abs(actual - expected) > allowedDelta) {
      addFinding(
        findings,
        'error',
        'corpus',
        `primary.spectralType.${distribution}`,
        `${distribution} star type "${entry.value.type}" produced ${actual}; expected about ${expected.toFixed(1)} from d100 range ${entry.min}-${entry.max}.`
      )
    }
  }
}

function formatMap<Key>(map: Map<Key, number>): string {
  return [...map.entries()]
    .sort(([, left], [, right]) => right - left)
    .map(([key, count]) => `${String(key)}: ${count}`)
    .join(', ')
}

const findings: Finding[] = []
const stats: CorpusStats = {
  systems: 0,
  bodies: 0,
  settlements: 0,
  moons: 0,
  starTypes: new Map(),
  starTypesByDistribution: {
    frontier: new Map(),
    realistic: new Map(),
  },
  architectures: new Map(),
  categories: new Map(),
  settlementCategories: new Map(),
}

for (const distribution of distributions) {
  for (let index = 0; index < corpusPerDistribution; index += 1) {
    const seed = makeSeed(distribution, index)
    auditSystem(generateSystem(makeOptions(distribution, seed)), findings, stats)
  }
}

auditCoverage(stats, findings)

const errors = findings.filter((finding) => finding.severity === 'error')
const warnings = findings.filter((finding) => finding.severity === 'warning')

console.log('Star System Generator Audit')
console.log(`Systems: ${stats.systems}`)
console.log(`Bodies: ${stats.bodies}`)
console.log(`Moons: ${stats.moons}`)
console.log(`Settlements: ${stats.settlements}`)
console.log(`Errors: ${errors.length}`)
console.log(`Warnings: ${warnings.length}`)
console.log(`Star types: ${formatMap(stats.starTypes)}`)
console.log(`Frontier star types: ${formatMap(stats.starTypesByDistribution.frontier)}`)
console.log(`Realistic star types: ${formatMap(stats.starTypesByDistribution.realistic)}`)
console.log(`Body categories: ${formatMap(stats.categories)}`)
console.log(`Settlement categories: ${formatMap(stats.settlementCategories)}`)
console.log(`Architectures: ${formatMap(stats.architectures)}`)

if (findings.length > 0) {
  console.log('')
  console.log(`First ${Math.min(findingLimit, findings.length)} finding${findings.length === 1 ? '' : 's'}:`)
  for (const finding of findings.slice(0, findingLimit)) {
    console.log(`[${finding.severity}] ${finding.seed} ${finding.path}: ${finding.message}`)
  }
}

if (errors.length > 0) {
  process.exitCode = 1
}
