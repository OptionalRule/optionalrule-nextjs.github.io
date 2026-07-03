import type { SeededRng } from '../rng'
import type { GeneratorTone, SettlementHabitationPattern } from '../../../types'
import { sentenceStart, sentenceFragment, definiteNounPhrase, siteLeadNoun } from './helpers'
import { crisisPressureSentence } from './crisisShaping'
import { settlementTagPairHooks, settlementTagPressures } from '../data/settlements'

export const CLOSING_POOLS: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'Control of {function} decides who has leverage.',
    'Whoever runs {function} sets the terms here.',
    'Every dispute here ends at {function}.',
    'Whatever the system fights over next, {function} is where it lands.',
    'The ledgers all balance except where {function} is concerned.',
    'Newcomers learn fast that {function} is the only vote that counts.',
  ],
  cinematic: [
    'Hold {function} and you hold every throat on the site.',
    'People here pray in two directions: home, and {function}.',
    'The knives stay folded only as long as {function} keeps running.',
    'Everything else is theater; {function} is the crown.',
    'Cross whoever keeps {function} and learn how small this place really is.',
    'When it finally breaks, it will break at {function}.',
  ],
  astronomy: [
    'Every operational dependency on the site resolves through {function}.',
    'The single point of failure — administrative and physical — is {function}.',
    'Site telemetry, staffing, and politics all key on {function}.',
    'Remove {function} from the model and nothing else about the site closes.',
    'The utilization curves make it plain: {function} is the binding constraint.',
    'Every audit finding, sooner or later, cites {function}.',
  ],
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
    tone?: GeneratorTone
  }
): string {
  const base = settlementTagHook(rng, obviousTag, deeperTag)
  const pressure = (() => {
    const site = siteLeadNoun(context.encounterSites[0]).toLowerCase()
    switch (context.habitationPattern) {
      case 'Automated':
        return `Automation failure turns ${site} into the key scene.`
      case 'Abandoned':
        return `Salvage pressure centers on ${site}.`
      case 'Distributed swarm':
        return `Coordination drift across the swarm makes ${site} the choke point everyone fights over.`
      case 'Ring station':
        return `Ring-rotation politics — outer-rim labor against axis governance — tip into open conflict at ${site}.`
      case "O'Neill cylinder":
        return `Centripetal-axis politics divide the cylinder, and ${site} is where the floor-and-roof factions actually meet.`
      case 'Modular island station':
        return `The shuttle schedule between modules is the real political weapon, and ${site} is the next bottleneck.`
      case 'Hub complex':
        return `What the main reach decides about ${site} the satellite outposts will refuse to accept by morning.`
      case 'Hollow asteroid':
        return `Spin-axis vibrations and rock-failure rumors converge on ${site}.`
      case 'Belt cluster':
        return `The cluster's tether-bridges are fraying, and ${site} is the chokepoint for everyone trying to cross.`
      case 'Underground city':
        return `Surface signals never reach ${site}; whatever happens there stays buried.`
      case 'Sealed arcology':
        return `Internal-weather faults make ${site} the lung that keeps everyone alive.`
      case 'Sky platform':
        return `One bad updraft drops ${site} into the deck below; everyone here lives one storm from rebuild.`
      case 'Tethered tower':
        return `Tether-tension reports are political theater here — ${site} is where the bracing shows the truth.`
      case 'Drift colony':
        return `There is no gate, no route, and no rescue lane — ${site} is the only place to corner anyone.`
      case 'Generation ship':
        return `Decades of mid-voyage politics converge on ${site} the moment outsiders board.`
      default:
        if (context.guIntensity.includes('fracture') || context.guIntensity.includes('shear')) {
          return crisisPressureSentence(context.crisis, 'makes the GU work impossible to treat as routine')
        }
        return crisisPressureSentence(context.crisis, `keeps ${context.siteCategory.toLowerCase()} politics under stress`)
    }
  })()
  const secret = sentenceFragment(context.hiddenTruth)
  const functionPressure = definiteNounPhrase(context.settlementFunction)
  const pool = CLOSING_POOLS[context.tone ?? 'balanced']
  const closing = pool[rng.int(0, pool.length - 1)].replaceAll('{function}', functionPressure)

  return `${sentenceStart(base)} ${pressure} Privately, ${secret}. ${closing}`
}
