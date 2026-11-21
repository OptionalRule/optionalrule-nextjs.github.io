import type { SeededRng } from '../rng'
import type {
  Settlement, SystemPhenomenon, GenerationOptions, GeneratorTone,
} from '../../../types'
import type { SystemRelationshipGraph } from '../graph'
import { graphAwareSettlementWhyHere } from './graphAwareSettlementWhyHere'
import { fact } from '../fact'

export interface GraphAwareReshapeInput {
  settlements: Settlement[]
  phenomena: SystemPhenomenon[]
  relationshipGraph: SystemRelationshipGraph
  options: GenerationOptions
  rng: SeededRng
}

export interface GraphAwareReshapeResult {
  settlements: Settlement[]
  phenomena: SystemPhenomenon[]
}

export function graphAwareReshape(input: GraphAwareReshapeInput): GraphAwareReshapeResult {
  const tone: GeneratorTone = input.options.tone ?? 'balanced'
  const rng = input.rng.fork('graph-prose')
  const settlements = input.settlements.map(s => reshapeSettlement(s, input.relationshipGraph, rng, tone))
  return { settlements, phenomena: input.phenomena }
}

function reshapeSettlement(
  settlement: Settlement,
  graph: SystemRelationshipGraph,
  rng: SeededRng,
  tone: GeneratorTone,
): Settlement {
  let updated = settlement
  const whyHereRng = rng.fork(`why-here-${settlement.id}`)
  const newWhyHere = graphAwareSettlementWhyHere(updated, graph, whyHereRng, tone)
  if (newWhyHere !== null) {
    updated = {
      ...updated,
      whyHere: fact(newWhyHere, 'inferred', 'Graph-aware reshape from settlementWhyHere'),
    }
  }
  return updated
}
