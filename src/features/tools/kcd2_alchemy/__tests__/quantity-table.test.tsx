import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuantityTable } from '../components/QuantityTable'

describe('QuantityTable', () => {
  it('shows exact Secret of Secrets yields for each Secret of Matter combination', () => {
    render(
      <QuantityTable
        quantity={{
          base: 7,
          withSecretOfMatterI: 8,
          withSecretOfMatterII: 9,
          withBothSecrets: 10,
          withSecretOfSecrets: {
            base: 11,
            withSecretOfMatterI: 12,
            withSecretOfMatterII: 13,
            withBothSecrets: 14,
          },
        }}
      />,
    )

    expect(screen.queryByText('Varies')).toBeNull()
    expect(screen.getByText('Secret of Secrets').nextSibling?.textContent).toBe('11')
    expect(screen.getByText('Secret of Secrets + Matter I').nextSibling?.textContent).toBe('12')
    expect(screen.getByText('Secret of Secrets + Matter II').nextSibling?.textContent).toBe('13')
    expect(screen.getByText('Secret of Secrets + Both Secrets').nextSibling?.textContent).toBe('14')
  })

  it('omits Secret of Secrets rows when the recipe has none', () => {
    render(
      <QuantityTable
        quantity={{ base: 1, withSecretOfMatterI: 2, withSecretOfMatterII: 3, withBothSecrets: 4 }}
      />,
    )

    expect(screen.queryByText(/Secret of Secrets/)).toBeNull()
  })
})
