'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Shuffle } from 'lucide-react'
import type { GenerationOptions } from '../types'
import { createNextRandomOptions } from '../hooks/useGeneratorQueryState'

interface SeedControlProps {
  options: GenerationOptions
  onChange: (next: Partial<GenerationOptions>) => void
}

export function SeedControl({ options, onChange }: SeedControlProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard?.writeText(window.location.href)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = window.setTimeout(() => setCopyStatus('idle'), 2200)
  }

  return (
    <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
        Seed
        <input
          value={options.seed}
          onChange={(event) => onChange({ seed: event.target.value })}
          className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 font-mono text-sm text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          spellCheck={false}
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange({ seed: createNextRandomOptions(options).seed })}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card-elevated)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
        >
          <Shuffle className="h-4 w-4" />
          Random
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card-elevated)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
        >
          <Copy className="h-4 w-4" />
          Copy Link
        </button>
      </div>
      {copyStatus !== 'idle' ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute right-0 top-full z-20 mt-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] shadow-lg"
        >
          {copyStatus === 'copied' ? 'Link copied' : 'Could not copy link'}
        </div>
      ) : null}
    </div>
  )
}
