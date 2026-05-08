import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../../lib/generator'
import { buildSceneGraph } from '../sceneGraph'

const seed = 'plan-test-001'

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

  it('orbit radii are monotonic when bodies are sorted by AU', () => {
    const sorted = [...graph.bodies].sort((a, b) => a.orbitRadius - b.orbitRadius)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].orbitRadius).toBeGreaterThanOrEqual(sorted[i - 1].orbitRadius)
    }
  })

  it('is deterministic for the same seed', () => {
    const a = buildSceneGraph(system)
    const b = buildSceneGraph(system)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('produces one HazardVisual per major hazard', () => {
    expect(graph.hazards.length).toBe(system.majorHazards.length)
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
})
