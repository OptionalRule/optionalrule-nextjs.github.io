import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function SurfaceOutpost(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <path d="M3 38 Q24 32 45 38" strokeWidth={1.4} />
      <path d="M14 36 L14 28 Q14 22 20 22 Q26 22 26 28 L26 36 Z" strokeWidth={1.5} />
      <line x1={14} y1={28} x2={26} y2={28} strokeWidth={0.9} />
      <line x1={20} y1={22} x2={20} y2={14} strokeWidth={1.1} />
      <line x1={20} y1={14} x2={23} y2={14} strokeWidth={0.9} />
      <circle cx={23} cy={14} r={0.8} fill="currentColor" />
      <path d="M16 36 Q18 36 18 33" strokeWidth={0.7} />
      <path d="M22 36 Q24 36 24 33" strokeWidth={0.7} />
      <path d="M30 36 Q30 30 33 30 Q36 30 36 36 Z" strokeWidth={1.4} />
      <line x1={30} y1={33} x2={36} y2={33} strokeWidth={0.7} />
      <line x1={33} y1={30} x2={33} y2={26} strokeWidth={0.8} />
      <path d="M9 36 L9 33 L11 33 L11 36" strokeWidth={1.2} />
    </BaseGlyph>
  )
}
