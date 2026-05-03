import type { EdgeType } from '../../types'
import type { EdgeTemplateFamily } from './types'

function stubFamily(edgeType: EdgeType): EdgeTemplateFamily {
  return {
    edgeType,
    body: [{ text: '', expects: {} }],
    spineSummary: { text: '', expects: {} },
    historicalBridge: { text: '', expects: {} },
    hook: [{ text: '', expects: {} }],
  }
}

const FAMILIES: Record<EdgeType, EdgeTemplateFamily> = {
  HOSTS: stubFamily('HOSTS'),
  CONTROLS: stubFamily('CONTROLS'),
  DEPENDS_ON: stubFamily('DEPENDS_ON'),
  CONTESTS: stubFamily('CONTESTS'),
  DESTABILIZES: stubFamily('DESTABILIZES'),
  SUPPRESSES: stubFamily('SUPPRESSES'),
  CONTRADICTS: stubFamily('CONTRADICTS'),
  WITNESSES: stubFamily('WITNESSES'),
  HIDES_FROM: stubFamily('HIDES_FROM'),
  FOUNDED_BY: stubFamily('FOUNDED_BY'),
  BETRAYED: stubFamily('BETRAYED'),
  DISPLACED: stubFamily('DISPLACED'),
}

export function templateFor(edgeType: EdgeType): EdgeTemplateFamily {
  return FAMILIES[edgeType]
}

export type { EdgeTemplate, EdgeTemplateFamily, SlotShape } from './types'
