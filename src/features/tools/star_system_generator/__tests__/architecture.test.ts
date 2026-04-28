import { describe, expect, it } from 'vitest'
import type { BodyCategory, GenerationOptions, OrbitingBody, PartialKnownBody, PartialKnownSystem } from '../types'
import {
  buildArchitectureSlots,
  evaluateArchitectureSatisfaction,
  getArchitectureProfiles,
  replacementSlotsForUnsatisfiedRequirements,
} from '../lib/generator/architecture'
import { generateSystem } from '../lib/generator'
import { createSeededRng } from '../lib/generator/rng'

const options: GenerationOptions = {
  seed: 'compact-test-4',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function body(category: BodyCategory): OrbitingBody {
  return {
    id: `${category}-fixture`,
    category: { value: category, confidence: 'confirmed', source: 'Test fixture' },
  } as OrbitingBody
}

function lockedAnomaly(index: number): PartialKnownBody {
  return {
    id: `known-anomaly-${index}`,
    orbitAu: { value: 0.08 + index * 0.09, confidence: 'confirmed', source: 'Test catalog', locked: true },
    name: { value: `Known Anomaly ${index}`, confidence: 'confirmed', source: 'Test catalog', locked: true },
    category: { value: 'anomaly', confidence: 'confirmed', source: 'Test catalog', locked: true },
    bodyClass: { value: 'Dark-sector density anomaly', confidence: 'confirmed', source: 'Test catalog', locked: true },
    massClass: { value: 'Dark-sector anomaly', confidence: 'confirmed', source: 'Test catalog', locked: true },
  }
}

describe('architecture slot contracts', () => {
  it('defines profiles for every architecture table family', () => {
    expect(getArchitectureProfiles().map((profile) => profile.name)).toEqual([
      'Failed system',
      'Debris-dominated',
      'Sparse rocky',
      'Compact inner system',
      'Peas-in-a-pod chain',
      'Solar-ish mixed',
      'Migrated giant',
      'Giant-rich or chaotic',
    ])
  })

  it('protects compact and peas-in-a-pod required core slots from anomaly plans', () => {
    const compact = buildArchitectureSlots(createSeededRng('compact-core-contract'), 'Compact inner system')
    const peas = buildArchitectureSlots(createSeededRng('peas-core-contract'), 'Peas-in-a-pod chain')

    const compactCore = compact.filter((slot) => slot.requirementId === 'compact-rocky-core')
    const peasCore = peas.filter((slot) => slot.requirementId === 'peas-rocky-chain')

    expect(compactCore).toHaveLength(3)
    expect(peasCore).toHaveLength(4)
    expect([...compactCore, ...peasCore].every((slot) => slot.countsToward.includes('rocky-chain'))).toBe(true)
    expect([...compactCore, ...peasCore].some((slot) => slot.planKind === 'anomaly')).toBe(false)
  })

  it('turns unsatisfied minimums into deterministic replacement slots', () => {
    const satisfaction = evaluateArchitectureSatisfaction('Compact inner system', [
      body('anomaly'),
      body('belt'),
    ])
    const replacements = replacementSlotsForUnsatisfiedRequirements(satisfaction)

    expect(satisfaction[0]).toMatchObject({
      requirementId: 'compact-rocky-core',
      deficit: 3,
      replacementKind: 'rocky',
    })
    expect(replacements.map((slot) => [slot.id, slot.planKind, slot.role])).toEqual([
      ['compact-rocky-core-replacement-1', 'rocky', 'replacement'],
      ['compact-rocky-core-replacement-2', 'rocky', 'replacement'],
      ['compact-rocky-core-replacement-3', 'rocky', 'replacement'],
    ])
  })

  it('preserves locked imported bodies and adds replacement core bodies when imports consume compact slots', () => {
    const knownSystem: PartialKnownSystem = {
      bodies: Array.from({ length: 10 }, (_, index) => lockedAnomaly(index + 1)),
    }

    const system = generateSystem(options, knownSystem)
    const repeated = generateSystem(options, knownSystem)

    expect(system).toEqual(repeated)
    expect(system.architecture.name.value).toBe('Compact inner system')

    for (const known of knownSystem.bodies ?? []) {
      const generated = system.bodies.find((candidate) => candidate.id === known.id)
      expect(generated?.orbitAu).toEqual(known.orbitAu)
      expect(generated?.name).toEqual(known.name)
      expect(generated?.category).toEqual(known.category)
      expect(generated?.bodyClass).toEqual(known.bodyClass)
      expect(generated?.massClass).toEqual(known.massClass)
    }

    const rockyChainBodies = system.bodies.filter((candidate) =>
      candidate.category.value === 'rocky-planet' ||
      candidate.category.value === 'super-earth' ||
      candidate.category.value === 'sub-neptune'
    )
    const replacementNotes = system.bodies.flatMap((candidate) =>
      candidate.filterNotes.filter((note) => note.value.includes('Architecture replacement slot'))
    )

    expect(rockyChainBodies.length).toBeGreaterThanOrEqual(3)
    expect(replacementNotes).toHaveLength(3)
  })
})
