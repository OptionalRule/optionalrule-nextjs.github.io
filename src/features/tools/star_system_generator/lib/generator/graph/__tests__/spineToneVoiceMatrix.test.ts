import { describe, expect, it } from 'vitest'
import { generateSystem } from '../../index'

// Cross-tone voice matrix snapshot. Pins body[0] and spineSummary per
// (tone × spine edge type) cell for the top-2 spine-eligible edge types
// (DESTABILIZES + CONTESTS — empirically the only spine edge types post
// Phase A). Future per-tone template-variant changes regenerate this
// snapshot intentionally; reviewers see per-cell prose diffs.
//
// Per Phase C task 1 frequency survey across 600 seeds:
//   balanced + astronomy → 100% DESTABILIZES at spine[0]
//   cinematic            → ~92% CONTESTS, ~8% DESTABILIZES at spine[0]
// Seeds below were curated against this distribution; the assertion
// captures whichever spine edge type the curated seed actually selects.
describe('spine tone × edge type voice matrix', () => {
  const tones = ['balanced', 'cinematic', 'astronomy'] as const
  const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }

  for (const tone of tones) {
    it(`tone=${tone}: spine prose reads in tone voice`, () => {
      const seed = `voice-matrix-${tone}-1`
      const sys = generateSystem({
        seed,
        distribution: 'frontier',
        tone,
        gu: 'normal',
        settlements: 'normal',
        graphAware: flags,
      })
      const topSpine = sys.relationshipGraph.edges.find(
        e => e.id === sys.relationshipGraph.spineEdgeIds[0],
      )
      expect({
        spineEdgeType: topSpine?.type ?? null,
        spineSummary: sys.systemStory.spineSummary,
        body0: sys.systemStory.body[0] ?? null,
      }).toMatchSnapshot()
    })
  }
})
