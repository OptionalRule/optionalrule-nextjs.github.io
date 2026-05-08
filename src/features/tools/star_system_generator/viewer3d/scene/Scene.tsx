'use client'

import type { SystemSceneGraph } from '../types'

export interface SceneProps {
  graph: SystemSceneGraph
}

export function Scene(_props: SceneProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#02040a] text-[var(--text-tertiary)]">
      <span className="text-xs uppercase tracking-[0.1em]">Canvas placeholder — Task 19</span>
    </div>
  )
}
