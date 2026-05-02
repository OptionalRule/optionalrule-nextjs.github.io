import type { SeededRng } from '../rng'
import { sentenceStart, sentenceFragment, definiteNounPhrase } from './helpers'
import { crisisPressureSentence } from './crisisShaping'
import { settlementTagHook } from '..'

export function settlementHookSynthesis(
  rng: SeededRng,
  obviousTag: string,
  deeperTag: string,
  context: {
    scale: string
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
    context.scale === 'Automated only' ? `Automation failure turns ${context.encounterSites[0].toLowerCase()} into the key scene.` :
    context.scale === 'Abandoned' ? `Salvage pressure centers on ${context.encounterSites[0].toLowerCase()}.` :
    context.guIntensity.includes('fracture') || context.guIntensity.includes('shear') ? crisisPressureSentence(context.crisis, 'makes the GU work impossible to treat as routine') :
    crisisPressureSentence(context.crisis, `keeps ${context.siteCategory.toLowerCase()} politics under stress`)
  const secret = sentenceFragment(context.hiddenTruth)
  const functionPressure = definiteNounPhrase(context.settlementFunction)

  return `${sentenceStart(base)} ${pressure} Privately, ${secret}. Control of ${functionPressure} decides who has leverage.`
}
