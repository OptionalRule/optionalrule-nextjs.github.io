import type { PotionQuantity } from '../types'

export function QuantityTable({ quantity }: { quantity: PotionQuantity }) {
  const rows: Array<{ label: string; value: number | string }> = [
    { label: 'Base', value: quantity.base },
    { label: 'Secret of Matter I', value: quantity.withSecretOfMatterI },
    { label: 'Secret of Matter II', value: quantity.withSecretOfMatterII },
    { label: 'Both Secrets', value: quantity.withBothSecrets },
  ]
  
  return (
    <div className="grid gap-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors">
          <span className="font-medium text-[var(--text-primary)]">
            {r.label}
          </span>
          <span className="px-2 py-1 rounded-md text-sm font-bold bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border)]">
            {r.value}
          </span>
        </div>
      ))}
      {quantity.withSecretOfSecrets && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors">
          <span className="font-medium text-[var(--text-primary)]">Secret of Secrets</span>
          <span className="px-2 py-1 rounded-md text-sm font-bold bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border)]">
            Varies
          </span>
        </div>
      )}
    </div>
  )
}

