'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useSelectionState } from '../chrome/ViewerContext'

export interface CameraRigProps {
  sceneRadius: number
}

export function CameraRig({ sceneRadius }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, sceneRadius * 0.35, sceneRadius * 0.95)
    camera.lookAt(0, 0, 0)
  }, [camera, sceneRadius])

  useEffect(() => {
    function handle() {
      if (!controlsRef.current) return
      const start = camera.position.clone()
      const target = new THREE.Vector3(0, sceneRadius * 0.35, sceneRadius * 0.95)
      const startTime = performance.now()
      const duration = 600

      function step(t: number) {
        const k = Math.min(1, (t - startTime) / duration)
        const eased = 1 - Math.pow(1 - k, 3)
        camera.position.lerpVectors(start, target, eased)
        camera.lookAt(0, 0, 0)
        controlsRef.current?.update()
        if (k < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
    window.addEventListener('viewer3d:frame-system', handle)
    return () => window.removeEventListener('viewer3d:frame-system', handle)
  }, [camera, sceneRadius])

  const { selection } = useSelectionState()

  useEffect(() => {
    if (!selection || selection.kind !== 'body') return
    const target = (window as Window & { __viewer3dBodyPositions?: Record<string, [number, number, number]> }).__viewer3dBodyPositions?.[selection.id]
    if (!target) return
    const targetPos = target
    const start = camera.position.clone()
    const desired = new THREE.Vector3(targetPos[0] * 1.6, sceneRadius * 0.18, targetPos[2] * 1.6)
    const startTime = performance.now()
    const duration = 800

    function step(t: number) {
      const k = Math.min(1, (t - startTime) / duration)
      const eased = 1 - Math.pow(1 - k, 3)
      camera.position.lerpVectors(start, desired, eased)
      camera.lookAt(targetPos[0], 0, targetPos[2])
      controlsRef.current?.update()
      if (k < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [selection, camera, sceneRadius])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={sceneRadius * 0.2}
      maxDistance={sceneRadius * 2.5}
      makeDefault
    />
  )
}
