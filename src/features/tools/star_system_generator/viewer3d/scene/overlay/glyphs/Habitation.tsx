import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function Habitation(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <path d="M4 36 L44 36" strokeWidth={1.2} />
      <path d="M10 36 Q24 14 38 36" strokeWidth={1.8} />
      <line x1={16} y1={36} x2={16} y2={28} strokeWidth={0.9} />
      <line x1={24} y1={36} x2={24} y2={24} strokeWidth={0.9} />
      <line x1={32} y1={36} x2={32} y2={28} strokeWidth={0.9} />
      <line x1={16} y1={42} x2={16} y2={38} strokeWidth={0.7} />
      <line x1={24} y1={44} x2={24} y2={38} strokeWidth={0.7} />
      <line x1={32} y1={42} x2={32} y2={38} strokeWidth={0.7} />
      <circle cx={24} cy={11} r={1.1} fill="currentColor" />
    </BaseGlyph>
  )
}
