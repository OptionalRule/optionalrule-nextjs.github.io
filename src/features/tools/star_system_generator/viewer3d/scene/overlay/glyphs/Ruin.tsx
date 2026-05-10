import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function Ruin(props: GlyphProps) {
  return (
    <BaseGlyph {...props}>
      <line x1={4} y1={38} x2={44} y2={38} strokeWidth={1.3} />
      <path d="M11 38 L11 19 L19 19" strokeWidth={1.5} />
      <path d="M19 19 L19 14 L25 14 L25 22" strokeWidth={1.5} strokeDasharray="3 2" />
      <path d="M25 22 L29 22 L29 38" strokeWidth={1.5} />
      <path d="M11 19 L13 17 L15 21 L17 18" strokeWidth={1.2} />
      <line x1={13} y1={38} x2={13} y2={34} strokeWidth={0.8} />
      <line x1={17} y1={38} x2={17} y2={32} strokeWidth={0.8} />
      <line x1={22} y1={38} x2={22} y2={34} strokeWidth={0.8} />
      <line x1={27} y1={38} x2={27} y2={32} strokeWidth={0.8} />
      <path d="M33 38 L33 32 L37 32 L37 35 L40 35 L40 38" strokeWidth={1.4} />
      <line x1={35} y1={32} x2={36} y2={29} strokeWidth={0.9} />
      <circle cx={32} cy={37.5} r={0.6} fill="currentColor" />
      <circle cx={42} cy={37.5} r={0.6} fill="currentColor" />
    </BaseGlyph>
  )
}
