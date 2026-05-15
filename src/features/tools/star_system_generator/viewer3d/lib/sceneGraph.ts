import type { GeneratedSystem, OrbitingBody, Moon, StellarCompanion } from '../../types'
import type {
  BeltVisual,
  BodyVisual,
  DistantStarMarker,
  HazardVisual,
  MoonVisual,
  OrbitScaleMode,
  PhenomenonMarker,
  RingVisual,
  RuinMarker,
  StarVisual,
  SubSystemVisual,
  SystemLevelPhenomenon,
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
import { classifyRuin } from './ruinClassifier'
import {
  buildBeltProfile,
  buildBodySurfaceProfile,
  buildMoonSurfaceProfile,
  buildRingProfile,
  companionStarVisuals,
  phenomenonVisualProfile,
  primaryStarVisualExtras,
} from './visualProfiles'
import { separationToBucketAu } from '../../lib/generator/companionGeometry'

const BODY_ORBIT_CLEARANCE = 3.5
const MIN_MOON_PERIOD_SEC = 24
const SUB_SYSTEM_EXTENT_FRACTION = 0.85

export interface BuildSceneGraphOptions {
  scaleMode?: OrbitScaleMode
}

function companionOffset(separation: string, hzCenterAu: number, scaleMode: OrbitScaleMode): number {
  return auToScene(separationToBucketAu(separation), hzCenterAu, scaleMode)
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
    pulseAmplitude: extras.pulseAmplitude,
    rotationSpeed: extras.rotationSpeed,
    rayColor: extras.rayColor,
    position: [0, 0, 0],
  }
}

function buildCompanion(companion: StellarCompanion, _primary: StarVisual, hzCenterAu: number, scaleMode: OrbitScaleMode): StarVisual {
  const visuals = companionStarVisuals(companion)
  const baseOffset = companionOffset(companion.separation.value, hzCenterAu, scaleMode)
  const offset = companion.mode === 'volatile' ? baseOffset * 0.1 : baseOffset
  const angle = hashToUnit(`companion#${companion.id}`) * Math.PI * 2
  return {
    id: companion.id,
    coreColor: visuals.coreColor,
    coronaColor: visuals.coronaColor,
    coronaRadius: visuals.coronaRadius * (companion.mode === 'volatile' ? 1.4 : 1),
    rayCount: visuals.rayCount,
    bloomStrength: visuals.bloomStrength * (companion.mode === 'volatile' ? 1.5 : 1),
    flareStrength: visuals.flareStrength,
    pulseSpeed: visuals.pulseSpeed,
    pulseAmplitude: visuals.pulseAmplitude,
    rotationSpeed: visuals.rotationSpeed,
    rayColor: visuals.rayColor,
    position: [Math.cos(angle) * offset, 0, Math.sin(angle) * offset],
  }
}

function buildDistantMarker(companion: StellarCompanion, outermostBodyAu: number, hzCenterAu: number, scaleMode: OrbitScaleMode): DistantStarMarker {
  const visuals = companionStarVisuals(companion)
  const sceneRadius = auToScene(Math.max(outermostBodyAu * 1.6, hzCenterAu * 4), hzCenterAu, scaleMode)
  const angle = hashToUnit(`distant#${companion.id}`) * Math.PI * 2
  return {
    id: companion.id,
    visual: {
      id: companion.id,
      coreColor: visuals.coreColor,
      coronaColor: visuals.coronaColor,
      coronaRadius: visuals.coronaRadius * 0.4,
      rayCount: Math.max(2, Math.floor(visuals.rayCount / 2)),
      bloomStrength: visuals.bloomStrength * 0.5,
      flareStrength: visuals.flareStrength * 0.4,
      pulseSpeed: visuals.pulseSpeed,
      pulseAmplitude: visuals.pulseAmplitude,
      rotationSpeed: visuals.rotationSpeed,
      rayColor: visuals.rayColor,
      position: [Math.cos(angle) * sceneRadius, 0, Math.sin(angle) * sceneRadius],
    },
    label: `${companion.star.name.value} →`,
    linkedSeed: companion.linkedSeed?.value ?? '',
  }
}

function ringFor(body: OrbitingBody, parentSize: number): RingVisual | undefined {
  return buildRingProfile(body, parentSize)
}

function moonScaleFactor(scale: string): number {
  const lower = scale.toLowerCase()
  if (lower.includes('planet-scale')) return 0.27
  if (lower.includes('large differentiated')) return 0.20
  if (lower.includes('mid-sized')) return 0.14
  if (lower.includes('small major')) return 0.10
  return 0.065
}

function moonOrbitShell(scale: string): number {
  const lower = scale.toLowerCase()
  if (lower.includes('planet-scale')) return 4.4
  if (lower.includes('large differentiated')) return 3.6
  if (lower.includes('mid-sized')) return 3.0
  if (lower.includes('small major')) return 2.5
  return 2.0
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

function moonsFor(body: OrbitingBody, _seed: string, parentSize: number, maxReach: number): MoonVisual[] {
  const count = body.moons.length
  const orbitStep = parentSize * (count > 6 ? 0.4 : 0.6)
  const crowdScale = count > 6 ? Math.max(0.55, Math.sqrt(6 / count)) : 1
  const rawOrbits = body.moons.map((_moon: Moon, idx: number) =>
    parentSize * moonOrbitShell(_moon.scale.value) + idx * orbitStep,
  )
  const naturalReach = Math.max(...rawOrbits)
  const scale = naturalReach > maxReach && naturalReach > 0 ? maxReach / naturalReach : 1
  return body.moons.map((moon: Moon, idx: number) => {
    const scaleFactor = moonScaleFactor(moon.scale.value) * crowdScale
    const orbit = rawOrbits[idx] * scale
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

function buildBody(body: OrbitingBody, system: GeneratedSystem, hzCenterAu: number, scaleMode: OrbitScaleMode, orbitIndex: number, moonMaxReach: number): BodyVisual {
  const size = bodyVisualSize(body.category.value, body.physical.radiusEarth.value)
  const shading = chooseShading(body)
  const settlementIds = system.settlements
    .filter((s) => s.bodyId === body.id && !s.moonId)
    .map((s) => s.id)
  const ruinIds = system.ruins
    .filter((r) => ruinMatchesBody(r, body))
    .map((r) => r.id)
  const gateIds = system.gates
    .filter((g) => g.bodyId === body.id && !g.moonId)
    .map((g) => g.id)
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
    moons: moonsFor(body, system.seed, size, moonMaxReach),
    guAccent: bodyHasGuFracture(body),
    hasSettlements: settlementIds.length > 0,
    settlementIds,
    ruinIds,
    gateIds,
  }
}

function bodyVisualExtent(body: BodyVisual): number {
  const ringExtent = body.rings?.outerRadius ?? 0
  const moonExtent = body.moons.length > 0
    ? Math.max(...body.moons.map((m) => m.parentRelativeOrbit + m.visualSize))
    : 0
  return Math.max(body.visualSize, ringExtent, moonExtent)
}

const CLEARANCE_CAP_SAFETY_MARGIN = 1.5

function applyBodyOrbitClearance(bodies: BodyVisual[], maxRadius: number = Number.POSITIVE_INFINITY): BodyVisual[] {
  const cap = Number.isFinite(maxRadius) ? maxRadius - CLEARANCE_CAP_SAFETY_MARGIN : Number.POSITIVE_INFINITY
  return bodies.reduce<BodyVisual[]>((out, body) => {
    const previous = out.at(-1)
    const minimumGap = previous ? bodyVisualExtent(previous) + bodyVisualExtent(body) + BODY_ORBIT_CLEARANCE : 0
    const orbitRadius = previous ? Math.max(body.orbitRadius, previous.orbitRadius + minimumGap) : body.orbitRadius
    if (orbitRadius >= cap) {
      console.warn(`[sceneGraph] body ${body.id} dropped: inflated orbitRadius ${orbitRadius.toFixed(2)} >= cap ${cap.toFixed(2)} (maxRadius ${maxRadius.toFixed(2)})`)
      return out
    }
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

function buildRuin(
  ruin: GeneratedSystem['ruins'][number],
  system: GeneratedSystem,
  bodies: BodyVisual[],
  belts: BeltVisual[],
  hzCenterAu: number,
  scaleMode: OrbitScaleMode,
): RuinMarker | null {
  const sourceBody = system.bodies.find((body) => ruinMatchesBody(ruin, body))
    ?? classifyRuin(ruin, system)?.body
    ?? null
  if (!sourceBody) return null

  const matched = bodies.find((b) => b.id === sourceBody.id)
  if (matched) {
    return {
      id: ruin.id,
      attachedBodyId: matched.id,
      position: [0, 0, 0],
      renderArchetype: 'ruin-marker',
    }
  }
  if (sourceBody.category.value === 'belt') {
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
  const bodyIndex = system.bodies.findIndex((body) => body.id === sourceBody.id)
  const r = orbitRadiusForBody(sourceBody, hzCenterAu, scaleMode, Math.max(0, bodyIndex))
  const angle = hashToUnit(`ruin-body#${sourceBody.id}#${ruin.id}`) * Math.PI * 2
  return {
    id: ruin.id,
    position: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
    renderArchetype: 'ruin-marker',
  }
}

function isSystemLevelHazard(hazard: HazardVisual): boolean {
  return hazard.unclassified || hazard.anchorDescription === 'system-wide' || hazard.anchorDescription === 'stellar'
}

function buildSystemLevelPhenomenon(phen: GeneratedSystem['phenomena'][number]): SystemLevelPhenomenon {
  const profile = phenomenonVisualProfile(phen.phenomenon.value, phen.id)
  return {
    id: phen.id,
    kind: phen.phenomenon.value,
    color: profile.color,
    glowColor: profile.glowColor,
  }
}

export function buildSceneGraph(system: GeneratedSystem, options: BuildSceneGraphOptions = {}): SystemSceneGraph {
  const scaleMode = options.scaleMode ?? DEFAULT_ORBIT_SCALE_MODE
  const hzCenterAu = system.zones.habitableCenterAu.value > 0 ? system.zones.habitableCenterAu.value : 1
  const star = buildStar(system)
  const inSceneCompanions = system.companions.filter((c) => c.mode !== 'linked-independent' && c.mode !== 'orbital-sibling')
  const linkedCompanions = system.companions.filter((c) => c.mode === 'linked-independent')
  const companions = inSceneCompanions.map((c) => buildCompanion(c, star, hzCenterAu, scaleMode))

  const circumbinaryCompanion = system.companions.find((c) => c.mode === 'circumbinary')
  const circumbinaryKeepOut = circumbinaryCompanion
    ? auToScene(2 * separationToBucketAu(circumbinaryCompanion.separation.value), hzCenterAu, scaleMode)
    : undefined

  const outermostBodyAu = system.bodies.reduce((max, b) => Math.max(max, b.orbitAu.value), 0)
  const distantMarkers = linkedCompanions.map((c) => buildDistantMarker(c, outermostBodyAu, hzCenterAu, scaleMode))

  const sortedOrbitingBodies = [...system.bodies].sort((left, right) => left.orbitAu.value - right.orbitAu.value)
  const orbitIndexById = new Map(sortedOrbitingBodies.map((body, index) => [body.id, index]))
  const nonBelt = sortedOrbitingBodies.filter((b) => b.category.value !== 'belt')
  const beltBodies = sortedOrbitingBodies.filter((b) => b.category.value === 'belt')

  const nearestCompanionOffset = (() => {
    const offsets: number[] = []
    for (let i = 0; i < inSceneCompanions.length; i++) {
      if (inSceneCompanions[i].mode === 'circumbinary') continue
      offsets.push(Math.hypot(...companions[i].position))
    }
    for (const c of system.companions) {
      if (c.mode !== 'orbital-sibling' || !c.subSystem) continue
      offsets.push(Math.hypot(...buildCompanion(c, star, hzCenterAu, scaleMode).position))
    }
    return offsets.length === 0 ? Infinity : Math.min(...offsets)
  })()
  const nonBeltSceneOrbits = nonBelt.map((b) => orbitRadiusForBody(b, hzCenterAu, scaleMode, orbitIndexById.get(b.id) ?? 0))
  const bodies = applyBodyOrbitClearance(nonBelt.map((b, i) => {
    const thisOrbit = nonBeltSceneOrbits[i]
    const nextOrbit = i < nonBelt.length - 1 ? nonBeltSceneOrbits[i + 1] : nearestCompanionOffset
    const moonMaxReach = (nextOrbit - thisOrbit) / 2
    return buildBody(b, system, hzCenterAu, scaleMode, orbitIndexById.get(b.id) ?? 0, moonMaxReach)
  }), nearestCompanionOffset)
  const belts = beltBodies.map((b) => buildBelt(b, hzCenterAu, scaleMode, orbitIndexById.get(b.id) ?? 0))

  const allHazards = system.majorHazards.map((h) => classifyHazard(h, system, hzCenterAu))
  const hazards = allHazards.filter((h) => !isSystemLevelHazard(h))
  const systemLevelHazards = allHazards.filter((h) => isSystemLevelHazard(h))
  const guBleeds = [classifyGuBleed(system.guOverlay, system, hzCenterAu)]
  const systemLevelPhenomena = system.phenomena.map(buildSystemLevelPhenomenon)
  const phenomena: PhenomenonMarker[] = []
  const ruins: RuinMarker[] = []
  const systemLevelRuins: string[] = []
  for (const ruin of system.ruins) {
    const marker = buildRuin(ruin, system, bodies, belts, hzCenterAu, scaleMode)
    if (marker) ruins.push(marker)
    else systemLevelRuins.push(ruin.id)
  }

  const maxBodyOrbit = Math.max(...bodies.map((b) => b.orbitRadius), 0)
  const maxBeltOrbit = Math.max(...belts.map((b) => b.outerRadius), 0)
  const sceneRadius = Math.max(maxBodyOrbit, maxBeltOrbit, auToScene(system.zones.snowLineAu.value, hzCenterAu, scaleMode)) * 1.15

  const zones = {
    habitableInner: auToScene(system.zones.habitableInnerAu.value, hzCenterAu, scaleMode),
    habitable: auToScene(system.zones.habitableCenterAu.value, hzCenterAu, scaleMode),
    habitableOuter: auToScene(system.zones.habitableOuterAu.value, hzCenterAu, scaleMode),
    snowLine: auToScene(system.zones.snowLineAu.value, hzCenterAu, scaleMode),
  }

  const subSystems: SubSystemVisual[] = []
  for (let idx = 0; idx < system.companions.length; idx++) {
    const c = system.companions[idx]
    if (c.mode !== 'orbital-sibling' || !c.subSystem) continue

    const companionStar = buildCompanion(c, star, hzCenterAu, scaleMode)
    const subHzCenter = c.subSystem.zones.habitableCenterAu.value > 0
      ? c.subSystem.zones.habitableCenterAu.value
      : 1

    const subSystemShim: GeneratedSystem = {
      ...system,
      zones: c.subSystem.zones,
      bodies: c.subSystem.bodies,
      settlements: c.subSystem.settlements,
      gates: c.subSystem.gates,
      ruins: c.subSystem.ruins,
      phenomena: c.subSystem.phenomena,
    }

    const sortedSubBodies = [...c.subSystem.bodies].sort((l, r) => l.orbitAu.value - r.orbitAu.value)
    const subOrbitIndex = new Map(sortedSubBodies.map((body, i) => [body.id, i]))
    const subNonBelt = sortedSubBodies.filter((b) => b.category.value !== 'belt')
    const subBeltBodies = sortedSubBodies.filter((b) => b.category.value === 'belt')

    const subCompanionOffset = Math.hypot(...companionStar.position)
    const subOrbitRadiusCap = subCompanionOffset * SUB_SYSTEM_EXTENT_FRACTION

    const subNonBeltSceneOrbits = subNonBelt.map((b) => orbitRadiusForBody(b, subHzCenter, scaleMode, subOrbitIndex.get(b.id) ?? 0))
    const subBodiesUncapped = applyBodyOrbitClearance(
      subNonBelt.map((b, i) => {
        const thisOrbit = subNonBeltSceneOrbits[i]
        const nextOrbit = i < subNonBelt.length - 1 ? subNonBeltSceneOrbits[i + 1] : subOrbitRadiusCap
        const moonMaxReach = (nextOrbit - thisOrbit) / 2
        return buildBody(b, subSystemShim, subHzCenter, scaleMode, subOrbitIndex.get(b.id) ?? 0, moonMaxReach)
      }),
    )
    const subBodies = subBodiesUncapped.map((b) =>
      b.orbitRadius <= subOrbitRadiusCap ? b : { ...b, orbitRadius: subOrbitRadiusCap },
    )
    const subBelts = subBeltBodies.map((b) => buildBelt(b, subHzCenter, scaleMode, subOrbitIndex.get(b.id) ?? 0))

    const subRuins: RuinMarker[] = []
    const subSystemLevelRuins: string[] = []
    for (const ruin of c.subSystem.ruins) {
      const marker = buildRuin(ruin, subSystemShim, subBodies, subBelts, subHzCenter, scaleMode)
      if (marker) subRuins.push(marker)
      else subSystemLevelRuins.push(ruin.id)
    }
    const subPhenomena: PhenomenonMarker[] = []
    const subSystemLevelPhenomena = c.subSystem.phenomena.map(buildSystemLevelPhenomenon)

    subSystems.push({
      star: companionStar,
      bodies: subBodies,
      belts: subBelts,
      ruins: subRuins,
      phenomena: subPhenomena,
      systemLevelPhenomena: subSystemLevelPhenomena,
      systemLevelHazards: [],
      systemLevelRuins: subSystemLevelRuins,
    })
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
    systemLevelPhenomena,
    systemLevelHazards,
    systemLevelRuins,
    sceneRadius,
    subSystems,
    distantMarkers,
    circumbinaryKeepOut,
  }
}
