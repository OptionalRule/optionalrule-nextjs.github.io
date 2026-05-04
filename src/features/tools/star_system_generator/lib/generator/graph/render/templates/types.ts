import type { GeneratorTone } from '../../../../../types'
import type { EdgeType } from '../../types'

export type SlotShape = 'properNoun' | 'nounPhrase' | 'verbPhrase' | 'clause' | 'era'

export interface EdgeTemplate {
  text: string
  expects: Partial<Record<string, SlotShape>>
}

export interface EdgeTemplateFamily {
  edgeType: EdgeType
  body: EdgeTemplate[]
  bodyByTone?: Partial<Record<GeneratorTone, EdgeTemplate[]>>
  spineSummary: EdgeTemplate
  spineSummaryByTone?: Partial<Record<GeneratorTone, EdgeTemplate[]>>
  historicalBridge: EdgeTemplate
  hook: EdgeTemplate[]
}
