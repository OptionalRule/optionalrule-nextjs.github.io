import type { SeededRng } from '../rng'
import type {
  Settlement, SystemPhenomenon, GenerationOptions,
} from '../../../types'
import type { SystemRelationshipGraph } from '../graph'

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
  _graph: SystemRelationshipGraph,
  _flags: NonNullable<GenerationOptions['graphAware']>,
  _rng: SeededRng,
): Settlement {
  return settlement
}

function reshapePhenomenon(
  phenomenon: SystemPhenomenon,
  _graph: SystemRelationshipGraph,
  _rng: SeededRng,
): SystemPhenomenon {
  return phenomenon
}
