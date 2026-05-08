'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Orbit } from 'lucide-react'
import type { GeneratedSystem } from '../types'

const SystemViewer3DModal = dynamic(() => import('../viewer3d'), {
  ssr: false,
  loading: () => (
    <div
      role="dialog"
      aria-label="3D system viewer loading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 text-[var(--text-secondary)]"
    >
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-6 py-4 text-sm">
        Loading 3D viewer…
      </div>
    </div>
  ),
})

export interface SystemViewer3DButtonProps {
  system: GeneratedSystem
  className?: string
}

export function SystemViewer3DButton({ system, className }: SystemViewer3DButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-md border border-[var(--accent)]/40 bg-[var(--accent-light)] px-3 py-1.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${className ?? ''}`}
        aria-label="Open 3D viewer"
      >
        <Orbit className="h-4 w-4" aria-hidden="true" />
        Open 3D viewer
      </button>
      {open ? <SystemViewer3DModal system={system} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
