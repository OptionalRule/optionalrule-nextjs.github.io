import type {
  Fact,
  GenerationOptions,
  GuOverlay,
  HumanRemnant,
  NarrativeFact,
  OrbitingBody,
  Reachability,
  Settlement,
  Star,
  StellarCompanion,
  SystemArchitecture,
  SystemHooks,
  SystemPhenomenon,
} from '../../../types'
import { buildConflicts } from '../conflicts'
import { buildRelationshipGraph, renderSystemStory } from '../graph'
import type { SystemRelationshipGraph, SystemStoryOutput } from '../graph'
import { selectSystemHooks } from '../hooks'
import { graphAwareReshape } from '../prose'
import type { SeededRng } from '../rng'
import { buildNarrativeFacts } from './narrativeFacts'

export interface NarrativeStageInput {
  options: GenerationOptions
  systemName: Fact<string>
  primary: Star
  companions: StellarCompanion[]
  reachability: Reachability
  architecture: SystemArchitecture
  bodies: OrbitingBody[]
  guOverlay: GuOverlay
  settlements: Settlement[]
  ruins: HumanRemnant[]
  phenomena: SystemPhenomenon[]
}

export interface NarrativeStageOutput {
  narrativeFacts: NarrativeFact[]
  relationshipGraph: SystemRelationshipGraph
  systemStory: SystemStoryOutput
  hooks: SystemHooks
  settlements: Settlement[]
  phenomena: SystemPhenomenon[]
}

export function runNarrativeStage(input: NarrativeStageInput, rootRng: SeededRng): NarrativeStageOutput {
  const { options, primary, companions, reachability, bodies, guOverlay, settlements, ruins, phenomena } = input
  const narrativeFacts = buildNarrativeFacts({
    options,
    systemName: input.systemName,
    primary,
    companions,
    reachability,
    architectureName: input.architecture.name.value,
    bodies,
    guOverlay,
    settlements,
    ruins,
    phenomena,
    factionRng: rootRng.fork('factions'),
  })
  const relationshipGraph = buildRelationshipGraph(
    {
      systemName: input.systemName.value,
      primary: { spectralType: primary.spectralType },
      companions,
      bodies,
      settlements: settlements.map(s => ({
        id: s.id,
        name: s.name,
        bodyId: s.bodyId,
        presence: { guValue: s.presence.guValue, hazard: s.presence.hazard },
      })),
      guOverlay,
      phenomena,
      ruins: ruins.map(r => ({ id: r.id, remnantType: r.remnantType, location: r.location })),
      narrativeFacts,
    },
    { tone: options.tone, gu: options.gu, distribution: options.distribution, settlements: options.settlements },
    narrativeFacts,
    rootRng.fork('graph'),
  )
  const conflicts = buildConflicts(
    {
      graph: relationshipGraph,
      settlements,
      options: { tone: options.tone, gu: options.gu, distribution: options.distribution, settlements: options.settlements },
    },
    rootRng.fork('conflicts'),
  )
  const reshaped = graphAwareReshape({
    settlements,
    phenomena,
    relationshipGraph,
    options,
    rng: rootRng,
  })
  const systemStory = renderSystemStory(
    relationshipGraph,
    rootRng.fork('story'),
    {
      tone: options.tone,
      gu: options.gu,
      distribution: options.distribution,
      settlements: options.settlements,
    },
    conflicts,
  )
  const hooks = selectSystemHooks({
    rng: rootRng.fork('hooks'),
    context: {
      guOverlay,
      settlements: reshaped.settlements,
      ruins,
      phenomena: reshaped.phenomena,
      architecture: input.architecture,
      reachability,
      conflicts,
      entities: relationshipGraph.entities,
    },
  })

  return {
    narrativeFacts,
    relationshipGraph,
    systemStory,
    hooks,
    settlements: reshaped.settlements,
    phenomena: reshaped.phenomena,
  }
}
