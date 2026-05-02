// Barrel for the narrative-graph module. Public surface is added per task in
// the Phase 1 plan as each source file lands. Use named re-exports
// (e.g. `export { foo } from './module'`), not `export * from`.
export type {
  EntityRef, EntityKind, EntityLayer, EdgeType, EdgeEra, EdgeVisibility,
  RelationshipEdge, SystemRelationshipGraph,
} from './types'
export { buildEntityInventory, type EntityInventoryInput } from './entities'
export { buildRelationshipGraph } from './buildRelationshipGraph'
