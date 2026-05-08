'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

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
        window.dispatchEvent(new CustomEvent('viewer3d:toggle-layer', { detail: { layer: 'physical' } }))
        return
      }
      if (e.key === '2') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('viewer3d:toggle-layer', { detail: { layer: 'gu' } }))
        return
      }
      if (e.key === '3') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('viewer3d:toggle-layer', { detail: { layer: 'human' } }))
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
  }, [onClose])

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
      className="fixed inset-0 z-50 flex flex-col bg-[#02040a]/95"
    >
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2">
        <h2 id={titleId} className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
        <div className="flex items-center gap-3">
          {header}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--card-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Close 3D viewer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="relative flex flex-1 overflow-hidden">{children}</div>
      {footer ? <footer className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-xs text-[var(--text-tertiary)]">{footer}</footer> : null}
    </div>,
    document.body,
  )
}
