import { describe, it, expect } from 'vitest'
import { generateSystem } from '../lib/generator'
import { validateSystem } from '../lib/generator/validation'
import { siblingOuterAuLimit } from '../lib/generator/companionStability'
import { separationToBucketAu } from '../lib/generator/companionGeometry'

describe('BINARY_STABILITY_CONFLICT covers sub-system bodies', () => {
  it('seed cut-frontier-balanced-normal-normal-8-68: no findings after sub-system cutoff fix', () => {
    const system = generateSystem({
      seed: 'cut-frontier-balanced-normal-normal-8-68',
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    })
    const findings = validateSystem(system)
    const stabilityFindings = findings.filter(f => f.code === 'BINARY_STABILITY_CONFLICT')
    expect(stabilityFindings).toEqual([])
  })

  it('synthetically violating sub-body is detected with correct mass-arg order', () => {
    const system = generateSystem({
      seed: 'cut-frontier-balanced-normal-normal-8-68',
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    })
    const sibling = system.companions.find(c => c.mode === 'orbital-sibling' && c.subSystem)
    expect(sibling).toBeTruthy()
    if (!sibling) return

    const sep = separationToBucketAu(sibling.separation.value)
    const companionMass = sibling.star.massSolar.value
    const primaryMass = system.primary.massSolar.value

    const correctLimit = siblingOuterAuLimit(sep, companionMass, primaryMass)
    const wrongLimit = siblingOuterAuLimit(sep, primaryMass, companionMass)

    expect(correctLimit).toBeLessThan(wrongLimit)

    const betweenLimits = (correctLimit + wrongLimit) / 2

    const templateBody = sibling.subSystem!.bodies[0]
    const inflated = {
      ...templateBody,
      orbitAu: { ...templateBody.orbitAu, value: betweenLimits, locked: false },
    }
    const mutated = {
      ...system,
      companions: system.companions.map(c =>
        c === sibling
          ? { ...c, subSystem: { ...c.subSystem!, bodies: [inflated, ...c.subSystem!.bodies.slice(1)] } }
          : c
      ),
    }
    const findings = validateSystem(mutated)
    const stabilityFindings = findings.filter(f => f.code === 'BINARY_STABILITY_CONFLICT')
    expect(stabilityFindings.length).toBeGreaterThan(0)
  })
})
