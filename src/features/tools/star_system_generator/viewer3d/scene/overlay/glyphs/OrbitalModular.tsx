import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function OrbitalModular(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <polygon points="20,18 28,18 30,22 30,26 28,30 20,30 18,26 18,22" strokeWidth={1.5} />
      <rect x={22} y={9} width={4} height={9} strokeWidth={1.3} />
      <line x1={23} y1={9} x2={23} y2={18} strokeWidth={0.5} />
      <line x1={25} y1={9} x2={25} y2={18} strokeWidth={0.5} />
      <ellipse cx={38} cy={24} rx={5} ry={2} strokeWidth={1.3} />
      <line x1={33} y1={24} x2={30} y2={24} strokeWidth={1.2} />
      <rect x={21} y={30} width={6} height={6} strokeWidth={1.3} />
      <line x1={18} y1={24} x2={13} y2={24} strokeWidth={1} />
      <rect x={6} y={20} width={7} height={8} strokeWidth={1.2} />
      <line x1={9.5} y1={20} x2={9.5} y2={28} strokeWidth={0.6} />
      <line x1={6} y1={24} x2={13} y2={24} strokeWidth={0.6} />
      <line x1={24} y1={9} x2={24} y2={4} strokeWidth={0.9} />
      <circle cx={24} cy={3.5} r={0.7} fill="currentColor" />
      <line x1={22} y1={36} x2={22} y2={40} strokeWidth={0.8} />
      <line x1={26} y1={36} x2={26} y2={40} strokeWidth={0.8} />
    </BaseGlyph>
  )
}
