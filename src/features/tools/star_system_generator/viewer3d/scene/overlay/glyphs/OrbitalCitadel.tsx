import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function OrbitalCitadel(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <polygon points="13,18 30,14 35,20 35,30 28,34 13,32" strokeWidth={1.6} />
      <line x1={20} y1={14.5} x2={18} y2={6} strokeWidth={1.2} />
      <line x1={26} y1={14} x2={28} y2={3} strokeWidth={1.2} />
      <line x1={30} y1={14} x2={33} y2={8} strokeWidth={1.1} />
      <circle cx={28} cy={2.8} r={0.8} fill="currentColor" />
      <circle cx={18} cy={6} r={0.7} fill="currentColor" />
      <rect x={18} y={32} width={6} height={5} strokeWidth={1.3} />
      <line x1={21} y1={37} x2={21} y2={42} strokeWidth={1} />
      <line x1={13} y1={18} x2={35} y2={20} strokeWidth={0.6} strokeDasharray="1 1" opacity={0.5} />
      <line x1={13} y1={32} x2={28} y2={34} strokeWidth={0.6} strokeDasharray="1 1" opacity={0.5} />
      <line x1={35} y1={25} x2={42} y2={25} strokeWidth={1} />
      <rect x={42} y={22} width={4} height={6} strokeWidth={1.2} />
    </BaseGlyph>
  )
}
