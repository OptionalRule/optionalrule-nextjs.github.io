import type { GlyphRegister, GlyphStatus } from './types'

export interface StatusVisual {
  color: string
  dashed: boolean
  showAutomatedRing: boolean
}

const HUMAN_STATUS: Record<GlyphStatus, StatusVisual> = {
  active: { color: '#f4b860', dashed: false, showAutomatedRing: false },
  abandoned: { color: '#7a8088', dashed: true, showAutomatedRing: false },
  automated: { color: '#5fc9b8', dashed: false, showAutomatedRing: true },
}

const REGISTER_BASE_COLOR: Record<Exclude<GlyphRegister, 'human'>, string> = {
  gate: '#b594ff',
  ruin: '#9aa3ad',
  phenomenon: '#ff7fb5',
  hazard: '#ff8a4a',
  gu: '#a884ff',
}

export function visualForRegister(
  register: GlyphRegister,
  status: GlyphStatus = 'active',
): StatusVisual {
  if (register === 'human') return HUMAN_STATUS[status]
  return { color: REGISTER_BASE_COLOR[register], dashed: false, showAutomatedRing: false }
}

export const STATUS_HUMAN = HUMAN_STATUS
export const REGISTER_COLORS = REGISTER_BASE_COLOR
