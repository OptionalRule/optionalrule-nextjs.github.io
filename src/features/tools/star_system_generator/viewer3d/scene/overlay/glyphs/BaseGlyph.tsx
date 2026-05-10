import type { ReactNode } from 'react'
import type { GlyphProps } from '../types'

export interface BaseGlyphProps extends GlyphProps {
  viewBox?: string
  children: ReactNode
}

export function BaseGlyph({
  size = 48,
  dashed = false,
  viewBox = '0 0 48 48',
  children,
  ...rest
}: BaseGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? '3 2.5' : undefined}
      {...rest}
    >
      {children}
    </svg>
  )
}
