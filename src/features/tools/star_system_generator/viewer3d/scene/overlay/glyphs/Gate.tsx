import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function Gate(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <circle cx={24} cy={24} r={17} strokeWidth={1.6} />
      <circle cx={24} cy={24} r={9} strokeWidth={1.2} strokeDasharray="2 1.5" />
      <line x1={24} y1={7} x2={24} y2={2} strokeWidth={1.4} />
      <line x1={41} y1={24} x2={46} y2={24} strokeWidth={1.4} />
      <line x1={24} y1={41} x2={24} y2={46} strokeWidth={1.4} />
      <line x1={7} y1={24} x2={2} y2={24} strokeWidth={1.4} />
      <circle cx={24} cy={7} r={1.4} fill="currentColor" />
      <circle cx={41} cy={24} r={1.4} fill="currentColor" />
      <circle cx={24} cy={41} r={1.4} fill="currentColor" />
      <circle cx={7} cy={24} r={1.4} fill="currentColor" />
      <line x1={36} y1={12} x2={33.5} y2={14.5} strokeWidth={0.8} />
      <line x1={12} y1={12} x2={14.5} y2={14.5} strokeWidth={0.8} />
      <line x1={36} y1={36} x2={33.5} y2={33.5} strokeWidth={0.8} />
      <line x1={12} y1={36} x2={14.5} y2={33.5} strokeWidth={0.8} />
      <circle cx={24} cy={24} r={1.5} fill="currentColor" />
    </BaseGlyph>
  )
}
