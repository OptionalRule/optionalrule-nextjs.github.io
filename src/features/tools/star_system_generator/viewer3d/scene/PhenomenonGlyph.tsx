'use client'

import type { PhenomenonMarker } from '../types'
import { useViewerContext } from '../chrome/ViewerContext'

export function PhenomenonGlyph({ phenomenon }: { phenomenon: PhenomenonMarker }) {
  const { layers, hover, select } = useViewerContext()
  if (!layers.gu) return null
  return (
    <mesh
      position={phenomenon.position}
      onPointerOver={(e) => { e.stopPropagation(); hover({ kind: 'phenomenon', id: phenomenon.id }); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e) => { e.stopPropagation(); hover(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); select({ kind: 'phenomenon', id: phenomenon.id }) }}
    >
      <icosahedronGeometry args={[1.6, 0]} />
      <meshBasicMaterial color="#a880ff" transparent opacity={0.8} toneMapped={false} />
    </mesh>
  )
}
