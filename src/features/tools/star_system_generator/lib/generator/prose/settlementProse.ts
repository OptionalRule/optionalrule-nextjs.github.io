import type { SeededRng } from '../rng'
import type { SettlementHabitationPattern } from '../../../types'
import { sentenceStart, sentenceFragment, definiteNounPhrase } from './helpers'
import { crisisPressureSentence } from './crisisShaping'
import { settlementTagPairHooks, settlementTagPressures } from '../data/settlements'

export function settlementTagHook(rng: SeededRng, obviousTag: string, deeperTag: string): string {
  const exactPair = `${obviousTag} + ${deeperTag}`
  if (settlementTagPairHooks[exactPair]) return settlementTagPairHooks[exactPair]
  const reversePair = `${deeperTag} + ${obviousTag}`
  if (settlementTagPairHooks[reversePair]) return settlementTagPairHooks[reversePair]

  const deeperText = settlementTagPressures[deeperTag] ?? `${deeperTag.toLowerCase()} is the deeper pressure driving the site.`
  const template = rng.int(1, 4)
  if (template === 1) return `${obviousTag} is what visitors notice first; ${deeperText}`
  if (template === 2) return `Outsiders call it ${obviousTag}, but the local pressure is sharper: ${deeperText}`
  if (template === 3) return `${obviousTag} is the surface story, but ${deeperTag} shows who benefits from the tension: ${deeperText}`
  return `The public tag is ${obviousTag}; the private trouble is ${deeperTag}, because ${deeperText}`
}

export function settlementHookSynthesis(
  rng: SeededRng,
  obviousTag: string,
  deeperTag: string,
  context: {
    habitationPattern: SettlementHabitationPattern
    siteCategory: string
    settlementFunction: string
    condition: string
    crisis: string
    hiddenTruth: string
    encounterSites: string[]
    guIntensity: string
  }
): string {
  const base = settlementTagHook(rng, obviousTag, deeperTag)
  const pressure =
    context.habitationPattern === 'Automated' ? `Automation failure turns ${context.encounterSites[0].toLowerCase()} into the key scene.` :
    context.habitationPattern === 'Abandoned' ? `Salvage pressure centers on ${context.encounterSites[0].toLowerCase()}.` :
    context.guIntensity.includes('fracture') || context.guIntensity.includes('shear') ? crisisPressureSentence(context.crisis, 'makes the GU work impossible to treat as routine') :
    crisisPressureSentence(context.crisis, `keeps ${context.siteCategory.toLowerCase()} politics under stress`)
  const secret = sentenceFragment(context.hiddenTruth)
  const functionPressure = definiteNounPhrase(context.settlementFunction)

  return `${sentenceStart(base)} ${pressure} Privately, ${secret}. Control of ${functionPressure} decides who has leverage.`
}
