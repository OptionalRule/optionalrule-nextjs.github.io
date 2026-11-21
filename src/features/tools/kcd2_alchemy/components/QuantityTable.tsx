import type { PotionQuantity } from '../types'

type YieldKey = 'base' | 'withSecretOfMatterI' | 'withSecretOfMatterII' | 'withBothSecrets'

const YIELD_ROWS: Array<{ key: YieldKey; label: string; secretOfSecretsLabel: string }> = [
  { key: 'base', label: 'Base', secretOfSecretsLabel: 'Secret of Secrets' },
  { key: 'withSecretOfMatterI', label: 'Secret of Matter I', secretOfSecretsLabel: 'Secret of Secrets + Matter I' },
  { key: 'withSecretOfMatterII', label: 'Secret of Matter II', secretOfSecretsLabel: 'Secret of Secrets + Matter II' },
  { key: 'withBothSecrets', label: 'Both Secrets', secretOfSecretsLabel: 'Secret of Secrets + Both Secrets' },
]

export function QuantityTable({ quantity }: { quantity: PotionQuantity }) {
  const secretOfSecrets = quantity.withSecretOfSecrets
  const rows: Array<{ label: string; value: number }> = YIELD_ROWS.map(({ key, label }) => ({
    label,
    value: quantity[key],
  }))

  if (secretOfSecrets) {
    for (const { key, secretOfSecretsLabel } of YIELD_ROWS) {
      const value = secretOfSecrets[key]
      if (typeof value === 'number') {
        rows.push({ label: secretOfSecretsLabel, value })
      }
    }
  }

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
    </div>
  )
}
