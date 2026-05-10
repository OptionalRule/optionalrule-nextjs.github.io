import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function SurfaceCity(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <path d="M3 38 Q24 32 45 38" strokeWidth={1.4} />
      <rect x={9} y={20} width={5} height={16} strokeWidth={1.5} />
      <line x1={9} y1={24} x2={14} y2={24} strokeWidth={0.7} />
      <line x1={9} y1={28} x2={14} y2={28} strokeWidth={0.7} />
      <line x1={9} y1={32} x2={14} y2={32} strokeWidth={0.7} />
      <line x1={11.5} y1={20} x2={11.5} y2={14} strokeWidth={1} />
      <circle cx={11.5} cy={13.5} r={0.8} fill="currentColor" />
      <path d="M17 36 L17 28 Q17 23 22 23 Q27 23 27 28 L27 36 Z" strokeWidth={1.5} />
      <line x1={17} y1={29} x2={27} y2={29} strokeWidth={0.9} />
      <rect x={30} y={24} width={4} height={13} strokeWidth={1.5} />
      <line x1={32} y1={24} x2={32} y2={20} strokeWidth={0.9} />
      <path d="M32 20 Q34 19 35 17" strokeWidth={0.8} />
      <rect x={37} y={30} width={5} height={7} strokeWidth={1.4} />
      <line x1={37} y1={33} x2={42} y2={33} strokeWidth={0.7} />
    </BaseGlyph>
  )
}
