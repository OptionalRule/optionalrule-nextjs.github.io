import { describe, it, expect } from 'vitest'
import { generateSystem } from '../lib/generator'
import { siblingOuterAuLimit } from '../lib/generator/companionStability'
import { separationToBucketAu } from '../lib/generator/companionGeometry'

describe('orbital-sibling sub-system mass-arg order', () => {
  // Seed identified by empirical investigation as a high-asymmetry sub-system.
  const probeSeeds = [
    'cut-frontier-balanced-normal-normal-8-68',
    'cut-frontier-balanced-fracture-normal-7-163',
    'probe-frontier-balanced-low-sparse-6-6',
  ]

  for (const seed of probeSeeds) {
    it(`seed=${seed}: every sub-body stays within the correct HW cutoff`, () => {
      const system = generateSystem({
        seed,
        distribution: 'frontier',
        tone: 'balanced',
        gu: 'normal',
        settlements: 'normal',
      })

      const siblings = system.companions.filter(c => c.mode === 'orbital-sibling' && c.subSystem)
      expect(siblings.length).toBeGreaterThan(0)

      for (const companion of siblings) {
        const sep = separationToBucketAu(companion.separation.value)
        // Correct mass order: sub-star is the host; primary is the perturber.
        const correctCutoff = siblingOuterAuLimit(
          sep,
          companion.star.massSolar.value,
          system.primary.massSolar.value,
        )
        const subBodies = companion.subSystem!.bodies
        for (const body of subBodies) {
          if (body.orbitAu.locked) continue
          expect(body.orbitAu.value,
            `${seed} ${body.id} orbitAu ${body.orbitAu.value} exceeds correct cutoff ${correctCutoff}`,
          ).toBeLessThanOrEqual(correctCutoff)
        }
      }
    })
  }
})
