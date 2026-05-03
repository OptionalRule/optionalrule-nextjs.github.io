import type { EdgeRule } from './ruleTypes'
import { hostsBodySettlementRule, hostsBodyRuinRule } from './hostsRules'
import {
  dependsOnViaFunctionRule,
  dependsOnViaCrisisRule,
  dependsOnViaPresenceRule,
} from './dependsOnRules'
import {
  contestsSharedDomainRule,
  contestsAuthorityRule,
} from './contestsRules'
import {
  controlsRouteAssetRule,
  controlsSettlementUniqueDomainRule,
} from './controlsRules'
import {
  destabilizesPhenomenonSettlementRule,
  destabilizesGuHazardSettlementRule,
} from './destabilizesRules'
import {
  suppressesGardenerInterdictionRule,
  suppressesAuthorityHiddenTruthRule,
} from './suppressesRules'

export const allRules: ReadonlyArray<EdgeRule> = [
  hostsBodySettlementRule,
  hostsBodyRuinRule,
  dependsOnViaFunctionRule,
  dependsOnViaCrisisRule,
  dependsOnViaPresenceRule,
  contestsSharedDomainRule,
  contestsAuthorityRule,
  controlsRouteAssetRule,
  controlsSettlementUniqueDomainRule,
  destabilizesPhenomenonSettlementRule,
  destabilizesGuHazardSettlementRule,
  suppressesGardenerInterdictionRule,
  suppressesAuthorityHiddenTruthRule,
].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

export type { EdgeRule, RuleMatch, BuildCtx } from './ruleTypes'
export { stableHashString, mintEdgeId, CONFIDENCE_RANK, leastConfident, buildFactIndexes } from './ruleTypes'
