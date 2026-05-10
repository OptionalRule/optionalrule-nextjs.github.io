import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function HazardLabel(props: GlyphProps) {
  return (
    <BaseGlyph viewBox="0 0 38 38" {...props}>
      <polygon points="19,7 31,29 7,29" strokeWidth={1.6} />
      <line x1={19} y1={14} x2={19} y2={23} strokeWidth={1.7} />
      <circle cx={19} cy={26} r={1.2} fill="currentColor" />
    </BaseGlyph>
  )
}
