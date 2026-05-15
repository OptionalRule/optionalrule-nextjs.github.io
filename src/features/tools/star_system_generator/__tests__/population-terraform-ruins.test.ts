import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'terraform-ruin-test',
  distribution: 'realistic',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

function findFailedTerraformSeed(): { seed: string; bodyId: string; bodyName: string } | null {
  for (let i = 0; i < 200; i += 1) {
    const sys = generateSystem({ ...baseOptions, seed: `failed-tf-${i}` })
    const body = sys.bodies.find((b) => b.population?.value.terraformState === 'failed')
    if (body) return { seed: `failed-tf-${i}`, bodyId: body.id, bodyName: body.name.value }
  }
  return null
}

describe('failed terraform → HumanRemnant', () => {
  it('emits a terraform-ruin for every failed-terraform body', () => {
    const found = findFailedTerraformSeed()
    if (!found) {
      console.warn('No failed-terraform body found in 200 seeds; consider broadening terraform detection.')
      return
    }
    const sys = generateSystem({ ...baseOptions, seed: found.seed })
    const failedBodies = sys.bodies.filter((b) => b.population?.value.terraformState === 'failed')
    for (const body of failedBodies) {
      const matching = sys.ruins.filter((r) =>
        r.location.value === body.name.value
        && /terraform|garden|mirror|dome/i.test(r.remnantType.value),
      )
      expect(matching.length).toBeGreaterThan(0)
    }
  })

  it('produces stable terraform ruins across runs with the same seed', () => {
    const found = findFailedTerraformSeed()
    if (!found) return
    const a = generateSystem({ ...baseOptions, seed: found.seed })
    const b = generateSystem({ ...baseOptions, seed: found.seed })
    expect(a.ruins.map((r) => r.remnantType.value)).toEqual(b.ruins.map((r) => r.remnantType.value))
  })

  it('does not produce terraform ruins for systems without failed terraforms', () => {
    const sys = generateSystem({ ...baseOptions, seed: 'no-failed-tf-1', settlements: 'sparse' })
    const failedBodyNames = sys.bodies
      .filter((b) => b.population?.value.terraformState === 'failed')
      .map((b) => b.name.value)
    if (failedBodyNames.length !== 0) return
    const phantomRuins = sys.ruins.filter((r) =>
      /mirror array collapse|failed garden|dome necropolis|burnsite/i.test(r.remnantType.value),
    )
    expect(phantomRuins.length).toBe(0)
  })
})
