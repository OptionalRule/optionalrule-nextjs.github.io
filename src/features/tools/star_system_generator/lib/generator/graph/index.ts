// Barrel for the narrative-graph module. Public surface is added per task in
// the Phase 1 plan as each source file lands. Use named re-exports
// (e.g. `export { foo } from './module'`), not `export * from`.
export type {
  EntityRef, EntityKind, EntityLayer, EdgeType, EdgeEra, EdgeVisibility,
  RelationshipEdge, SystemRelationshipGraph,
} from './types'
export { EDGE_TYPES } from './types'
export type { SystemStoryOutput } from './types'
export { renderSystemStory } from './render'
export { buildEntityInventory, type EntityInventoryInput } from './entities'
export { buildRelationshipGraph } from './buildRelationshipGraph'
export { scoreCandidates, selectEdges, isNamedEntity } from './score'
export type { ScoredCandidate, ScoreBonuses, SelectionOptions, SelectionResult } from './score'
export { buildEdgeIndexes } from './buildIndexes'
export type { EdgeIndexes } from './buildIndexes'
export { allRules } from './rules'
export type { EdgeRule, RuleMatch, BuildCtx } from './rules'
export { stableHashString, mintEdgeId, CONFIDENCE_RANK, leastConfident, buildFactIndexes } from './rules'
export { attachHistoricalEvents, HISTORICAL_ELIGIBLE_TYPES } from './history'
export { ERAS, pickEra } from './data/eras'
export type { Era } from './data/eras'
