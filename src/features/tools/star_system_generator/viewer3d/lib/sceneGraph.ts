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
} from '../types'
import { auToScene, bodyVisualSize } from './scale'
import { angularSpeedFromAu, hashToUnit, phase0ForBody } from './motion'
import { spectralVisuals } from './stellarColor'
import { chooseShading } from './bodyShading'
import { classifyHazard } from './hazardClassifier'
import { classifyGuBleed } from './guBleedClassifier'

const COMPANION_OFFSETS: Record<string, number> = {
  close:    auToScene(0.5),
  near:     auToScene(2),
  moderate: auToScene(8),
  wide:     auToScene(40),
  distant:  auToScene(80),
}

function companionOffset(separation: string): number {
  const lower = separation.toLowerCase()
  for (const [keyword, offset] of Object.entries(COMPANION_OFFSETS)) {
    if (lower.includes(keyword)) return offset
  }
  return COMPANION_OFFSETS.moderate
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

function buildCompanion(companion: StellarCompanion, _primary: StarVisual): StarVisual {
  const visuals = spectralVisuals('G2V', 50)
  const offset = companionOffset(companion.separation.value)
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

function moonsFor(body: OrbitingBody, _seed: string, parentSize: number): MoonVisual[] {
  const cap = 4
  return body.moons.slice(0, cap).map((moon: Moon, idx: number) => {
    const orbit = parentSize * (1.8 + idx * 0.7)
    return {
      id: moon.id,
      parentBodyId: body.id,
      parentRelativeOrbit: orbit,
      phase0: phase0ForBody(moon.id, _seed),
      angularSpeed: (Math.PI * 2) / 6,
      visualSize: parentSize * 0.18,
      shading: 'dwarf',
    }
  })
}

function bodyHasGuFracture(body: OrbitingBody): boolean {
  if (body.category.value === 'anomaly') return true
  const traitText = body.traits.map((t) => t.value).join(' ').toLowerCase()
  if (traitText.includes('gu-fracture') || traitText.includes('gu fracture') || traitText.includes('fractured')) return true
  const filterText = body.filterNotes.map((t) => t.value).join(' ').toLowerCase()
  return filterText.includes('gu') && filterText.includes('fracture')
}

function buildBody(body: OrbitingBody, system: GeneratedSystem): BodyVisual {
  const size = bodyVisualSize(body.category.value)
  const settlementIds = system.settlements
    .filter((s) => s.bodyId === body.id || body.moons.some((m) => m.id === s.moonId))
    .map((s) => s.id)
  const ruinIds = system.ruins
    .filter((r) => r.location.value.toLowerCase().includes(body.name.value.toLowerCase()))
    .map((r) => r.id)
  return {
    id: body.id,
    orbitRadius: auToScene(body.orbitAu.value),
    orbitTiltY: (hashToUnit(`tilt#${body.id}`) - 0.5) * 0.12,
    phase0: phase0ForBody(body.id, system.seed),
    angularSpeed: angularSpeedFromAu(body.orbitAu.value),
    visualSize: size,
    shading: chooseShading(body),
    category: body.category.value,
    rings: ringFor(body, size),
    moons: moonsFor(body, system.seed, size),
    guAccent: bodyHasGuFracture(body),
    hasSettlements: settlementIds.length > 0,
    settlementIds,
    ruinIds,
  }
}

function buildBelt(body: OrbitingBody): BeltVisual {
  const r = auToScene(body.orbitAu.value)
  return {
    id: body.id,
    innerRadius: r * 0.92,
    outerRadius: r * 1.08,
    particleCount: 1500,
    jitter: r * 0.04,
    color: '#a4a48f',
  }
}

function buildPhenomenon(phen: GeneratedSystem['phenomena'][number], system: GeneratedSystem): PhenomenonMarker {
  const angle = hashToUnit(`phen#${phen.id}`) * Math.PI * 2
  const rAu = (system.zones.habitableCenterAu.value + system.zones.snowLineAu.value) / 2
  const r = auToScene(rAu)
  return {
    id: phen.id,
    position: [Math.cos(angle) * r * 1.3, 0, Math.sin(angle) * r * 1.3],
    kind: phen.phenomenon.value,
  }
}

function buildRuin(ruin: GeneratedSystem['ruins'][number], system: GeneratedSystem, bodies: BodyVisual[]): RuinMarker {
  const locationLower = ruin.location.value.toLowerCase()
  const matched = bodies.find((b) => locationLower.includes(b.id.toLowerCase()))
  if (matched) {
    return {
      id: ruin.id,
      attachedBodyId: matched.id,
      position: [0, 0, 0],
    }
  }
  const outer = bodies.reduce<BodyVisual | undefined>(
    (acc, b) => (acc && acc.orbitRadius > b.orbitRadius ? acc : b),
    undefined,
  )
  const baseR = (outer ? outer.orbitRadius : auToScene(system.zones.snowLineAu.value)) * 1.2
  const angle = hashToUnit(`ruin#${ruin.id}`) * Math.PI * 2
  return {
    id: ruin.id,
    position: [Math.cos(angle) * baseR, 0, Math.sin(angle) * baseR],
  }
}

export function buildSceneGraph(system: GeneratedSystem): SystemSceneGraph {
  const star = buildStar(system)
  const companions = system.companions.map((c) => buildCompanion(c, star))

  const nonBelt = system.bodies.filter((b) => b.category.value !== 'belt')
  const beltBodies = system.bodies.filter((b) => b.category.value === 'belt')

  const bodies = nonBelt.map((b) => buildBody(b, system))
  const belts = beltBodies.map(buildBelt)

  const hazards = system.majorHazards.map((h) => classifyHazard(h, system))
  const guBleeds = [classifyGuBleed(system.guOverlay, system)]
  const phenomena = system.phenomena.map((p) => buildPhenomenon(p, system))
  const ruins = system.ruins.map((r) => buildRuin(r, system, bodies))

  const maxBodyOrbit = Math.max(...bodies.map((b) => b.orbitRadius), 0)
  const maxBeltOrbit = Math.max(...belts.map((b) => b.outerRadius), 0)
  const sceneRadius = Math.max(maxBodyOrbit, maxBeltOrbit, auToScene(system.zones.snowLineAu.value)) * 1.15

  const zones = {
    habitableInner: auToScene(system.zones.habitableInnerAu.value),
    habitable: auToScene(system.zones.habitableCenterAu.value),
    snowLine: auToScene(system.zones.snowLineAu.value),
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
