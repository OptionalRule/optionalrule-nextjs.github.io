import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import {
  BodyLookupProvider,
  useGeneratedBodyLookup,
  useSettlementLookup,
  useGateLookup,
  useRuinLookup,
  usePhenomenonLookup,
} from '../viewer3d/scene/bodyLookup'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions, GeneratedSystem } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'lookup-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

function findOrbitalSiblingSeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `lookup-seek-${i}`
    const system = generateSystem({ ...baseOptions, seed })
    if (system.companions[0]?.mode === 'orbital-sibling') return seed
  }
  throw new Error('No orbital-sibling seed found')
}

function Probe({
  system: _system,
  onLookups,
}: {
  system: GeneratedSystem
  onLookups: (lookups: {
    body: ReturnType<typeof useGeneratedBodyLookup>
    settlement: ReturnType<typeof useSettlementLookup>
    gate: ReturnType<typeof useGateLookup>
    ruin: ReturnType<typeof useRuinLookup>
    phenomenon: ReturnType<typeof usePhenomenonLookup>
  }) => void
}) {
  const body = useGeneratedBodyLookup()
  const settlement = useSettlementLookup()
  const gate = useGateLookup()
  const ruin = useRuinLookup()
  const phenomenon = usePhenomenonLookup()
  onLookups({ body, settlement, gate, ruin, phenomenon })
  return null
}

describe('BodyLookupProvider', () => {
  it('indexes sub-system bodies from orbital-sibling companions', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const sub = sys.companions[0].subSystem!
    expect(sub.bodies.length).toBeGreaterThan(0)

    let captured: ReturnType<typeof useGeneratedBodyLookup> | null = null
    render(
      <BodyLookupProvider system={sys}>
        <Probe system={sys} onLookups={({ body }) => { captured = body }} />
      </BodyLookupProvider>,
    )
    expect(captured).not.toBeNull()
    for (const subBody of sub.bodies) {
      expect(captured!(subBody.id)).toBeDefined()
    }
  })

  it('indexes sub-system settlements, gates, ruins, and phenomena', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const sub = sys.companions[0].subSystem!

    let captured: {
      settlement: ReturnType<typeof useSettlementLookup>
      gate: ReturnType<typeof useGateLookup>
      ruin: ReturnType<typeof useRuinLookup>
      phenomenon: ReturnType<typeof usePhenomenonLookup>
    } | null = null
    render(
      <BodyLookupProvider system={sys}>
        <Probe
          system={sys}
          onLookups={({ settlement, gate, ruin, phenomenon }) => {
            captured = { settlement, gate, ruin, phenomenon }
          }}
        />
      </BodyLookupProvider>,
    )
    expect(captured).not.toBeNull()
    for (const s of sub.settlements) expect(captured!.settlement(s.id)).toBeDefined()
    for (const g of sub.gates) expect(captured!.gate(g.id)).toBeDefined()
    for (const r of sub.ruins) expect(captured!.ruin(r.id)).toBeDefined()
    for (const p of sub.phenomena) expect(captured!.phenomenon(p.id)).toBeDefined()
  })
})
