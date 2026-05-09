'use client'

import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { PhenomenonMarker, RuinMarker, SceneVec3 } from '../types'
import { useLayers, useSelectionActions } from '../chrome/ViewerContext'
import { phenomenonGeometry, phenomenonMaterial, ruinGeometry, ruinMaterial } from './renderAssets'

function setMarkerMatrices(
  mesh: THREE.InstancedMesh,
  markers: ReadonlyArray<{ position: SceneVec3 }>,
  scale: number,
  dummy: THREE.Object3D,
) {
  markers.forEach((marker, index) => {
    dummy.position.set(marker.position[0], marker.position[1], marker.position[2])
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(scale)
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
  const { hover, select } = useSelectionActions()
  const meshRef = useRef<THREE.InstancedMesh | null>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useLayoutEffect(() => {
    if (!meshRef.current) return
    setMarkerMatrices(meshRef.current, phenomena, 1.6, dummy)
  }, [dummy, phenomena])

  if (!layers.gu || phenomena.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[phenomenonGeometry, phenomenonMaterial, phenomena.length]}
      dispose={null}
      onPointerOver={(e) => {
        e.stopPropagation()
        const id = markerIdFromEvent(e, phenomena)
        if (id) hover({ kind: 'phenomenon', id })
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        hover(null)
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        const id = markerIdFromEvent(e, phenomena)
        if (id) select({ kind: 'phenomenon', id })
      }}
    />
  )
}

export function RuinPins({ ruins }: { ruins: RuinMarker[] }) {
  const { layers } = useLayers()
  const meshRef = useRef<THREE.InstancedMesh | null>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useLayoutEffect(() => {
    if (!meshRef.current) return
    setMarkerMatrices(meshRef.current, ruins, 1.4, dummy)
  }, [dummy, ruins])

  if (!layers.human || ruins.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[ruinGeometry, ruinMaterial, ruins.length]}
      dispose={null}
    />
  )
}
