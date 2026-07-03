import type { GeneratorTone } from '../../../../types'
import type { SeededRng } from '../../rng'
import type { EntityKind, EntityRef } from '../types'
import type { Conflict, ConflictTemperature } from '../../conflicts/types'
import { articleizeNounPhrase } from './slotResolver'
import { VariantDeck, getOrCreateDeck } from './variantDeck'

export type Beat = 'pressure' | 'parties' | 'temperature' | 'complication' | 'sign'

export type ConflictDeckMap = Map<ReadonlyArray<string>, VariantDeck<string>>

export const GRAMMARS: Record<GeneratorTone, readonly (readonly Beat[])[]> = {
  balanced: [
    ['pressure', 'parties', 'sign'],
    ['parties', 'temperature', 'complication', 'sign'],
    ['sign', 'parties', 'pressure'],
    ['parties', 'complication', 'sign'],
  ],
  cinematic: [
    ['sign', 'parties', 'temperature'],
    ['parties', 'pressure', 'complication', 'sign'],
    ['temperature', 'parties', 'sign'],
  ],
  astronomy: [
    ['pressure', 'parties', 'complication'],
    ['parties', 'pressure', 'sign'],
    ['pressure', 'temperature', 'parties', 'sign'],
  ],
}

interface TonePools {
  pressure: readonly string[]
  parties2: readonly string[]
  parties3: readonly string[]
  complication: readonly string[]
  temperature: Record<ConflictTemperature, readonly string[]>
}

export const BEAT_POOLS: Record<GeneratorTone, TonePools> = {
  balanced: {
    pressure: [
      'The pressure underneath is simple: {pressure}.',
      'Strip away the filings and the cause is plain — {pressure}.',
      'It comes down to arithmetic: {pressure}.',
      'Nobody disputes the root of it: {pressure}.',
    ],
    parties2: [
      '{aggressor} presses for {aggressorStake}; {defender} stands to lose {defenderStake}.',
      '{aggressor} wants {aggressorStake}, and {defender} is what stands in the way.',
      'On one side {aggressor}, after {aggressorStake}; on the other {defender}, holding {defenderStake}.',
      '{defender} holds {defenderStake}, and {aggressor} has decided that arrangement is negotiable.',
    ],
    parties3: [
      '{aggressor} presses, {defender} holds, and {bystander} pays for both: {bystanderStake}.',
      '{aggressor} wants {aggressorStake}; {defender} guards {defenderStake}; {bystander} gets {bystanderStake}.',
      'Neither {aggressor} nor {defender} will blink first, and {bystander} absorbs the difference — {bystanderStake}.',
      'The principals are {aggressor} and {defender}; the casualty ledger, so far, is kept at {bystander}.',
    ],
    complication: [
      'Underneath it runs a complication nobody prices openly: {secret}.',
      'And there is the part no one says at the negotiating table: {secret}.',
      'One fact would reshuffle every position if it surfaced: {secret}.',
      'The dispute has a second floor: {secret}.',
    ],
    temperature: {
      simmering: [
        'For now it stays procedural — filings, audits, and schedules that shave each other thinner.',
        'Nothing has broken yet; everything is being measured for it.',
        'The dispute runs at a simmer, and simmers out here have a way of finding fuel.',
      ],
      open: [
        'It is open now: escorts on the docks, and prices that assume worse.',
        'The pretense ended a season ago; both sides operate as if the other reads their manifests.',
        'This one is no longer cold, and everyone routing through has repriced accordingly.',
      ],
      aftermath: [
        'The worst already happened; what runs now is the accounting.',
        'This is the after — salvage, levies, and versions of the story being fitted for the record.',
        'The shooting part is over; the settling of who owes whom for it may outlast the survivors.',
      ],
      frozen: [
        'And yet nothing moves, because {frozenReason}.',
        'The whole thing holds perfectly still — {frozenReason} — and stillness has become the local form of peace.',
        'It should have gone hot years ago; it has not, because {frozenReason}.',
      ],
    },
  },
  cinematic: {
    pressure: [
      'Underneath the flags and the filings, the truth is a blade: {pressure}.',
      'Ask anyone in a dock bar what feeds it and they will tell you straight — {pressure}.',
      'The cause is old and simple and hungry: {pressure}.',
      'It was always going to come to this, because {pressure}.',
    ],
    parties2: [
      '{aggressor} circles {defender} the way debt circles a harvest.',
      '{aggressor} came for {aggressorStake}; what {defender} has left to lose is {defenderStake}.',
      '{defender} built something worth taking, and {aggressor} does the taking in this system.',
      'Two names on every manifest and every curse: {aggressor}, {defender}.',
    ],
    parties3: [
      '{aggressor} sharpens, {defender} braces, and {bystander} learns to sleep in a pressure suit.',
      'The fight belongs to {aggressor} and {defender}; the bleeding is done at {bystander}.',
      '{aggressor} wants {aggressorStake}. {defender} wants tomorrow. {bystander} wants the freight surcharge to stop climbing.',
      'When {aggressor} and {defender} finally close, it will be {bystander} standing between them, holding {bystanderStake}.',
    ],
    complication: [
      'And buried under all of it, patient as ice: {secret}.',
      'There is a rot in the keel of this quarrel — {secret} — and both hulls creak with it.',
      'Somebody in this fight is lying about the ground rules: {secret}.',
      'The thing that ends this, whenever it surfaces, is already known to someone: {secret}.',
    ],
    temperature: {
      simmering: [
        'For now the knives stay sheathed, and the sheaths get oiled nightly.',
        'It has not gone loud yet; the quiet is the expensive kind.',
        'The fuse is lit at both ends and burning politely.',
      ],
      open: [
        'It is loud now — escort guns, night transfers, and funerals with honor guards.',
        'The war is on, whatever the bulletins call it.',
        'Nobody pretends anymore; the boundary lines get repainted in daylight.',
      ],
      aftermath: [
        'The fire is out, and everyone is still counting what it took.',
        'What is left is wreckage with paperwork attached.',
        'The battle ended; the grudge got promoted.',
      ],
      frozen: [
        'And it all hangs there, unfired, because {frozenReason}.',
        'The trigger stays uncrossed for one reason only: {frozenReason}.',
        'Everyone is armed, everyone is ready, nobody moves — {frozenReason}.',
      ],
    },
  },
  astronomy: {
    pressure: [
      'The forcing term is well characterized: {pressure}.',
      'Reduced to observables, the driver is this — {pressure}.',
      'Every model of the dispute shares one input: {pressure}.',
      'The boundary condition nobody can renegotiate: {pressure}.',
    ],
    parties2: [
      'The principals are {aggressor}, seeking {aggressorStake}, and {defender}, holding {defenderStake}.',
      '{aggressor} and {defender} occupy incompatible claims, and the overlap region is where the incidents cluster.',
      'In the record, {aggressor} appears as claimant and {defender} as incumbent; the field data is less tidy.',
      '{aggressor} applies pressure along every administrative axis; {defender} damps what it can.',
    ],
    parties3: [
      'Three bodies define this problem: {aggressor}, {defender}, and {bystander}, which absorbs the perturbations.',
      'The principals are {aggressor} and {defender}; the measurable damage accumulates at {bystander}.',
      '{aggressor} versus {defender} is the headline; the secular decline in conditions at {bystander} is the data.',
      'Instruments at {bystander} record the dispute between {aggressor} and {defender} as a rising baseline of scarcity: {bystanderStake}.',
    ],
    complication: [
      'The residual no published account explains: {secret}.',
      'One term in the system does not close: {secret}.',
      'The archived record carries an anomaly both sides decline to discuss: {secret}.',
      'Any honest error analysis ends at the same unmodeled input: {secret}.',
    ],
    temperature: {
      simmering: [
        'Activity remains sub-threshold — elevated filings, no confirmed incidents.',
        'The conflict index trends upward within nominal bounds, for now.',
        'All indicators read pre-critical, and have for longer than the models predicted they could.',
      ],
      open: [
        'The dispute has crossed into open phase; incident rates are no longer deniable statistics.',
        'Escort tonnage and insurance premiums both confirm what the bulletins understate: this is active.',
        'The system has entered sustained-conflict operations by every measurable proxy.',
      ],
      aftermath: [
        'The event itself has passed; the observables now are debris, levies, and revised histories.',
        'What instruments record today is decay products — of infrastructure, and of accounts.',
        'The active phase ended; its signature persists in every dataset the system produces.',
      ],
      frozen: [
        'The configuration is metastable: fully armed, fully static, because {frozenReason}.',
        'Equilibrium holds for a documented reason — {frozenReason} — and no model prices its failure kindly.',
        'The standoff persists in steady state; the stabilizing term is {frozenReason}.',
      ],
    },
  },
}

const NOUN_PHRASE_KINDS: ReadonlySet<EntityKind> = new Set(['phenomenon', 'guHazard', 'guResource'])

function formatEntityName(ref: EntityRef): string {
  if (NOUN_PHRASE_KINDS.has(ref.kind)) return articleizeNounPhrase(ref.displayName)
  return ref.displayName
}

function partyName(conflict: Conflict, role: 'aggressor' | 'defender' | 'bystander'): string {
  const ref = conflict.parties.find(p => p.role === role)?.ref
  return ref ? formatEntityName(ref) : ''
}

function partyStake(conflict: Conflict, role: 'aggressor' | 'defender' | 'bystander'): string {
  return conflict.parties.find(p => p.role === role)?.stake ?? ''
}

function bindConflictSlots(text: string, conflict: Conflict): string {
  return text
    .replaceAll('{aggressor}', partyName(conflict, 'aggressor'))
    .replaceAll('{defender}', partyName(conflict, 'defender'))
    .replaceAll('{bystander}', partyName(conflict, 'bystander'))
    .replaceAll('{aggressorStake}', partyStake(conflict, 'aggressor'))
    .replaceAll('{defenderStake}', partyStake(conflict, 'defender'))
    .replaceAll('{bystanderStake}', partyStake(conflict, 'bystander'))
    .replaceAll('{stake}', conflict.stakeRef ? formatEntityName(conflict.stakeRef) : 'the prize')
    .replaceAll('{pressure}', conflict.pressure)
    .replaceAll('{secret}', (conflict.complication?.text ?? '').replace(/\.$/, ''))
    .replaceAll('{frozenReason}', conflict.frozenReason ?? '')
}

function capitalize(sentence: string): string {
  if (sentence.length === 0) return sentence
  return sentence[0].toUpperCase() + sentence.slice(1)
}

function drawFromPool(pool: readonly string[], decks: ConflictDeckMap, rng: SeededRng): string {
  return getOrCreateDeck(pool, decks, rng).draw()
}

function renderBeat(
  beat: Beat,
  conflict: Conflict,
  pools: TonePools,
  rng: SeededRng,
  decks: ConflictDeckMap,
): string | null {
  switch (beat) {
    case 'pressure':
      return drawFromPool(pools.pressure, decks, rng)
    case 'parties':
      return partyName(conflict, 'bystander') !== ''
        ? drawFromPool(pools.parties3, decks, rng)
        : drawFromPool(pools.parties2, decks, rng)
    case 'temperature':
      return drawFromPool(pools.temperature[conflict.temperature], decks, rng)
    case 'complication':
      if (!conflict.complication) return null
      return drawFromPool(pools.complication, decks, rng)
    case 'sign':
      return conflict.visibleSign
  }
}

export function renderConflictNarrative(
  conflict: Conflict,
  tone: GeneratorTone,
  rng: SeededRng,
  decks: ConflictDeckMap = new Map(),
): string[] {
  const grammars = GRAMMARS[tone]
  const grammar = grammars[Math.floor(rng.next() * grammars.length)]
  const pools = BEAT_POOLS[tone]
  const sentences: string[] = []
  for (const beat of grammar) {
    const template = renderBeat(beat, conflict, pools, rng, decks)
    if (template === null) continue
    sentences.push(capitalize(bindConflictSlots(template, conflict)))
  }
  return sentences
}
