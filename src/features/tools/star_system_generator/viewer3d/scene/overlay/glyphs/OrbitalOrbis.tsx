import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function OrbitalOrbis(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <ellipse cx={24} cy={24} rx={20} ry={3.5} strokeWidth={1.6} />
      <ellipse cx={24} cy={24} rx={14} ry={2.2} strokeWidth={0.9} strokeDasharray="0.5 1.5" />
      <line x1={24} y1={6} x2={24} y2={42} strokeWidth={1.6} />
      <ellipse cx={24} cy={6} rx={5} ry={1.4} strokeWidth={1.2} />
      <ellipse cx={24} cy={42} rx={5} ry={1.4} strokeWidth={1.2} />
      <rect x={22} y={20.5} width={4} height={7} strokeWidth={1.3} />
      <circle cx={24} cy={24} r={0.9} fill="currentColor" />
      <line x1={9} y1={24} x2={6} y2={24} strokeWidth={0.7} />
      <line x1={39} y1={24} x2={42} y2={24} strokeWidth={0.7} />
    </BaseGlyph>
  )
}
