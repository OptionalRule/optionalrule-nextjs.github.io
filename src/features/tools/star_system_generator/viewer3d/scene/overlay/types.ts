import type { ComponentType, SVGProps } from 'react'

export type GlyphId =
  | 'A1'
  | 'A2'
  | 'A3'
  | 'BR'
  | 'DR'
  | 'B1'
  | 'B2'
  | 'B3'
  | 'B4'
  | 'B5'
  | 'B6'
  | 'B7'
  | 'GT'
  | 'RU'
  | 'PH'
  | 'HZ'
  | 'GU'

export type GlyphRegister = 'human' | 'gate' | 'ruin' | 'phenomenon' | 'hazard' | 'gu'

export type GlyphStatus = 'active' | 'abandoned' | 'automated'

export type PopulationTier = 'small' | 'medium' | 'large'

export interface GlyphProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number
  dashed?: boolean
}

export type GlyphComponent = ComponentType<GlyphProps>

export interface GlyphMeta {
  id: GlyphId
  name: string
  register: GlyphRegister
  description: string
}
