import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function DriftHabitat(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <line x1={24} y1={20} x2={24} y2={14} strokeWidth={1.1} />
      <line x1={28} y1={24} x2={33} y2={24} strokeWidth={1.1} />
      <line x1={24} y1={28} x2={24} y2={34} strokeWidth={1.1} />
      <line x1={20} y1={24} x2={15} y2={24} strokeWidth={1.1} />
      <polygon points="24,18 28,21 28,27 24,30 20,27 20,21" strokeWidth={1.5} />
      <polygon points="24,8 27,10 27,14 24,16 21,14 21,10" strokeWidth={1.4} />
      <polygon points="35,18 38,20 38,24 35,26 32,24 32,20" strokeWidth={1.4} />
      <polygon points="24,32 27,34 27,38 24,40 21,38 21,34" strokeWidth={1.4} />
      <polygon points="13,18 16,20 16,24 13,26 10,24 10,20" strokeWidth={1.4} />
      <circle cx={24} cy={24} r={1} fill="currentColor" />
    </BaseGlyph>
  )
}
