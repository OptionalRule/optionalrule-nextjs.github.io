import type { SeededRng } from '../rng'
import type {
  Settlement, SystemPhenomenon, GenerationOptions,
} from '../../../types'
import type { SystemRelationshipGraph } from '../graph'
import { graphAwareSettlementWhyHere } from './graphAwareSettlementWhyHere'
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
  const noFlags =
    !flags.settlementWhyHere &&
    !flags.phenomenonNote &&
    !flags.settlementHookSynthesis
  if (noFlags) {
    return { settlements: input.settlements, phenomena: input.phenomena }
  }

  const rng = input.rng.fork('graph-prose')
  const settlements = (flags.settlementWhyHere || flags.settlementHookSynthesis)
    ? input.settlements.map(s => reshapeSettlement(s, input.relationshipGraph, flags, rng))
    : input.settlements
  const phenomena = flags.phenomenonNote
    ? input.phenomena.map(p => reshapePhenomenon(p, input.relationshipGraph, rng))
    : input.phenomena

  return { settlements, phenomena }
}

function reshapeSettlement(
  settlement: Settlement,
  graph: SystemRelationshipGraph,
  flags: NonNullable<GenerationOptions['graphAware']>,
  _rng: SeededRng,
): Settlement {
  let updated = settlement
  if (flags.settlementWhyHere) {
    const newWhyHere = graphAwareSettlementWhyHere(updated, graph)
    if (newWhyHere !== null) {
      updated = {
        ...updated,
        whyHere: fact(newWhyHere, 'inferred', 'Graph-aware reshape from settlementWhyHere'),
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
