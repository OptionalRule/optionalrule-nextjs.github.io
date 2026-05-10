import type { GlyphProps } from '../types'
import { BaseGlyph } from './BaseGlyph'

export function Phenomenon(props: GlyphProps) {
  return (
    <BaseGlyph viewBox="0 0 38 38" {...props}>
      <path d="M19 6 L21.5 16.5 L32 19 L21.5 21.5 L19 32 L16.5 21.5 L6 19 L16.5 16.5 Z" strokeWidth={1.4} />
    </BaseGlyph>
  )
}
