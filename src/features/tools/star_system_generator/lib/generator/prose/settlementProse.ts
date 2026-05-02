import type { OrbitingBody } from '../../../types'
import type { SeededRng } from '../rng'
import { sentenceStart, sentenceFragment, definiteNounPhrase } from './helpers'
import { crisisPressureSentence } from './crisisShaping'
import { settlementTagPairHooks, settlementTagPressures } from '../data/settlements'
import type { scoreSettlementPresence, generateGuOverlay, generateReachability, SettlementAnchor } from '..'

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

export function settlementWhyHere(
  rng: SeededRng,
  body: OrbitingBody,
  presence: ReturnType<typeof scoreSettlementPresence>,
  guOverlay: ReturnType<typeof generateGuOverlay>,
  reachability: ReturnType<typeof generateReachability>,
  anchor: SettlementAnchor
): string {
  const reasons: string[] = []

  if (presence.resource >= 3) reasons.push(`resources are strong here, especially ${guOverlay.resource.value.toLowerCase()}`)
  else if (presence.resource >= 2) reasons.push('local materials, volatiles, or fuel justify permanent infrastructure')

  if (presence.access >= 3) reasons.push(`${reachability.className.value.toLowerCase()} access keeps traffic viable`)
  else if (presence.access >= 2) reasons.push('access is manageable for prepared crews')

  if (presence.strategic >= 3) reasons.push('the site controls a militarily or commercially important approach')
  else if (presence.strategic >= 2) reasons.push('the site watches a useful route or resource')

  if (presence.guValue >= 3) reasons.push('GU value is high enough to justify danger and secrecy')
  else if (presence.guValue >= 1) reasons.push('local metric signatures add research or extraction value')

  if (presence.habitability >= 2) reasons.push(`${body.name.value} offers unusually forgiving environmental support`)
  if (presence.hazard >= 3) reasons.push('hazards are severe, so the site exists because the payoff is worth the risk')
  else if (presence.hazard >= 1) reasons.push('hazards shape operations but do not prevent occupation')
  if (presence.legalHeat >= 2) reasons.push('legal or interdiction pressure explains the secrecy and tension')

  const selected = reasons.slice(0, 3)
  if (selected.length === 0) {
    selected.push(`${anchor.name} is the best available compromise between access, shelter, and useful work`)
  }

  const template = rng.int(1, 5)
  if (template === 1) return `${anchor.name}: ${selected.join('; ')}.`
  if (template === 2) return `Crews keep choosing ${anchor.name} because ${selected.join('; ')}.`
  if (template === 3) return `The case for ${anchor.name} is practical: ${selected.join('; ')}.`
  if (template === 4) return `${anchor.name} survives because ${selected.join('; ')}.`
  return `At ${anchor.name}, the settlement logic is ${selected.join('; ')}.`
}

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
