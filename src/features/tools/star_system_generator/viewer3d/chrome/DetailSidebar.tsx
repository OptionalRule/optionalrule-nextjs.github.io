'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSelectionActions, useSelectionState } from './ViewerContext'

export interface DetailSidebarProps {
  children: ReactNode
}

export function DetailSidebar({ children }: DetailSidebarProps) {
  const { selection } = useSelectionState()
  const { select } = useSelectionActions()
  const open = selection !== null

  return (
    <aside
      role="region"
      aria-label="Body detail"
      aria-hidden={!open}
      className={`flex h-full shrink-0 flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--card)] transition-[width] duration-200 ease-out ${
        open ? 'w-[360px]' : 'w-0'
      }`}
    >
      {open ? (
        <>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              Detail
            </span>
            <button
              type="button"
              onClick={() => select(null)}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--card-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Close detail"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">{children}</div>
        </>
      ) : null}
    </aside>
  )
}
