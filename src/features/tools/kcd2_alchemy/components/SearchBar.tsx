'use client'

import { useEffect, useMemo, useState } from 'react'

export interface SearchBarProps {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search potions…' }: SearchBarProps) {
  const [text, setText] = useState(value)

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
        'block w-full border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] px-3 py-2',
    }),
    [text, placeholder],
  )

  return (
    <div className="w-full">
      <input type="text" aria-label="Search potions" {...inputProps} />
    </div>
  )
}

