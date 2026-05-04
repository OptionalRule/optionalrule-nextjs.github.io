import { describe, it, expect } from 'vitest'
import { generateSystem } from '../../index'

type AxisCell = {
  name: string
  distribution: 'frontier' | 'realistic'
  tone: 'balanced' | 'astronomy' | 'cinematic'
  gu: 'low' | 'normal' | 'high' | 'fracture'
  settlements: 'sparse' | 'normal' | 'crowded' | 'hub'
}

const CELLS: readonly AxisCell[] = [
  { name: 'baseline-frontier-balanced',  distribution: 'frontier',  tone: 'balanced',  gu: 'normal', settlements: 'normal' },
  { name: 'baseline-frontier-cinematic', distribution: 'frontier',  tone: 'cinematic', gu: 'normal', settlements: 'normal' },
  { name: 'baseline-frontier-astronomy', distribution: 'frontier',  tone: 'astronomy', gu: 'normal', settlements: 'normal' },
  { name: 'baseline-realistic-balanced',  distribution: 'realistic', tone: 'balanced',  gu: 'normal', settlements: 'normal' },
  { name: 'baseline-realistic-cinematic', distribution: 'realistic', tone: 'cinematic', gu: 'normal', settlements: 'normal' },
  { name: 'baseline-realistic-astronomy', distribution: 'realistic', tone: 'astronomy', gu: 'normal', settlements: 'normal' },
  { name: 'gu-axis-low',      distribution: 'frontier', tone: 'balanced', gu: 'low',      settlements: 'normal' },
  { name: 'gu-axis-normal',   distribution: 'frontier', tone: 'balanced', gu: 'normal',   settlements: 'normal' },
  { name: 'gu-axis-high',     distribution: 'frontier', tone: 'balanced', gu: 'high',     settlements: 'normal' },
  { name: 'gu-axis-fracture', distribution: 'frontier', tone: 'balanced', gu: 'fracture', settlements: 'normal' },
  { name: 'density-sparse',  distribution: 'realistic', tone: 'astronomy', gu: 'normal', settlements: 'sparse' },
  { name: 'density-normal',  distribution: 'realistic', tone: 'astronomy', gu: 'normal', settlements: 'normal' },
  { name: 'density-crowded', distribution: 'realistic', tone: 'astronomy', gu: 'normal', settlements: 'crowded' },
  { name: 'density-hub',     distribution: 'realistic', tone: 'astronomy', gu: 'normal', settlements: 'hub' },
  { name: 'corner-frontier-cinematic-fracture-hub', distribution: 'frontier',  tone: 'cinematic', gu: 'fracture', settlements: 'hub' },
  { name: 'corner-realistic-astronomy-low-sparse',  distribution: 'realistic', tone: 'astronomy', gu: 'low',      settlements: 'sparse' },
]

describe('spine full axis matrix (16 representative cells)', () => {
  const flags = { phenomenonNote: true, settlementHookSynthesis: true }

  for (const cell of CELLS) {
    it(`${cell.name}: stable spine + body[0] structural fields`, () => {
      const sys = generateSystem({
        seed: `axis-matrix-${cell.name}`,
        distribution: cell.distribution,
        tone: cell.tone,
        gu: cell.gu,
        settlements: cell.settlements,
        graphAware: flags,
      })
      const top = sys.relationshipGraph.edges.find(
        e => e.id === sys.relationshipGraph.spineEdgeIds[0],
      )
      expect({
        spineEdgeType: top?.type ?? null,
        spineSubjectKind: top?.subject.kind ?? null,
        spineObjectKind: top?.object.kind ?? null,
        spineVisibility: top?.visibility ?? null,
        spineSummary: sys.systemStory.spineSummary,
        body0: sys.systemStory.body[0] ?? null,
      }).toMatchSnapshot()
    })
  }
})
