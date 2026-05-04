import type { SeededRng } from '../rng'
import type {
  Settlement, SystemPhenomenon, GenerationOptions, GeneratorTone,
} from '../../../types'
import type { SystemRelationshipGraph } from '../graph'
import { graphAwareSettlementWhyHere } from './graphAwareSettlementWhyHere'
import { graphAwareSettlementHook, rewriteFourthSentence } from './graphAwareSettlementHook'
import { graphAwarePhenomenonNote } from './graphAwarePhenomenonNote'
import { fact } from '../index'

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
  const flags = input.options.graphAware ?? {}
  const tone: GeneratorTone = input.options.tone ?? 'balanced'
  const rng = input.rng.fork('graph-prose')
  const settlements = input.settlements.map(s => reshapeSettlement(s, input.relationshipGraph, flags, rng, tone))
  const phenomena = flags.phenomenonNote
    ? input.phenomena.map(p => reshapePhenomenon(p, input.relationshipGraph, rng))
    : input.phenomena

  return { settlements, phenomena }
}

function reshapeSettlement(
  settlement: Settlement,
  graph: SystemRelationshipGraph,
  flags: NonNullable<GenerationOptions['graphAware']>,
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
  if (flags.settlementHookSynthesis) {
    const replacement = graphAwareSettlementHook(updated, graph)
    if (replacement !== null) {
      const newHook = rewriteFourthSentence(updated.tagHook.value, replacement)
      if (newHook !== updated.tagHook.value) {
        updated = {
          ...updated,
          tagHook: fact(newHook, 'inferred', 'Graph-aware reshape from settlementHookSynthesis'),
        }
      }
    }
  }
  return updated
}

function reshapePhenomenon(
  phenomenon: SystemPhenomenon,
  graph: SystemRelationshipGraph,
  rng: SeededRng,
): SystemPhenomenon {
  const newNote = graphAwarePhenomenonNote(phenomenon, graph, rng)
  if (newNote === null) return phenomenon
  return {
    ...phenomenon,
    note: fact(newNote, 'inferred', 'Graph-aware reshape from phenomenonNote'),
  }
}
