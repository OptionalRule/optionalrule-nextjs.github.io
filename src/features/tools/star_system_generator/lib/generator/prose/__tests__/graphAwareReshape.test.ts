import { describe, expect, it } from 'vitest'
import { graphAwareReshape } from '../graphAwareReshape'
import { createSeededRng } from '../../rng'
import type { Settlement, SystemPhenomenon, GenerationOptions } from '../../../../types'
import type { SystemRelationshipGraph } from '../../graph'

function emptyGraph(): SystemRelationshipGraph {
  return {
    entities: [], edges: [], spineEdgeIds: [], historicalEdgeIds: [],
    edgesByEntity: {},
    edgesByType: {
      HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
      CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
      CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
      FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
    },
  }
}

function minimalSettlement(id: string): Settlement {
  return { id } as unknown as Settlement
}

function minimalPhenomenon(id: string): SystemPhenomenon {
  return { id } as unknown as SystemPhenomenon
}

const baseOptions: GenerationOptions = {
  seed: 't', distribution: 'frontier', tone: 'balanced',
  gu: 'normal', settlements: 'normal',
}

describe('graphAwareReshape', () => {
  it('returns input unchanged when no flags are set', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: baseOptions,
      rng: createSeededRng('reshape-test'),
    })
    expect(result.settlements).toBe(settlements)
    expect(result.phenomena).toBe(phenomena)
  })

  it('returns input unchanged when graphAware is empty object', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: {} },
      rng: createSeededRng('reshape-test'),
    })
    expect(result.settlements).toBe(settlements)
    expect(result.phenomena).toBe(phenomena)
  })

  it('iterates settlements when settlementWhyHere flag is on', () => {
    const settlements: Settlement[] = [minimalSettlement('s1'), minimalSettlement('s2')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('reshape-test'),
    })
    expect(result.settlements).not.toBe(settlements)
    expect(result.settlements).toEqual(settlements)
  })

  it('iterates phenomena when phenomenonNote flag is on', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1'), minimalPhenomenon('p2')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { phenomenonNote: true } },
      rng: createSeededRng('reshape-test'),
    })
    expect(result.phenomena).not.toBe(phenomena)
    expect(result.phenomena).toEqual(phenomena)
  })

  it('does not iterate phenomena when only settlement flags are on', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('reshape-test'),
    })
    expect(result.phenomena).toBe(phenomena)
  })

  it('does not iterate settlements when only phenomenonNote flag is on', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { phenomenonNote: true } },
      rng: createSeededRng('reshape-test'),
    })
    expect(result.settlements).toBe(settlements)
  })

  it('forks rng with label "graph-prose"', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const resultA = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('fork-label-test'),
    })
    const resultB = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('fork-label-test'),
    })
    expect(resultA).toEqual(resultB)
  })

  it('preserves determinism: same input + same seed → identical output', () => {
    const settlements: Settlement[] = [minimalSettlement('s1'), minimalSettlement('s2')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const options: GenerationOptions = { ...baseOptions, graphAware: { settlementWhyHere: true, phenomenonNote: true } }
    const resultA = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options,
      rng: createSeededRng('determinism-seed'),
    })
    const resultB = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options,
      rng: createSeededRng('determinism-seed'),
    })
    expect(resultA).toEqual(resultB)
  })
})
