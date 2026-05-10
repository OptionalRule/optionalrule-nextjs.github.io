import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function BeltRockBase(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <path d="M9 32 L7 24 L11 16 L19 13 L29 14 L36 19 L38 27 L34 35 L23 38 L13 36 Z" strokeWidth={1.5} />
      <path d="M14 22 Q16 20 18 22" strokeWidth={0.8} />
      <circle cx={28} cy={26} r={1.6} strokeWidth={0.8} />
      <circle cx={32} cy={30} r={0.9} strokeWidth={0.7} />
      <rect x={20} y={6} width={9} height={7} strokeWidth={1.4} />
      <line x1={22.5} y1={13} x2={20} y2={14} strokeWidth={0.9} />
      <line x1={26.5} y1={13} x2={29} y2={14} strokeWidth={0.9} />
      <line x1={22} y1={6} x2={22} y2={2} strokeWidth={1} />
      <line x1={27} y1={6} x2={27} y2={3} strokeWidth={1} />
      <circle cx={22} cy={2} r={0.7} fill="currentColor" />
      <line x1={24} y1={9} x2={26} y2={9} strokeWidth={0.7} />
    </BaseGlyph>
  )
}
