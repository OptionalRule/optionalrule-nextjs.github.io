'use client'

import { useEffect, useCallback } from 'react'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    },
    [onCancel],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        className="max-w-sm w-full rounded-lg border border-game-retro-amber bg-[#111a1f] p-6 shadow-[0_0_20px_rgba(0,255,170,0.35)] font-mono text-foreground"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="confirm-modal-title"
          className="text-xl font-bold text-game-neon-green drop-shadow-[0_0_6px_rgba(0,255,150,0.6)]"
        >
          {title}
        </h2>
        <p
          id="confirm-modal-message"
          className="mt-4 text-sm text-muted-foreground"
        >
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded border border-border px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:border-game-retro-amber hover:text-foreground"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded border border-game-neon-green bg-game-neon-green/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-game-neon-green shadow-[0_0_10px_rgba(0,255,150,0.45)] transition-transform hover:scale-105 hover:bg-game-neon-green/20"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
