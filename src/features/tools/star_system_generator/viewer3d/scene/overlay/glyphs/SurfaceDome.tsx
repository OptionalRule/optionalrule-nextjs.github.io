import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function SurfaceDome(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <path d="M3 38 Q24 33 45 38" strokeWidth={1.4} />
      <path d="M8 36 L8 24 Q8 14 22 14 Q36 14 36 24 L36 36 Z" strokeWidth={1.6} />
      <line x1={8} y1={24} x2={36} y2={24} strokeWidth={0.9} />
      <path d="M14 24 Q22 16 30 24" strokeWidth={0.7} />
      <line x1={14} y1={24} x2={14} y2={36} strokeWidth={0.6} />
      <line x1={22} y1={14} x2={22} y2={36} strokeWidth={0.6} />
      <line x1={30} y1={24} x2={30} y2={36} strokeWidth={0.6} />
      <line x1={22} y1={14} x2={22} y2={8} strokeWidth={1.1} />
      <circle cx={22} cy={7.5} r={0.9} fill="currentColor" />
      <path d="M38 36 L38 31 Q38 27 41 27 Q44 27 44 31 L44 36 Z" strokeWidth={1.3} />
      <line x1={38} y1={31} x2={44} y2={31} strokeWidth={0.6} />
      <rect x={36} y={33.5} width={2} height={2.5} strokeWidth={1} />
    </BaseGlyph>
  )
}
