import type { GeneratedSystem, OrbitingBody, Moon, StellarCompanion } from '../../types'
import type {
  BeltVisual,
  BodyVisual,
  MoonVisual,
  PhenomenonMarker,
  RingVisual,
  RuinMarker,
  StarVisual,
  SystemSceneGraph,
  BodyShadingKey,
  RenderArchetype,
} from '../types'
import { auToScene, bodyVisualSize } from './scale'
import { angularSpeedFromPeriod, hashToUnit, phase0ForBody } from './motion'
import { spectralVisuals } from './stellarColor'
import { chooseShading } from './bodyShading'
import { classifyHazard } from './hazardClassifier'
import { classifyGuBleed } from './guBleedClassifier'

const BODY_ORBIT_CLEARANCE = 2.5
const MIN_MOON_PERIOD_SEC = 24
const COMPANION_KEYS = ['close', 'near', 'moderate', 'wide', 'distant'] as const
const COMPANION_AU: Record<typeof COMPANION_KEYS[number], number> = {
  close: 0.5,
  near: 2,
  moderate: 8,
  wide: 40,
  distant: 80,
}

function companionOffset(separation: string, hzCenterAu: number): number {
  const lower = separation.toLowerCase()
  for (const key of COMPANION_KEYS) {
    if (lower.includes(key)) return auToScene(COMPANION_AU[key], hzCenterAu)
  }
  return auToScene(COMPANION_AU.moderate, hzCenterAu)
}

function buildStar(system: GeneratedSystem): StarVisual {
  const visuals = spectralVisuals(system.primary.spectralType.value, system.primary.activityRoll.value)
  return {
    id: system.primary.id,
    coreColor: visuals.coreColor,
    coronaColor: visuals.coronaColor,
    coronaRadius: visuals.coronaRadius,
    rayCount: visuals.rayCount,
    bloomStrength: visuals.bloomStrength,
    position: [0, 0, 0],
  }
}

function buildCompanion(companion: StellarCompanion, _primary: StarVisual, hzCenterAu: number): StarVisual {
  const visuals = spectralVisuals('G2V', 50)
  const offset = companionOffset(companion.separation.value, hzCenterAu)
  const angle = hashToUnit(`companion#${companion.id}`) * Math.PI * 2
  return {
    id: companion.id,
    coreColor: visuals.coreColor,
    coronaColor: visuals.coronaColor,
    coronaRadius: visuals.coronaRadius * 0.7,
    rayCount: visuals.rayCount,
    bloomStrength: visuals.bloomStrength * 0.7,
    position: [Math.cos(angle) * offset, 0, Math.sin(angle) * offset],
  }
}

function ringFor(body: OrbitingBody, parentSize: number): RingVisual | undefined {
  if (!body.rings) return undefined
  const tilt = (hashToUnit(`ring#${body.id}`) - 0.5) * 0.6
  return {
    innerRadius: parentSize * 1.4,
    outerRadius: parentSize * 2.1,
    tilt,
    bandCount: 3,
    color: '#d6a96b',
  }
}

function moonScaleFactor(scale: string): number {
  const lower = scale.toLowerCase()
  if (lower.includes('planet-scale')) return 0.32
  if (lower.includes('large differentiated')) return 0.24
  if (lower.includes('mid-sized')) return 0.17
  if (lower.includes('small major')) return 0.12
  return 0.075
}

function moonOrbitShell(scale: string): number {
  const lower = scale.toLowerCase()
  if (lower.includes('planet-scale')) return 5.5
  if (lower.includes('large differentiated')) return 4.5
  if (lower.includes('mid-sized')) return 3.7
  if (lower.includes('small major')) return 3.0
  return 2.35
}

function fallbackParentMass(body: OrbitingBody): number {
  switch (body.category.value) {
    case 'gas-giant': return 95
    case 'ice-giant': return 17
    case 'sub-neptune': return 8
    case 'super-earth': return 5
    case 'dwarf-body': return 0.05
    case 'rogue-captured': return 2
    default: return 1
  }
}

function moonPeriodSeconds(body: OrbitingBody, parentSize: number, orbit: number, index: number, seed: string): number {
  const massEarth = typeof body.physical.massEarth.value === 'number' && body.physical.massEarth.value > 0
    ? body.physical.massEarth.value
    : fallbackParentMass(body)
  const massFactor = Math.max(0.45, Math.min(4, Math.cbrt(massEarth)))
  const orbitRatio = Math.max(1, orbit / Math.max(parentSize, 0.1))
  const jitter = 0.92 + hashToUnit(`moon-period#${body.id}#${index}#${seed}`) * 0.16
  const period = ((22 + orbitRatio ** 1.5 * 8) / massFactor + index * 2.5) * jitter
  return Math.max(MIN_MOON_PERIOD_SEC, period)
}

function moonsFor(body: OrbitingBody, _seed: string, parentSize: number): MoonVisual[] {
  const count = body.moons.length
  const orbitStep = parentSize * (count > 6 ? 0.5 : 0.72)
  const crowdScale = count > 6 ? Math.max(0.55, Math.sqrt(6 / count)) : 1
  return body.moons.map((moon: Moon, idx: number) => {
    const scaleFactor = moonScaleFactor(moon.scale.value) * crowdScale
    const orbit = parentSize * moonOrbitShell(moon.scale.value) + idx * orbitStep
    const periodSec = moonPeriodSeconds(body, parentSize, orbit, idx, _seed)
    const tilt = (hashToUnit(`moon-tilt#${moon.id}`) - 0.5) * 0.6
    return {
      id: moon.id,
      parentBodyId: body.id,
      parentRelativeOrbit: orbit,
      phase0: phase0ForBody(moon.id, _seed, idx),
      angularSpeed: (Math.PI * 2) / periodSec,
      orbitTilt: tilt,
      visualSize: parentSize * scaleFactor,
      shading: 'dwarf',
    }
  })
}

function normalizedEntityText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function locationMatchesEntity(location: string, entityValue: string): boolean {
  const locationText = normalizedEntityText(location)
  const entityText = normalizedEntityText(entityValue)
  if (!entityText) return false
  return (
    locationText === entityText ||
    locationText.startsWith(`${entityText} `) ||
    locationText.endsWith(` ${entityText}`) ||
    locationText.includes(` ${entityText} `)
  )
}

function ruinMatchesBody(ruin: GeneratedSystem['ruins'][number], body: OrbitingBody): boolean {
  const location = ruin.location.value
  return locationMatchesEntity(location, body.id) || locationMatchesEntity(location, body.name.value)
}

function bodyHasGuFracture(body: OrbitingBody): boolean {
  if (body.category.value === 'anomaly') return true
  const traitText = body.traits.map((t) => t.value).join(' ').toLowerCase()
  if (traitText.includes('gu-fracture') || traitText.includes('gu fracture') || traitText.includes('fractured')) return true
  const filterText = body.filterNotes.map((t) => t.value).join(' ').toLowerCase()
  return filterText.includes('gu') && filterText.includes('fracture')
}

function archetypeForShading(shading: BodyShadingKey): RenderArchetype {
  switch (shading) {
    case 'rocky-warm':
    case 'rocky-cool':
      return 'rocky'
    case 'earthlike':
      return 'earthlike'
    case 'desert':
      return 'desert'
    case 'sub-neptune':
      return 'sub-neptune'
    case 'gas-giant':
      return 'gas-giant'
    case 'ice-giant':
      return 'ice-giant'
    case 'dwarf':
      return 'dwarf'
    case 'anomaly':
      return 'anomaly'
  }
}

function buildBody(body: OrbitingBody, system: GeneratedSystem, hzCenterAu: number, orbitIndex: number): BodyVisual {
  const size = bodyVisualSize(body.category.value, body.physical.radiusEarth.value)
  const shading = chooseShading(body)
  const settlementIds = system.settlements
    .filter((s) => s.bodyId === body.id || body.moons.some((m) => m.id === s.moonId))
    .map((s) => s.id)
  const ruinIds = system.ruins
    .filter((r) => ruinMatchesBody(r, body))
    .map((r) => r.id)
  return {
    id: body.id,
    orbitRadius: auToScene(body.orbitAu.value, hzCenterAu),
    orbitTiltY: (hashToUnit(`tilt#${body.id}`) - 0.5) * 0.4,
    phase0: phase0ForBody(body.id, system.seed, orbitIndex),
    angularSpeed: angularSpeedFromPeriod(body.physical.periodDays.value),
    visualSize: size,
    shading,
    renderArchetype: archetypeForShading(shading),
    category: body.category.value,
    rings: ringFor(body, size),
    moons: moonsFor(body, system.seed, size),
    guAccent: bodyHasGuFracture(body),
    hasSettlements: settlementIds.length > 0,
    settlementIds,
    ruinIds,
  }
}

function bodyVisualExtent(body: BodyVisual): number {
  return body.rings ? Math.max(body.visualSize, body.rings.outerRadius) : body.visualSize
}

function applyBodyOrbitClearance(bodies: BodyVisual[]): BodyVisual[] {
  return bodies.reduce<BodyVisual[]>((out, body) => {
    const previous = out.at(-1)
    if (!previous) return [body]

    const minimumGap = bodyVisualExtent(previous) + bodyVisualExtent(body) + BODY_ORBIT_CLEARANCE
    const orbitRadius = Math.max(body.orbitRadius, previous.orbitRadius + minimumGap)
    out.push(orbitRadius === body.orbitRadius ? body : { ...body, orbitRadius })
    return out
  }, [])
}

function buildBelt(body: OrbitingBody, hzCenterAu: number): BeltVisual {
  const r = auToScene(body.orbitAu.value, hzCenterAu)
  return {
    id: body.id,
    innerRadius: r * 0.92,
    outerRadius: r * 1.08,
    particleCount: 1500,
    jitter: r * 0.04,
    color: '#1d1d1b',
    renderArchetype: 'belt',
  }
}

function buildPhenomenon(phen: GeneratedSystem['phenomena'][number], system: GeneratedSystem, hzCenterAu: number): PhenomenonMarker {
  const angle = hashToUnit(`phen#${phen.id}`) * Math.PI * 2
  const rAu = (system.zones.habitableCenterAu.value + system.zones.snowLineAu.value) / 2
  const r = auToScene(rAu, hzCenterAu)
  return {
    id: phen.id,
    position: [Math.cos(angle) * r * 1.3, 0, Math.sin(angle) * r * 1.3],
    kind: phen.phenomenon.value,
    renderArchetype: 'phenomenon-marker',
  }
}

function buildRuin(ruin: GeneratedSystem['ruins'][number], system: GeneratedSystem, bodies: BodyVisual[], hzCenterAu: number): RuinMarker {
  const sourceBody = system.bodies.find((body) => ruinMatchesBody(ruin, body))
  const matched = sourceBody ? bodies.find((b) => b.id === sourceBody.id) : undefined
  if (matched) {
    return {
      id: ruin.id,
      attachedBodyId: matched.id,
      position: [0, 0, 0],
      renderArchetype: 'ruin-marker',
    }
  }
  if (sourceBody) {
    const r = auToScene(sourceBody.orbitAu.value, hzCenterAu)
    const angle = hashToUnit(`ruin-body#${sourceBody.id}#${ruin.id}`) * Math.PI * 2
    return {
      id: ruin.id,
      position: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
      renderArchetype: 'ruin-marker',
    }
  }
  const outer = bodies.reduce<BodyVisual | undefined>(
    (acc, b) => (acc && acc.orbitRadius > b.orbitRadius ? acc : b),
    undefined,
  )
  const baseR = (outer ? outer.orbitRadius : auToScene(system.zones.snowLineAu.value, hzCenterAu)) * 1.2
  const angle = hashToUnit(`ruin#${ruin.id}`) * Math.PI * 2
  return {
    id: ruin.id,
    position: [Math.cos(angle) * baseR, 0, Math.sin(angle) * baseR],
    renderArchetype: 'ruin-marker',
  }
}

export function buildSceneGraph(system: GeneratedSystem): SystemSceneGraph {
  const hzCenterAu = system.zones.habitableCenterAu.value > 0 ? system.zones.habitableCenterAu.value : 1
  const star = buildStar(system)
  const companions = system.companions.map((c) => buildCompanion(c, star, hzCenterAu))

  const nonBelt = system.bodies.filter((b) => b.category.value !== 'belt')
  const beltBodies = system.bodies.filter((b) => b.category.value === 'belt')

  const bodies = applyBodyOrbitClearance(nonBelt.map((b, index) => buildBody(b, system, hzCenterAu, index)))
  const belts = beltBodies.map((b) => buildBelt(b, hzCenterAu))

  const hazards = system.majorHazards.map((h) => classifyHazard(h, system, hzCenterAu))
  const guBleeds = [classifyGuBleed(system.guOverlay, system, hzCenterAu)]
  const phenomena = system.phenomena.map((p) => buildPhenomenon(p, system, hzCenterAu))
  const ruins = system.ruins.map((r) => buildRuin(r, system, bodies, hzCenterAu))

  const maxBodyOrbit = Math.max(...bodies.map((b) => b.orbitRadius), 0)
  const maxBeltOrbit = Math.max(...belts.map((b) => b.outerRadius), 0)
  const sceneRadius = Math.max(maxBodyOrbit, maxBeltOrbit, auToScene(system.zones.snowLineAu.value, hzCenterAu)) * 1.15

  const zones = {
    habitableInner: auToScene(system.zones.habitableInnerAu.value, hzCenterAu),
    habitable: auToScene(system.zones.habitableCenterAu.value, hzCenterAu),
    habitableOuter: auToScene(system.zones.habitableOuterAu.value, hzCenterAu),
    snowLine: auToScene(system.zones.snowLineAu.value, hzCenterAu),
  }

  return {
    star,
    companions,
    zones,
    bodies,
    belts,
    hazards,
    guBleeds,
    phenomena,
    ruins,
    sceneRadius,
  }
}
