import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function OrbitalGantry(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <line x1={24} y1={6} x2={24} y2={42} strokeWidth={1.6} />
      <ellipse cx={24} cy={13} rx={4} ry={1.5} strokeWidth={1.2} />
      <ellipse cx={24} cy={20} rx={9} ry={2.2} strokeWidth={1.4} />
      <ellipse cx={24} cy={28} rx={11} ry={2.6} strokeWidth={1.4} />
      <ellipse cx={24} cy={35} rx={6} ry={1.7} strokeWidth={1.2} />
      <line x1={24} y1={6} x2={24} y2={2} strokeWidth={0.9} />
      <circle cx={24} cy={1.8} r={0.8} fill="currentColor" />
      <line x1={33} y1={20} x2={39} y2={18} strokeWidth={0.9} />
      <line x1={15} y1={20} x2={9} y2={18} strokeWidth={0.9} />
      <line x1={35} y1={28} x2={42} y2={29} strokeWidth={0.9} />
      <line x1={13} y1={28} x2={6} y2={29} strokeWidth={0.9} />
      <rect x={22} y={42} width={4} height={3} strokeWidth={1.2} />
    </BaseGlyph>
  )
}
