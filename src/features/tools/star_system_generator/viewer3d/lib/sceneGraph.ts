import type { GeneratedSystem, OrbitingBody, Moon, StellarCompanion } from '../../types'
import type {
  BeltVisual,
  BodyVisual,
  MoonVisual,
  OrbitScaleMode,
  PhenomenonMarker,
  RingVisual,
  RuinMarker,
  StarVisual,
  SystemSceneGraph,
  BodyShadingKey,
  RenderArchetype,
} from '../types'
import { auToScene, bodyVisualSize, DEFAULT_ORBIT_SCALE_MODE, schematicOrbitRadius } from './scale'
import { angularSpeedFromPeriod, hashToUnit, phase0ForBody } from './motion'
import { spectralVisuals } from './stellarColor'
import { chooseShading } from './bodyShading'
import { classifyHazard } from './hazardClassifier'
import { classifyGuBleed } from './guBleedClassifier'
import {
  buildBeltProfile,
  buildBodySurfaceProfile,
  buildMoonSurfaceProfile,
  buildRingProfile,
  companionStarVisuals,
  phenomenonVisualProfile,
  primaryStarVisualExtras,
} from './visualProfiles'

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

export interface BuildSceneGraphOptions {
  scaleMode?: OrbitScaleMode
}

function companionOffset(separation: string, hzCenterAu: number, scaleMode: OrbitScaleMode): number {
  const lower = separation.toLowerCase()
  for (const key of COMPANION_KEYS) {
    if (lower.includes(key)) return auToScene(COMPANION_AU[key], hzCenterAu, scaleMode)
  }
  return auToScene(COMPANION_AU.moderate, hzCenterAu, scaleMode)
}

function buildStar(system: GeneratedSystem): StarVisual {
  const visuals = spectralVisuals(system.primary.spectralType.value, system.primary.activityRoll.value)
  const extras = primaryStarVisualExtras(system)
  return {
    id: system.primary.id,
    coreColor: visuals.coreColor,
    coronaColor: visuals.coronaColor,
    coronaRadius: visuals.coronaRadius,
    rayCount: visuals.rayCount,
    bloomStrength: visuals.bloomStrength,
    flareStrength: extras.flareStrength,
    pulseSpeed: extras.pulseSpeed,
    rayColor: extras.rayColor,
    position: [0, 0, 0],
  }
}

function buildCompanion(companion: StellarCompanion, _primary: StarVisual, hzCenterAu: number, scaleMode: OrbitScaleMode): StarVisual {
  const visuals = companionStarVisuals(companion)
  const offset = companionOffset(companion.separation.value, hzCenterAu, scaleMode)
  const angle = hashToUnit(`companion#${companion.id}`) * Math.PI * 2
  return {
    id: companion.id,
    coreColor: visuals.coreColor,
    coronaColor: visuals.coronaColor,
    coronaRadius: visuals.coronaRadius,
    rayCount: visuals.rayCount,
    bloomStrength: visuals.bloomStrength,
    flareStrength: visuals.flareStrength,
    pulseSpeed: visuals.pulseSpeed,
    rayColor: visuals.rayColor,
    position: [Math.cos(angle) * offset, 0, Math.sin(angle) * offset],
  }
}

function ringFor(body: OrbitingBody, parentSize: number): RingVisual | undefined {
  return buildRingProfile(body, parentSize)
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
      surface: buildMoonSurfaceProfile(moon, _seed),
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

function orbitRadiusForBody(body: OrbitingBody, hzCenterAu: number, scaleMode: OrbitScaleMode, orbitIndex: number): number {
  return scaleMode === 'schematic'
    ? schematicOrbitRadius(orbitIndex)
    : auToScene(body.orbitAu.value, hzCenterAu, scaleMode)
}

function buildBody(body: OrbitingBody, system: GeneratedSystem, hzCenterAu: number, scaleMode: OrbitScaleMode, orbitIndex: number): BodyVisual {
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
    orbitRadius: orbitRadiusForBody(body, hzCenterAu, scaleMode, orbitIndex),
    orbitTiltY: (hashToUnit(`tilt#${body.id}`) - 0.5) * 0.4,
    phase0: phase0ForBody(body.id, system.seed, orbitIndex),
    angularSpeed: angularSpeedFromPeriod(body.physical.periodDays.value),
    visualSize: size,
    shading,
    renderArchetype: archetypeForShading(shading),
    category: body.category.value,
    surface: buildBodySurfaceProfile(body, system.seed, settlementIds.length),
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

function buildBelt(body: OrbitingBody, hzCenterAu: number, scaleMode: OrbitScaleMode, orbitIndex: number): BeltVisual {
  const r = orbitRadiusForBody(body, hzCenterAu, scaleMode, orbitIndex)
  return buildBeltProfile(body, {
    id: body.id,
    innerRadius: r * 0.92,
    outerRadius: r * 1.08,
    particleCount: 750,
    jitter: r * 0.04,
    color: '#9a9186',
    renderArchetype: 'belt',
  })
}

function buildPhenomenon(phen: GeneratedSystem['phenomena'][number], system: GeneratedSystem, hzCenterAu: number, scaleMode: OrbitScaleMode): PhenomenonMarker {
  const angle = hashToUnit(`phen#${phen.id}`) * Math.PI * 2
  const rAu = (system.zones.habitableCenterAu.value + system.zones.snowLineAu.value) / 2
  const r = auToScene(rAu, hzCenterAu, scaleMode)
  return {
    id: phen.id,
    position: [Math.cos(angle) * r * 1.3, 0, Math.sin(angle) * r * 1.3],
    kind: phen.phenomenon.value,
    ...phenomenonVisualProfile(phen.phenomenon.value, phen.id),
    renderArchetype: 'phenomenon-marker',
  }
}

function buildRuin(
  ruin: GeneratedSystem['ruins'][number],
  system: GeneratedSystem,
  bodies: BodyVisual[],
  belts: BeltVisual[],
  hzCenterAu: number,
  scaleMode: OrbitScaleMode,
): RuinMarker {
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
  if (sourceBody?.category.value === 'belt') {
    const belt = belts.find((b) => b.id === sourceBody.id)
    if (belt) {
      const angle = hashToUnit(`ruin-belt-angle#${sourceBody.id}#${ruin.id}`) * Math.PI * 2
      const radiusT = 0.35 + hashToUnit(`ruin-belt-radius#${sourceBody.id}#${ruin.id}`) * 0.3
      const radius = belt.innerRadius + (belt.outerRadius - belt.innerRadius) * radiusT
      const y = (hashToUnit(`ruin-belt-y#${sourceBody.id}#${ruin.id}`) - 0.5) * belt.jitter * 1.8
      return {
        id: ruin.id,
        attachedBeltId: belt.id,
        position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
        renderArchetype: 'ruin-marker',
      }
    }
  }
  if (sourceBody) {
    const bodyIndex = system.bodies.findIndex((body) => body.id === sourceBody.id)
    const r = orbitRadiusForBody(sourceBody, hzCenterAu, scaleMode, Math.max(0, bodyIndex))
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
  const baseR = (outer ? outer.orbitRadius : auToScene(system.zones.snowLineAu.value, hzCenterAu, scaleMode)) * 1.2
  const angle = hashToUnit(`ruin#${ruin.id}`) * Math.PI * 2
  return {
    id: ruin.id,
    position: [Math.cos(angle) * baseR, 0, Math.sin(angle) * baseR],
    renderArchetype: 'ruin-marker',
  }
}

export function buildSceneGraph(system: GeneratedSystem, options: BuildSceneGraphOptions = {}): SystemSceneGraph {
  const scaleMode = options.scaleMode ?? DEFAULT_ORBIT_SCALE_MODE
  const hzCenterAu = system.zones.habitableCenterAu.value > 0 ? system.zones.habitableCenterAu.value : 1
  const star = buildStar(system)
  const companions = system.companions.map((c) => buildCompanion(c, star, hzCenterAu, scaleMode))

  const sortedOrbitingBodies = [...system.bodies].sort((left, right) => left.orbitAu.value - right.orbitAu.value)
  const orbitIndexById = new Map(sortedOrbitingBodies.map((body, index) => [body.id, index]))
  const nonBelt = sortedOrbitingBodies.filter((b) => b.category.value !== 'belt')
  const beltBodies = sortedOrbitingBodies.filter((b) => b.category.value === 'belt')

  const bodies = applyBodyOrbitClearance(nonBelt.map((b) => buildBody(b, system, hzCenterAu, scaleMode, orbitIndexById.get(b.id) ?? 0)))
  const belts = beltBodies.map((b) => buildBelt(b, hzCenterAu, scaleMode, orbitIndexById.get(b.id) ?? 0))

  const hazards = system.majorHazards.map((h) => classifyHazard(h, system, hzCenterAu))
  const guBleeds = [classifyGuBleed(system.guOverlay, system, hzCenterAu)]
  const phenomena = system.phenomena.map((p) => buildPhenomenon(p, system, hzCenterAu, scaleMode))
  const ruins = system.ruins.map((r) => buildRuin(r, system, bodies, belts, hzCenterAu, scaleMode))

  const maxBodyOrbit = Math.max(...bodies.map((b) => b.orbitRadius), 0)
  const maxBeltOrbit = Math.max(...belts.map((b) => b.outerRadius), 0)
  const sceneRadius = Math.max(maxBodyOrbit, maxBeltOrbit, auToScene(system.zones.snowLineAu.value, hzCenterAu, scaleMode)) * 1.15

  const zones = {
    habitableInner: auToScene(system.zones.habitableInnerAu.value, hzCenterAu, scaleMode),
    habitable: auToScene(system.zones.habitableCenterAu.value, hzCenterAu, scaleMode),
    habitableOuter: auToScene(system.zones.habitableOuterAu.value, hzCenterAu, scaleMode),
    snowLine: auToScene(system.zones.snowLineAu.value, hzCenterAu, scaleMode),
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
