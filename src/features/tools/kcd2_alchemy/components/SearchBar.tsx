'use client'

import { useEffect, useMemo, useState, useId } from 'react'

export interface SearchBarProps {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search potions…' }: SearchBarProps) {
  const [text, setText] = useState(value)
  const inputId = useId()

  useEffect(() => {
    setText(value)
  }, [value])

  // Debounce local value to reduce URL updates / filtering churn
  useEffect(() => {
    const id = setTimeout(() => onChange(text), 300)
    return () => clearTimeout(id)
  }, [text, onChange])

  const inputProps = useMemo(
    () => ({
      value: text,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value),
      placeholder,
      className:
        'block w-full border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] pr-9 pl-3 py-2',
    }),
    [text, placeholder],
  )

  return (
    <div className="w-full relative">
      <label htmlFor={inputId} className="sr-only">Search potions</label>
      <input id={inputId} name="q" type="text" {...inputProps} />
      {text && (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-5 h-5 inline-flex items-center justify-center rounded border border-[var(--border)] text-[color-mix(in_oklab,var(--foreground)_80%,transparent)] hover:text-[var(--foreground)] bg-[var(--surfaceHover)] hover:bg-[var(--surface)] shadow-sm transition-colors"
          onClick={() => {
            setText('')
            onChange('')
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="w-3.5 h-3.5">
            <path
              fill="currentColor"
              d="M14.348 5.652a.8.8 0 0 0-1.132 0L10 8.868 6.784 5.652a.8.8 0 1 0-1.132 1.132L8.868 10l-3.216 3.216a.8.8 0 1 0 1.132 1.132L10 11.132l3.216 3.216a.8.8 0 0 0 1.132-1.132L11.132 10l3.216-3.216a.8.8 0 0 0 0-1.132z"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
