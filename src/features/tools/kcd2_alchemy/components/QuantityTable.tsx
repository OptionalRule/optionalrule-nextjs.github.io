import type { PotionQuantity } from '../types'

export function QuantityTable({ quantity }: { quantity: PotionQuantity }) {
  const rows: Array<{ label: string; value: number | string }> = [
    { label: 'Base', value: quantity.base },
    { label: 'Secret of Matter I', value: quantity.withSecretOfMatterI },
    { label: 'Secret of Matter II', value: quantity.withSecretOfMatterII },
    { label: 'Both Secrets', value: quantity.withBothSecrets },
  ]
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[300px] text-sm border border-[var(--border)]">
        <thead className="bg-[var(--surface)]">
          <tr>
            <th className="text-left px-3 py-2 border-b border-[var(--border)]">Perk</th>
            <th className="text-left px-3 py-2 border-b border-[var(--border)]">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="odd:bg-[var(--surfaceHover)]">
              <td className="px-3 py-2 border-b border-[var(--border)]">{r.label}</td>
              <td className="px-3 py-2 border-b border-[var(--border)]">{r.value}</td>
            </tr>
          ))}
          {quantity.withSecretOfSecrets && (
            <tr>
              <td className="px-3 py-2 border-b border-[var(--border)]">Secret of Secrets</td>
              <td className="px-3 py-2 border-b border-[var(--border)]">Varies</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

