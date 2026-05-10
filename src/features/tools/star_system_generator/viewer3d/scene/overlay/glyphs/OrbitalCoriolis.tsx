import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function OrbitalCoriolis(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <polygon points="14,12 24,8 34,12 38,22 34,32 24,36 14,32 10,22" strokeWidth={1.6} />
      <line x1={14} y1={12} x2={14} y2={32} strokeWidth={0.7} strokeDasharray="1 1.5" opacity={0.6} />
      <line x1={34} y1={12} x2={34} y2={32} strokeWidth={0.7} strokeDasharray="1 1.5" opacity={0.6} />
      <line x1={10} y1={22} x2={38} y2={22} strokeWidth={0.7} strokeDasharray="1 1.5" opacity={0.6} />
      <rect x={20} y={20} width={8} height={4} strokeWidth={1.4} />
      <line x1={22} y1={22} x2={26} y2={22} strokeWidth={0.8} />
      <line x1={24} y1={8} x2={24} y2={3} strokeWidth={1} />
      <line x1={24} y1={36} x2={24} y2={42} strokeWidth={1} />
      <line x1={38} y1={22} x2={44} y2={22} strokeWidth={1} />
      <line x1={10} y1={22} x2={4} y2={22} strokeWidth={1} />
      <circle cx={24} cy={3} r={0.8} fill="currentColor" />
    </BaseGlyph>
  )
}
