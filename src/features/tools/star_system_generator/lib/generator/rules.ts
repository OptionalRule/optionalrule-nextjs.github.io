import type { GeneratorVersion } from '../../types'
import {
  classifyNarrativeDomainsV2,
  classifyNarrativeDomainsV3,
  type NarrativeDomainClassifier,
} from './narrative/domainClassifier'

export interface GeneratorRules {
  version: GeneratorVersion
  classifyNarrativeDomains: NarrativeDomainClassifier
}

const RULES_BY_VERSION: { readonly [V in GeneratorVersion]: GeneratorRules & { version: V } } = {
  2: { version: 2, classifyNarrativeDomains: classifyNarrativeDomainsV2 },
  3: { version: 3, classifyNarrativeDomains: classifyNarrativeDomainsV3 },
}

export const GENERATOR_VERSION: GeneratorVersion = 3

export const SUPPORTED_GENERATOR_VERSIONS: readonly GeneratorVersion[] = Object.values(RULES_BY_VERSION).map(
  (rules) => rules.version,
)

export function generatorRules(version: GeneratorVersion): GeneratorRules {
  return Object.hasOwn(RULES_BY_VERSION, version) ? RULES_BY_VERSION[version] : RULES_BY_VERSION[GENERATOR_VERSION]
}
