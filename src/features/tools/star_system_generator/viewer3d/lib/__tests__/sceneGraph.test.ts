import { describe, it, expect } from 'vitest'
import type { Fact, Moon } from '../../../types'
import { generateSystem } from '../../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'
import { auToScene } from '../scale'
import type { BodyShadingKey, RenderArchetype } from '../../types'

const seed = 'plan-test-001'

function fact<T>(value: T, confidence: Fact<T>['confidence'] = 'derived'): Fact<T> {
  return { value, confidence }
}

function testMoon(index: number, scale = 'minor captured moonlet'): Moon {
  return {
    id: `test-moon-${index}`,
    name: fact(`Test Moon ${index}`),
    moonType: fact('Captured asteroid'),
    scale: fact(scale),
    resource: fact('survey value'),
    hazard: fact('none'),
    use: fact('navigation marker'),
  }
}

const expectedArchetypeByShading: Record<BodyShadingKey, RenderArchetype> = {
  'rocky-warm': 'rocky',
  'rocky-cool': 'rocky',
  earthlike: 'earthlike',
  desert: 'desert',
  'sub-neptune': 'sub-neptune',
  'gas-giant': 'gas-giant',
  'ice-giant': 'ice-giant',
  dwarf: 'dwarf',
  anomaly: 'anomaly',
}

describe('buildSceneGraph', () => {
  const system = generateSystem({ seed, distribution: 'realistic', tone: 'balanced', gu: 'normal', settlements: 'normal' })
  const graph = buildSceneGraph(system)

  it('produces a star with non-empty colors and a positive corona radius', () => {
    expect(graph.star.coreColor).toMatch(/^#/)
    expect(graph.star.coronaColor).toMatch(/^#/)
    expect(graph.star.coronaRadius).toBeGreaterThan(0)
  })

  it('renders one BodyVisual per non-belt OrbitingBody', () => {
    const expected = system.bodies.filter((b) => b.category.value !== 'belt').length
    expect(graph.bodies.length).toBe(expected)
  })

  it('renders one BeltVisual per belt OrbitingBody', () => {
    const expected = system.bodies.filter((b) => b.category.value === 'belt').length
    expect(graph.belts.length).toBe(expected)
  })

  it('assigns stable render archetypes to bodies and belts', () => {
    for (const body of graph.bodies) {
      expect(body.renderArchetype).toBe(expectedArchetypeByShading[body.shading])
    }
    expect(graph.belts.every((belt) => belt.renderArchetype === 'belt')).toBe(true)
  })

  it('orbit radii are monotonic when bodies are sorted by AU', () => {
    const sorted = [...graph.bodies].sort((a, b) => a.orbitRadius - b.orbitRadius)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].orbitRadius).toBeGreaterThanOrEqual(sorted[i - 1].orbitRadius)
    }
  })

  it('keeps adjacent rendered bodies visually separated, including moon system reach', () => {
    const sorted = [...graph.bodies].sort((a, b) => a.orbitRadius - b.orbitRadius)
    const visualExtent = (body: typeof sorted[number]) => {
      const ringOrSize = body.rings?.outerRadius ?? body.visualSize
      const moonExtent = body.moons.length > 0
        ? Math.max(...body.moons.map((m) => m.parentRelativeOrbit + m.visualSize))
        : 0
      return Math.max(body.visualSize, ringOrSize, moonExtent)
    }
    for (let i = 1; i < sorted.length; i++) {
      const leftExtent = visualExtent(sorted[i - 1])
      const rightExtent = visualExtent(sorted[i])
      expect(sorted[i].orbitRadius - sorted[i - 1].orbitRadius).toBeGreaterThanOrEqual(leftExtent + rightExtent + 3.5)
    }
  })

  it('projects the actual habitable-zone outer edge', () => {
    const hzCenterAu = system.zones.habitableCenterAu.value > 0 ? system.zones.habitableCenterAu.value : 1
    expect(graph.zones.habitableOuter).toBeCloseTo(auToScene(system.zones.habitableOuterAu.value, hzCenterAu), 5)
  })

  it('is deterministic for the same seed', () => {
    const a = buildSceneGraph(system)
    const b = buildSceneGraph(system)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('partitions hazards across in-scene and system-level slots, one per major hazard', () => {
    expect(graph.hazards.length + graph.systemLevelHazards.length).toBe(system.majorHazards.length)
  })

  it('routes stellar / system-wide / unclassified hazards to systemLevelHazards', () => {
    for (const hazard of graph.systemLevelHazards) {
      expect(
        hazard.unclassified
          || hazard.anchorDescription === 'system-wide'
          || hazard.anchorDescription === 'stellar',
      ).toBe(true)
    }
    for (const hazard of graph.hazards) {
      expect(hazard.unclassified).toBe(false)
      expect(hazard.anchorDescription).not.toBe('system-wide')
      expect(hazard.anchorDescription).not.toBe('stellar')
    }
  })

  it('produces exactly one GuBleedVisual per system', () => {
    expect(graph.guBleeds.length).toBe(1)
  })

  it('marks a body with gu-fracture trait as guAccent', () => {
    const fractured = graph.bodies.find((b) =>
      system.bodies.find((sb) => sb.id === b.id)?.traits.some((t) => /gu|fracture/i.test(t.value)),
    )
    if (fractured) expect(fractured.guAccent).toBe(true)
  })

  it('sceneRadius is at least the outermost orbit radius', () => {
    const maxOrbit = Math.max(...graph.bodies.map((b) => b.orbitRadius), 0)
    expect(graph.sceneRadius).toBeGreaterThanOrEqual(maxOrbit)
  })

  it('supports alternate orbit scale modes without changing generated body count', () => {
    const readable = buildSceneGraph(system, { scaleMode: 'readable-log' })
    const relative = buildSceneGraph(system, { scaleMode: 'relative-au' })
    const schematic = buildSceneGraph(system, { scaleMode: 'schematic' })

    expect(relative.bodies.length).toBe(readable.bodies.length)
    expect(schematic.bodies.length).toBe(readable.bodies.length)
    expect(relative.sceneRadius).toBeGreaterThan(readable.sceneRadius)
    expect(schematic.bodies[1].orbitRadius - schematic.bodies[0].orbitRadius).toBeGreaterThanOrEqual(3.5)
  })

  it('represents every generated moon for a body', () => {
    const targetBody = system.bodies.find((b) => b.category.value !== 'belt')
    expect(targetBody).toBeTruthy()

    const moons = Array.from({ length: 7 }, (_, index) => testMoon(index + 1))
    const patchedSystem = {
      ...system,
      bodies: system.bodies.map((body) => body.id === targetBody?.id ? { ...body, moons } : body),
    }
    const patchedGraph = buildSceneGraph(patchedSystem)
    const visual = patchedGraph.bodies.find((body) => body.id === targetBody?.id)

    expect(visual?.moons.map((moon) => moon.id)).toEqual(moons.map((moon) => moon.id))
  })

  it('derives moon visual size and period from moon scale and orbit shell', () => {
    const targetBody = system.bodies.find((b) => b.category.value !== 'belt')
    expect(targetBody).toBeTruthy()

    const moons = [
      testMoon(1, 'minor captured moonlet'),
      testMoon(2, 'small major moon'),
      testMoon(3, 'large differentiated moon'),
    ]
    const patchedSystem = {
      ...system,
      bodies: system.bodies.map((body) => body.id === targetBody?.id
        ? {
            ...body,
            physical: {
              ...body.physical,
              massEarth: fact(1),
            },
            moons,
          }
        : body),
    }
    const patchedGraph = buildSceneGraph(patchedSystem)
    const visual = patchedGraph.bodies.find((body) => body.id === targetBody?.id)

    expect(visual?.moons.map((moon) => moon.visualSize)).toEqual([
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    ])
    expect(visual?.moons[2].visualSize).toBeGreaterThan(visual?.moons[0].visualSize ?? 0)
    expect((2 * Math.PI) / (visual?.moons[0].angularSpeed ?? Number.POSITIVE_INFINITY)).toBeGreaterThanOrEqual(24)
    expect(visual?.moons[0].angularSpeed).toBeGreaterThan(visual?.moons[2].angularSpeed ?? Number.POSITIVE_INFINITY)
  })

  it('attaches generated remnants whose location is a body name', () => {
    const targetBody = system.bodies.find((b) => b.category.value !== 'belt')
    expect(targetBody).toBeTruthy()

    const ruin = {
      id: 'name-located-remnant',
      location: fact(targetBody?.name.value ?? '', 'human-layer'),
      remnantType: fact('First-wave archive', 'human-layer'),
      hook: fact('Unresolved salvage title', 'human-layer'),
    }
    const patchedSystem = { ...system, ruins: [ruin] }
    const patchedGraph = buildSceneGraph(patchedSystem)
    const visual = patchedGraph.bodies.find((body) => body.id === targetBody?.id)

    expect(patchedGraph.ruins[0].attachedBodyId).toBe(targetBody?.id)
    expect(visual?.ruinIds).toContain(ruin.id)
    expect(patchedGraph.ruins[0].renderArchetype).toBe('ruin-marker')
  })

  it('attaches belt-located remnants to the matching rendered belt', () => {
    const targetBelt = system.bodies.find((b) => b.category.value === 'belt')
    expect(targetBelt).toBeTruthy()

    const ruin = {
      id: 'belt-remnant',
      location: fact(targetBelt?.name.value ?? '', 'human-layer'),
      remnantType: fact('Broken salvage flotilla', 'human-layer'),
      hook: fact('Its beacon still sells a false docking solution.', 'human-layer'),
    }
    const patchedGraph = buildSceneGraph({ ...system, ruins: [ruin] })
    const marker = patchedGraph.ruins[0]
    const belt = patchedGraph.belts.find((b) => b.id === targetBelt?.id)
    expect(belt).toBeTruthy()

    const radius = Math.hypot(marker.position[0], marker.position[2])
    expect(marker.attachedBeltId).toBe(targetBelt?.id)
    expect(marker.attachedBodyId).toBeUndefined()
    expect(radius).toBeGreaterThanOrEqual(belt?.innerRadius ?? 0)
    expect(radius).toBeLessThanOrEqual(belt?.outerRadius ?? 0)
  })

  it('routes every generated phenomenon into systemLevelPhenomena', () => {
    const phenomenon = {
      id: 'test-phenomenon',
      phenomenon: fact('Fold static', 'gu-layer'),
      note: fact('Sensors stutter across the band.', 'gu-layer'),
      travelEffect: fact('Minor translation lag.', 'gu-layer'),
      surveyQuestion: fact('What repeats inside the signal?', 'gu-layer'),
      conflictHook: fact('Survey crews dispute ownership of the readings.', 'gu-layer'),
      sceneAnchor: fact('A violet shimmer hangs off the snow line.', 'gu-layer'),
    }
    const patchedGraph = buildSceneGraph({ ...system, phenomena: [phenomenon] })

    expect(patchedGraph.phenomena).toHaveLength(0)
    expect(patchedGraph.systemLevelPhenomena).toHaveLength(1)
    expect(patchedGraph.systemLevelPhenomena[0].id).toBe('test-phenomenon')
    expect(patchedGraph.systemLevelPhenomena[0].kind).toBe('Fold static')
    expect(patchedGraph.systemLevelPhenomena[0].color).toMatch(/^#/)
  })
})
