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

export type SettlementTagHookTemplates = readonly string[]

export const SETTLEMENT_TAG_HOOK_TEMPLATES_V2 = [
  '{obviousTag} is what visitors notice first; {deeperText}',
  'Outsiders call it {obviousTag}, but the local pressure is sharper: {deeperText}',
  '{obviousTag} is the surface story, but {deeperTag} shows who benefits from the tension: {deeperText}',
  'The public tag is {obviousTag}; the private trouble is {deeperTag}, because {deeperText}',
] as const satisfies SettlementTagHookTemplates

export const SETTLEMENT_TAG_HOOK_TEMPLATES_V3 = [
  ...SETTLEMENT_TAG_HOOK_TEMPLATES_V2,
  'Ask about {obviousTag} and you get the brochure; ask about {deeperTag} and you learn that {deeperText}',
  'Every manifest lists {obviousTag}, but crews who stay long enough learn about {deeperTag}: {deeperText}',
  'Under the {obviousTag} reputation runs a harder current called {deeperTag}, where {deeperText}',
  'Locals will talk about {obviousTag} all night, but mention {deeperTag} and the room goes quiet: {deeperText}',
  '{deeperTag} sits under {obviousTag} like a cracked hull seal: {deeperText}',
  'The trade guides file this place under {obviousTag}; the people who live here file it under {deeperTag}: {deeperText}',
  'Nobody here denies {obviousTag}, but the real arguments are about {deeperTag}, since {deeperText}',
  'Strip away {obviousTag} and what remains is {deeperTag}: {deeperText}',
  '{obviousTag} explains how the place looks; {deeperTag} explains how it works, and the short version is that {deeperText}',
  'If {obviousTag} is what brings ships in, {deeperTag} is what crews talk about on the way out: {deeperText}',
  'Any broker will mention {obviousTag}; only a local will warn you about {deeperTag}, and the warning is blunt: {deeperText}',
  'The registry says {obviousTag}, but the incident logs keep circling {deeperTag}: {deeperText}',
] as const satisfies SettlementTagHookTemplates

const TAG_HOOK_SLOT = /\{(obviousTag|deeperTag|deeperText)\}/g

export function fillSettlementTagHookTemplate(
  template: string,
  slots: { obviousTag: string; deeperTag: string; deeperText: string },
): string {
  return template.replace(TAG_HOOK_SLOT, (_match, key: keyof typeof slots) => slots[key])
}

export function settlementTagHook(
  rng: SeededRng,
  obviousTag: string,
  deeperTag: string,
  templates: SettlementTagHookTemplates,
): string {
  const exactPair = `${obviousTag} + ${deeperTag}`
  if (settlementTagPairHooks[exactPair]) return settlementTagPairHooks[exactPair]
  const reversePair = `${deeperTag} + ${obviousTag}`
  if (settlementTagPairHooks[reversePair]) return settlementTagPairHooks[reversePair]

  const deeperText = settlementTagPressures[deeperTag] ?? `${deeperTag.toLowerCase()} is the deeper pressure driving the site.`
  const template = templates[rng.int(1, templates.length) - 1]
  return fillSettlementTagHookTemplate(template, { obviousTag, deeperTag, deeperText })
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
    tagHookTemplates: SettlementTagHookTemplates
  }
): string {
  const base = settlementTagHook(rng, obviousTag, deeperTag, context.tagHookTemplates)
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
