import type { EdgeRule } from './ruleTypes'
import { hostsBodySettlementRule } from './hostsRules'

export const allRules: ReadonlyArray<EdgeRule> = [
  hostsBodySettlementRule,
].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

export type { EdgeRule, RuleMatch, BuildCtx } from './ruleTypes'
export { stableHashString, mintEdgeId, CONFIDENCE_RANK, leastConfident, buildFactIndexes } from './ruleTypes'
