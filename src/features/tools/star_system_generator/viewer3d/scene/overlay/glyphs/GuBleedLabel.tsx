import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function GuBleedLabel(props: GlyphProps) {
  return (
    <BaseGlyph viewBox="0 0 38 38" {...props}>
      <circle cx={14} cy={19} r={7} strokeWidth={1.4} />
      <circle cx={24} cy={19} r={7} strokeWidth={1.4} />
    </BaseGlyph>
  )
}
