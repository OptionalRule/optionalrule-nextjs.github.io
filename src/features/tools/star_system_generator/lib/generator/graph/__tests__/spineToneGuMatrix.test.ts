import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../index'

describe('spine tone × gu matrix (structural fields only)', () => {
  const tones = ['balanced', 'astronomy', 'cinematic'] as const
  const gus = ['low', 'normal', 'high', 'fracture'] as const
  const flags = { settlementWhyHere: true, phenomenonNote: true, settlementHookSynthesis: true }

  for (const tone of tones) {
    for (const gu of gus) {
      it(`tone=${tone} gu=${gu} produces stable spine structural fields`, () => {
        const sys = generateSystem({
          seed: `spine-matrix-${tone}-${gu}`,
          distribution: 'frontier',
          tone,
          gu,
          settlements: 'normal',
          graphAware: flags,
        })
        const top = sys.relationshipGraph.edges.find(
          e => e.id === sys.relationshipGraph.spineEdgeIds[0],
        )
        expect({
          spineEdgeType: top?.type ?? null,
          spineSubjectKind: top?.subject.kind ?? null,
          spineObjectKind: top?.object.kind ?? null,
        }).toMatchSnapshot()
      })
    }
  }
})
