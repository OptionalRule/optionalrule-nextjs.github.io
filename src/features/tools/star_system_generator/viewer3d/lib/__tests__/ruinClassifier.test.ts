import { describe, it, expect } from 'vitest'
import type { Fact, HumanRemnant } from '../../../types'
import { generateSystem } from '../../../lib/generator'
import { classifyRuin } from '../ruinClassifier'

function fact<T>(value: T, confidence: Fact<T>['confidence'] = 'human-layer'): Fact<T> {
  return { value, confidence }
}

function makeRuin(id: string, location: string): HumanRemnant {
  return {
    id,
    location: fact(location),
    remnantType: fact('Salvage fragment'),
    hook: fact('Beacon still pings.'),
  }
}

function buildSystem(seed: string) {
  return generateSystem({
    seed,
    distribution: 'frontier',
    tone: 'balanced',
    gu: 'normal',
    settlements: 'normal',
  })
}

describe('classifyRuin', () => {
  const system = buildSystem('ruin-class-001')

  it('returns null for explicit no-anchor keywords', () => {
    expect(classifyRuin(makeRuin('r1', 'derelict route between worlds'), system)).toBeNull()
    expect(classifyRuin(makeRuin('r2', 'drift cloud past the snowline'), system)).toBeNull()
    expect(classifyRuin(makeRuin('r3', 'transit corridor wreckage'), system)).toBeNull()
  })

  it('anchors asteroid/belt phrases to a belt body when one exists', () => {
    const hasBelt = system.bodies.some((b) => b.category.value === 'belt')
    const result = classifyRuin(makeRuin('belt-1', 'lost in the asteroid swarm'), system)
    if (hasBelt) {
      expect(result?.body.category.value).toBe('belt')
    } else {
      expect(result).toBeNull()
    }
  })

  it('anchors gas-giant phrases to a giant body when one exists', () => {
    const hasGiant = system.bodies.some((b) => b.category.value === 'gas-giant' || b.category.value === 'ice-giant')
    const result = classifyRuin(makeRuin('giant-1', 'in orbit around a gas giant'), system)
    if (hasGiant) {
      expect(['gas-giant', 'ice-giant']).toContain(result?.body.category.value)
    } else {
      expect(result).toBeNull()
    }
  })

  it('anchors inner-system phrases to the innermost rocky body', () => {
    const innerByOrbit = [...system.bodies]
      .sort((a, b) => a.orbitAu.value - b.orbitAu.value)
      .find((b) => b.category.value === 'rocky-planet' || b.category.value === 'super-earth' || b.category.value === 'dwarf-body')
    const result = classifyRuin(makeRuin('inner-1', 'hot world inside the snowline'), system)
    if (innerByOrbit) {
      expect(result?.body.id).toBe(innerByOrbit.id)
    } else {
      expect(result).toBeNull()
    }
  })

  it('anchors outer-system phrases to the outermost non-belt body', () => {
    const outer = [...system.bodies]
      .sort((a, b) => a.orbitAu.value - b.orbitAu.value)
      .filter((b) => b.category.value !== 'belt')
      .at(-1)
    const result = classifyRuin(makeRuin('outer-1', 'dark edge beyond the snow line'), system)
    if (outer) {
      expect(result?.body.id).toBe(outer.id)
    } else {
      expect(result).toBeNull()
    }
  })

  it('returns null when no keyword matches', () => {
    const result = classifyRuin(makeRuin('mystery-1', 'somewhere unfamiliar'), system)
    expect(result).toBeNull()
  })

  it('returns null for an empty location string', () => {
    const result = classifyRuin(makeRuin('empty-1', ''), system)
    expect(result).toBeNull()
  })
})
