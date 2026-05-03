import type { EdgeType } from '../../types'
import type { EdgeTemplateFamily } from './types'
import { hostsTemplates } from './hostsTemplates'
import { dependsOnTemplates } from './dependsOnTemplates'
import { contestsTemplates } from './contestsTemplates'
import { controlsTemplates } from './controlsTemplates'
import { destabilizesTemplates } from './destabilizesTemplates'
import { suppressesTemplates } from './suppressesTemplates'
import { contradictsTemplates } from './contradictsTemplates'
import { witnessesTemplates } from './witnessesTemplates'
import { hidesFromTemplates } from './hidesFromTemplates'
import { foundedByTemplates } from './foundedByTemplates'
import { betrayedTemplates } from './betrayedTemplates'

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
  HOSTS: hostsTemplates,
  CONTROLS: controlsTemplates,
  DEPENDS_ON: dependsOnTemplates,
  CONTESTS: contestsTemplates,
  DESTABILIZES: destabilizesTemplates,
  SUPPRESSES: suppressesTemplates,
  CONTRADICTS: contradictsTemplates,
  WITNESSES: witnessesTemplates,
  HIDES_FROM: hidesFromTemplates,
  FOUNDED_BY: foundedByTemplates,
  BETRAYED: betrayedTemplates,
  DISPLACED: stubFamily('DISPLACED'),
}

export function templateFor(edgeType: EdgeType): EdgeTemplateFamily {
  return FAMILIES[edgeType]
}

export type { EdgeTemplate, EdgeTemplateFamily, SlotShape } from './types'
