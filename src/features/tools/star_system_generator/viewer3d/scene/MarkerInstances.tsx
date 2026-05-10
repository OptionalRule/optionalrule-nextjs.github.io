'use client'

import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { PhenomenonMarker, RuinMarker, SceneVec3 } from '../types'
import { useLayers, useSelectionActions } from '../chrome/ViewerContext'
import { phenomenonGeometry, ruinGeometry, ruinMaterial } from './renderAssets'

function setMarkerMatrices(
  mesh: THREE.InstancedMesh,
  markers: ReadonlyArray<{ position: SceneVec3 }>,
  scale: number | ((index: number) => number),
  dummy: THREE.Object3D,
) {
  markers.forEach((marker, index) => {
    dummy.position.set(marker.position[0], marker.position[1], marker.position[2])
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(typeof scale === 'number' ? scale : scale(index))
    dummy.updateMatrix()
    mesh.setMatrixAt(index, dummy.matrix)
  })
  mesh.instanceMatrix.needsUpdate = true
}

function markerIdFromEvent<T extends { id: string }, E extends Event>(
  event: ThreeEvent<E>,
  markers: ReadonlyArray<T>,
): string | undefined {
  return typeof event.instanceId === 'number' ? markers[event.instanceId]?.id : undefined
}

export function PhenomenonGlyphs({ phenomena }: { phenomena: PhenomenonMarker[] }) {
  const { layers } = useLayers()
  if (!layers.gu || phenomena.length === 0) return null

  return (
    <group>
      {phenomena.map((phenomenon) => (
        <PhenomenonGlyph key={phenomenon.id} phenomenon={phenomenon} />
      ))}
    </group>
  )
}

function PhenomenonGlyph({ phenomenon }: { phenomenon: PhenomenonMarker }) {
  const { hover, select } = useSelectionActions()
  const coreMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: phenomenon.color,
    transparent: true,
    opacity: 0.96,
    toneMapped: false,
  }), [phenomenon.color])
  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: phenomenon.glowColor,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), [phenomenon.glowColor])
  const haloMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: phenomenon.glowColor,
    transparent: true,
    opacity: 0.055,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), [phenomenon.glowColor])

  useEffect(() => () => {
    coreMaterial.dispose()
    glowMaterial.dispose()
    haloMaterial.dispose()
  }, [coreMaterial, glowMaterial, haloMaterial])

  return (
    <group
      position={phenomenon.position}
      onPointerOver={(e) => {
        e.stopPropagation()
        hover({ kind: 'phenomenon', id: phenomenon.id })
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        hover(null)
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        select({ kind: 'phenomenon', id: phenomenon.id })
      }}
    >
      <mesh
        geometry={phenomenonGeometry}
        material={haloMaterial}
        scale={phenomenon.scale * 3.2}
        renderOrder={1}
        dispose={null}
      />
      <mesh
        geometry={phenomenonGeometry}
        material={glowMaterial}
        scale={phenomenon.scale * 1.9}
        renderOrder={2}
        dispose={null}
      />
      <mesh
        geometry={phenomenonGeometry}
        material={coreMaterial}
        scale={phenomenon.scale}
        renderOrder={3}
        dispose={null}
      />
    </group>
  )
}

export function RuinPins({ ruins }: { ruins: RuinMarker[] }) {
  const { layers } = useLayers()
  const { hover, select } = useSelectionActions()
  const meshRef = useRef<THREE.InstancedMesh | null>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useLayoutEffect(() => {
    if (!meshRef.current) return
    setMarkerMatrices(meshRef.current, ruins, (index) => ruins[index]?.attachedBeltId ? 0.72 : 0.95, dummy)
  }, [dummy, ruins])

  if (!layers.human || ruins.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[ruinGeometry, ruinMaterial, ruins.length]}
      dispose={null}
      onPointerOver={(e) => {
        e.stopPropagation()
        const id = markerIdFromEvent(e, ruins)
        if (id) hover({ kind: 'ruin', id })
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        hover(null)
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        const id = markerIdFromEvent(e, ruins)
        if (id) select({ kind: 'ruin', id })
      }}
    />
  )
}
