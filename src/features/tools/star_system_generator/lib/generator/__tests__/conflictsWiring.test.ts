import { describe, expect, it } from 'vitest'
import { generateSystem, GENERATOR_VERSION } from '../index'
import { exportSystemJson } from '../../export/json'
import type { GenerationOptions } from '../../../types'

const base: Omit<GenerationOptions, 'seed'> = {
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('conflict wiring in generateSystem', () => {
  it('produces conflicts on systemStory for seeds with spine edges', () => {
    const probes = ['wiring-a', 'wiring-b', 'wiring-c']
    const conflictCounts = probes.map(seed => {
      const system = generateSystem({ ...base, seed })
      return system.systemStory.conflicts?.length ?? 0
    })
    expect(Math.max(...conflictCounts)).toBeGreaterThan(0)
  })

  it('every conflict is fully populated and tied to a spine edge', () => {
    const system = generateSystem({ ...base, seed: 'wiring-a' })
    const spineIds = new Set(system.relationshipGraph.spineEdgeIds)
    for (const conflict of system.systemStory.conflicts ?? []) {
      expect(spineIds.has(conflict.edgeId)).toBe(true)
      expect(conflict.parties.length).toBeGreaterThanOrEqual(2)
      expect(conflict.pressure.length).toBeGreaterThan(0)
      expect(conflict.visibleSign.length).toBeGreaterThan(0)
    }
  })

  it('stamps the generator version on the system and in JSON export', () => {
    const system = generateSystem({ ...base, seed: 'wiring-a' })
    expect(system.generatorVersion).toBe(GENERATOR_VERSION)
    expect(exportSystemJson(system)).toContain(`"generatorVersion": ${GENERATOR_VERSION}`)
  })

  it('remains deterministic end to end', () => {
    const a = generateSystem({ ...base, seed: 'wiring-det' })
    const b = generateSystem({ ...base, seed: 'wiring-det' })
    expect(a.systemStory).toEqual(b.systemStory)
  })
})
