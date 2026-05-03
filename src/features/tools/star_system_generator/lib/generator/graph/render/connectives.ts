import type { EdgeType } from '../types'

type Pair = `${EdgeType}->${EdgeType}`

const CONNECTIVES: Partial<Record<Pair, string>> = {
  'CONTESTS->DESTABILIZES': 'Meanwhile, ',
  'CONTROLS->CONTESTS': 'But ',
  'DEPENDS_ON->DESTABILIZES': 'And ',
  'HOSTS->DEPENDS_ON': 'There, ',
  'CONTESTS->CONTRADICTS': 'Privately, ',
  'DESTABILIZES->CONTESTS': 'And in turn, ',
}

export function connectiveFor(
  prev: EdgeType | undefined,
  next: EdgeType,
): string {
  if (prev === undefined) return ''
  return CONNECTIVES[`${prev}->${next}`] ?? ''
}
