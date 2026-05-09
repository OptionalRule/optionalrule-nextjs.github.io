'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useLayers } from './ViewerContext'

export interface ViewerModalProps {
  title: string
  onClose: () => void
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function ViewerModal({ title, onClose, header, footer, children }: ViewerModalProps) {
  const titleId = useId()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { toggleLayer } = useLayers()

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === '1') {
        e.preventDefault()
        toggleLayer('physical')
        return
      }
      if (e.key === '2') {
        e.preventDefault()
        toggleLayer('gu')
        return
      }
      if (e.key === '3') {
        e.preventDefault()
        toggleLayer('human')
        return
      }
      if (e.key !== 'Tab' || !containerRef.current) return
      const focusables = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [onClose, toggleLayer])

  useEffect(() => {
    const focusables = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
    focusables?.[0]?.focus()
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[200] flex flex-col bg-[#02040a]/95"
    >
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2">
        <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
        <div className="flex shrink-0 items-center gap-3">
          {header}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--accent)]/40 bg-[var(--accent-light)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Close 3D viewer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Close</span>
            <span aria-hidden="true" className="ml-1 hidden rounded border border-[var(--accent)]/40 px-1 py-px font-mono text-[10px] tracking-normal sm:inline">esc</span>
          </button>
        </div>
      </header>
      <div className="relative flex flex-1 overflow-hidden">
        {children}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[#0f141c]/85 text-[var(--accent)] shadow-lg backdrop-blur transition-colors hover:bg-[var(--accent)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label="Close 3D viewer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {footer ? <footer className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-xs text-[var(--text-tertiary)]">{footer}</footer> : null}
    </div>,
    document.body,
  )
}
