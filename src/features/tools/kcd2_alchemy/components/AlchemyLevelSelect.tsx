"use client"

export interface AlchemyLevelSelectProps {
  value: number
  onChange: (level: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
}

export function AlchemyLevelSelect({ value, onChange, min = 0, max = 20, size = 'md' }: AlchemyLevelSelectProps) {
  const options = [] as number[]
  for (let i = min; i <= max; i++) options.push(i)

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="alchemy-level" className={size === 'sm' ? 'text-xs text-[var(--muted-2)]' : 'text-sm text-[var(--muted-2)]'}>
        Alchemy Skill
      </label>
      <select
        id="alchemy-level"
        className={size === 'sm'
          ? 'text-xs border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] px-1.5 py-0.5 h-7'
          : 'text-sm border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] px-2 py-1 h-8'}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  )
}
