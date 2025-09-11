"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastType = 'info' | 'success' | 'error'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, durationMs?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const show = useCallback((message: string, type: ToastType = 'info', durationMs = 2600) => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev, { id, type, message }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, durationMs)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`min-w-[220px] max-w-[320px] text-xs px-3 py-2 rounded-md shadow-lg border transition-opacity
              bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]`}
          >
            <span className={t.type === 'success' ? 'text-[var(--success)]' : t.type === 'error' ? 'text-[var(--error)]' : 'text-[var(--info)]'}>
              {t.type === 'success' ? '✔ ' : t.type === 'error' ? '⚠ ' : 'ℹ '}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) return { show: (_m: string) => {} }
  return ctx
}

