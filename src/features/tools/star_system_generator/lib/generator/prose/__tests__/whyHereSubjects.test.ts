import { describe, expect, it } from 'vitest'
import { ALL_WHY_HERE_TEMPLATES, graphAwareSettlementWhyHere } from '../graphAwareSettlementWhyHere'
import { createSeededRng } from '../../rng'
import type { Settlement } from '../../../types'
import type { SystemRelationshipGraph } from '../../graph'
import { EDGE_TYPES } from '../../graph'

const VOLITIONAL = /\{anchor\}('s)? (stays|keeps|grew|digs|clings|maintains|persists|accepts|answers|bends|owes|exists|hides|runs|operates|works|holds|dug|took root|was driven|was bolted|refused|pays|bleeds|drinks|feeds|stayed|came|is breathing|can hear|has stopped|plans|corrects|logs)/

describe('whyHere template subjects', () => {
  it('never uses the anchor as a volitional actor', () => {
    for (const template of ALL_WHY_HERE_TEMPLATES) {
      expect(template).not.toMatch(VOLITIONAL)
    }
  })

  it('keeps at least 3 variants per pool cell', () => {
    expect(ALL_WHY_HERE_TEMPLATES.length).toBeGreaterThanOrEqual(90)
  })
})

describe('graphAwareSettlementWhyHere rendering', () => {
  function makeSettlement(): Settlement {
    const f = (value: string) => ({ value, confidence: 'inferred' as const })
    const n = (value: number) => ({ value, confidence: 'inferred' as const })
    return {
      id: 'set-1',
      name: f('Laboratory 85'),
      anchorKind: f('body'),
      anchorName: f('Taiyangshou-66 III route geometry'),
      anchorDetail: f(''),
      siteCategory: f('Surface settlement'), location: f('surface'), function: f('Salvage yard'),
      population: { value: 'Hundreds', confidence: 'inferred' },
      habitationPattern: { value: 'Inhabited', confidence: 'inferred' },
      authority: f('Salvage court'), builtForm: f('Dome'), aiSituation: f('None'), condition: f('Stable'),
      tags: [], tagHook: f(''), crisis: f(''), hiddenTruth: f(''),
      encounterSites: [], whyHere: f(''), methodNotes: [],
      presence: {
        score: n(0), roll: n(0), tier: f('outpost'), resource: n(0), access: n(0),
        strategic: n(0), guValue: n(0), habitability: n(0), hazard: n(0), legalHeat: n(0),
      },
    } as Settlement
  }

  function emptyGraph(): SystemRelationshipGraph {
    const edgesByType = Object.fromEntries(EDGE_TYPES.map(t => [t, []])) as SystemRelationshipGraph['edgesByType']
    return {
      entities: [], edges: [], edgesByEntity: {}, edgesByType,
      spineEdgeIds: [], settlementSpineEdgeIds: [], historicalEdgeIds: [],
    }
  }

  it('uses the settlement name, not the anchor, as the sentence actor', () => {
    for (let s = 0; s < 10; s++) {
      const result = graphAwareSettlementWhyHere(makeSettlement(), emptyGraph(), createSeededRng(`why-${s}`), 'balanced')
      expect(result).toContain('Laboratory 85')
      expect(result).not.toMatch(/route geometry (stays|keeps|grew|maintains|persists|is here)/)
    }
  })
})
