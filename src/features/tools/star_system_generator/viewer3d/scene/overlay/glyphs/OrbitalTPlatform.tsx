import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function OrbitalTPlatform(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <line x1={8} y1={24} x2={40} y2={24} strokeWidth={1.6} />
      <line x1={24} y1={14} x2={24} y2={36} strokeWidth={1.6} />
      <rect x={20} y={14} width={8} height={6} strokeWidth={1.4} />
      <line x1={22} y1={14} x2={22} y2={20} strokeWidth={0.6} />
      <line x1={26} y1={14} x2={26} y2={20} strokeWidth={0.6} />
      <rect x={32} y={22} width={6} height={4} strokeWidth={1.3} />
      <rect x={6} y={20} width={2} height={8} strokeWidth={1.1} />
      <line x1={7} y1={20} x2={7} y2={28} strokeWidth={0.5} />
      <line x1={24} y1={14} x2={24} y2={9} strokeWidth={0.9} />
      <circle cx={24} cy={8.8} r={0.7} fill="currentColor" />
      <line x1={24} y1={36} x2={24} y2={40} strokeWidth={0.9} />
    </BaseGlyph>
  )
}
