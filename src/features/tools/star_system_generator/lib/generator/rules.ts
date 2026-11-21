import type { GeneratorVersion } from '../../types'
import { HOOK_SELECTION_PROFILE_V2, HOOK_SELECTION_PROFILE_V3, type HookSelectionProfile } from './hooks/profile'
import {
  classifyNarrativeDomainsV2,
  classifyNarrativeDomainsV3,
  type NarrativeDomainClassifier,
} from './narrative/domainClassifier'

export interface GeneratorRules {
  version: GeneratorVersion
  classifyNarrativeDomains: NarrativeDomainClassifier
  hookSelectionProfile: HookSelectionProfile
}

const RULES_BY_VERSION: { readonly [V in GeneratorVersion]: GeneratorRules & { version: V } } = {
  2: { version: 2, classifyNarrativeDomains: classifyNarrativeDomainsV2, hookSelectionProfile: HOOK_SELECTION_PROFILE_V2 },
  3: { version: 3, classifyNarrativeDomains: classifyNarrativeDomainsV3, hookSelectionProfile: HOOK_SELECTION_PROFILE_V3 },
}

export const GENERATOR_VERSION: GeneratorVersion = 3

export const SUPPORTED_GENERATOR_VERSIONS: readonly GeneratorVersion[] = Object.values(RULES_BY_VERSION).map(
  (rules) => rules.version,
)

export function generatorRules(version: GeneratorVersion): GeneratorRules {
  return Object.hasOwn(RULES_BY_VERSION, version) ? RULES_BY_VERSION[version] : RULES_BY_VERSION[GENERATOR_VERSION]
}
