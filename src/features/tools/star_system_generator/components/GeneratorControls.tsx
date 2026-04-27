'use client'

import type { GenerationOptions } from '../types'

interface GeneratorControlsProps {
  options: GenerationOptions
  onChange: (next: Partial<GenerationOptions>) => void
}

export function GeneratorControls({ options, onChange }: GeneratorControlsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SelectControl
        label="Distribution"
        value={options.distribution}
        onChange={(distribution) => onChange({ distribution: distribution as GenerationOptions['distribution'] })}
        options={[
          ['frontier', 'Reachable frontier'],
          ['realistic', 'Realistic local-ish'],
        ]}
      />
      <SelectControl
        label="Tone"
        value={options.tone}
        onChange={(tone) => onChange({ tone: tone as GenerationOptions['tone'] })}
        options={[
          ['balanced', 'Balanced'],
          ['astronomy', 'Astronomy-forward'],
          ['cinematic', 'Cinematic'],
        ]}
      />
      <SelectControl
        label="GU Intensity"
        value={options.gu}
        onChange={(gu) => onChange({ gu: gu as GenerationOptions['gu'] })}
        options={[
          ['normal', 'Normal'],
          ['low', 'Low'],
          ['high', 'High'],
          ['fracture', 'Fracture likely'],
        ]}
      />
      <SelectControl
        label="Settlements"
        value={options.settlements}
        onChange={(settlements) => onChange({ settlements: settlements as GenerationOptions['settlements'] })}
        options={[
          ['normal', 'Normal'],
          ['sparse', 'Sparse'],
          ['crowded', 'Crowded'],
          ['hub', 'Campaign hub'],
        ]}
      />
    </div>
  )
}

function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}
