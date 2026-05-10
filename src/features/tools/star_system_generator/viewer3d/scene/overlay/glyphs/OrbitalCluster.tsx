import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function OrbitalCluster(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <rect x={20} y={20} width={8} height={8} strokeWidth={1.5} />
      <line x1={22} y1={20} x2={22} y2={28} strokeWidth={0.5} />
      <line x1={26} y1={20} x2={26} y2={28} strokeWidth={0.5} />
      <ellipse cx={13} cy={24} rx={3.5} ry={2.5} strokeWidth={1.4} />
      <line x1={16.5} y1={24} x2={20} y2={24} strokeWidth={1.1} />
      <ellipse cx={24} cy={14} rx={2.5} ry={3} strokeWidth={1.4} />
      <line x1={24} y1={17} x2={24} y2={20} strokeWidth={1.1} />
      <line x1={28} y1={24} x2={33} y2={24} strokeWidth={1} />
      <rect x={33} y={21} width={6} height={6} strokeWidth={1.2} />
      <line x1={36} y1={21} x2={36} y2={27} strokeWidth={0.5} />
      <line x1={33} y1={24} x2={39} y2={24} strokeWidth={0.5} />
      <line x1={20} y1={20} x2={17} y2={16} strokeWidth={0.7} />
      <line x1={24} y1={11} x2={24} y2={8} strokeWidth={0.7} />
      <circle cx={24} cy={7.7} r={0.6} fill="currentColor" />
    </BaseGlyph>
  )
}
