import type { GeneratorTone } from '../../../../types'
import type { EdgeType } from '../types'

type Pair = `${EdgeType}->${EdgeType}`

const BALANCED_CONNECTIVES: Partial<Record<Pair, string>> = {
  'CONTESTS->DESTABILIZES': 'Meanwhile, ',
  'CONTROLS->CONTESTS': 'But ',
  'DEPENDS_ON->DESTABILIZES': 'And ',
  'HOSTS->DEPENDS_ON': 'There, ',
  'CONTESTS->CONTRADICTS': 'Privately, ',
  'DESTABILIZES->CONTESTS': 'And in turn, ',

  'HOSTS->CONTROLS': 'Above ground, ',
  'CONTROLS->DEPENDS_ON': 'Underneath, ',
  'DEPENDS_ON->CONTROLS': 'And ',

  'CONTESTS->SUPPRESSES': 'Quietly, ',
  'DESTABILIZES->SUPPRESSES': 'In the meantime, ',
  'SUPPRESSES->CONTESTS': 'Predictably, ',

  'CONTRADICTS->WITNESSES': 'And yet, ',
  'WITNESSES->CONTRADICTS': 'Even so, ',
  'CONTRADICTS->CONTRADICTS': 'On another front, ',
}

const CINEMATIC_CONNECTIVES: Partial<Record<Pair, string>> = {
  'CONTESTS->DESTABILIZES': 'And then, ',
  'CONTROLS->CONTESTS': 'Until, ',
  'DEPENDS_ON->DESTABILIZES': 'And worse, ',
  'CONTESTS->CONTRADICTS': 'In private, ',
  'DESTABILIZES->CONTESTS': 'So of course, ',
  'CONTESTS->SUPPRESSES': 'Behind closed doors, ',
  'DESTABILIZES->SUPPRESSES': 'And under the noise, ',
  'CONTROLS->DEPENDS_ON': 'Beneath all of it, ',
}

const ASTRONOMY_CONNECTIVES: Partial<Record<Pair, string>> = {
  'CONTESTS->DESTABILIZES': 'Concurrently, ',
  'CONTROLS->CONTESTS': 'However, ',
  'DEPENDS_ON->DESTABILIZES': 'Furthermore, ',
  'CONTESTS->CONTRADICTS': 'In the records, ',
  'DESTABILIZES->CONTESTS': 'In response, ',
  'CONTESTS->SUPPRESSES': 'Per the filings, ',
  'DESTABILIZES->SUPPRESSES': 'Across the same interval, ',
  'CONTROLS->DEPENDS_ON': 'Per the layered survey, ',
}

const CONNECTIVES_BY_TONE: Record<GeneratorTone, Partial<Record<Pair, string>>> = {
  balanced: BALANCED_CONNECTIVES,
  cinematic: CINEMATIC_CONNECTIVES,
  astronomy: ASTRONOMY_CONNECTIVES,
}

export function connectiveFor(
  prev: EdgeType | undefined,
  next: EdgeType,
  tone: GeneratorTone = 'balanced',
): string {
  if (prev === undefined) return ''
  const key = `${prev}->${next}` as Pair
  return CONNECTIVES_BY_TONE[tone][key]
    ?? BALANCED_CONNECTIVES[key]
    ?? ''
}
