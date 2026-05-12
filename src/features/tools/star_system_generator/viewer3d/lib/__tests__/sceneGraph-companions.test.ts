import { describe, expect, it } from 'vitest'
import { buildSceneGraph } from '../sceneGraph'
import { generateSystem } from '../../../lib/generator'
import type { GenerationOptions } from '../../../types'

const baseOptions: GenerationOptions = {
  seed: 'scene-companion',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function findSeedForMode(mode: string, max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `scene-${mode}-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === mode) return seed
  }
  throw new Error(`No seed for ${mode}`)
}

describe('sceneGraph companion handling', () => {
  it('emits a distantMarker for linked-independent companions', () => {
    const seed = findSeedForMode('linked-independent')
    const sys = generateSystem({ ...baseOptions, seed })
    const graph = buildSceneGraph(sys)
    expect(graph.distantMarkers).toHaveLength(1)
    expect(graph.distantMarkers[0].linkedSeed).toBe(sys.companions[0].linkedSeed!.value)
  })

  it('emits no distantMarker for orbital-sibling', () => {
    const seed = findSeedForMode('orbital-sibling')
    const sys = generateSystem({ ...baseOptions, seed })
    const graph = buildSceneGraph(sys)
    expect(graph.distantMarkers).toHaveLength(0)
  })

  it('emits a subSystem entry with bodies for orbital-sibling companions', () => {
    const seed = findSeedForMode('orbital-sibling')
    const sys = generateSystem({ ...baseOptions, seed })
    const graph = buildSceneGraph(sys)
    expect(graph.subSystems).toHaveLength(1)
    expect(graph.subSystems[0].bodies.length).toBeGreaterThan(0)
    expect(graph.subSystems[0].star.id).toBe(sys.companions[0].id)
  })
})
