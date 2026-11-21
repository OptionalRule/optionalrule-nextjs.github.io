import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { decodeSeedLink } from '../lib/seedUrl'
import { useGeneratorQueryState } from '../hooks/useGeneratorQueryState'

vi.mock('../lib/generator', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/generator')>()),
  GENERATOR_VERSION: 3,
}))

describe('seed link version policy with a newer current version', () => {
  it('decodes a link without v as version 2', () => {
    expect(decodeSeedLink('?seed=abc123').generatorVersion).toBe(2)
  })

  it('keeps a supported older version', () => {
    expect(decodeSeedLink('?seed=abc123&v=2').generatorVersion).toBe(2)
  })

  it.each(['99', 'abc', ''])('falls back to the current version for v=%s', (v) => {
    expect(decodeSeedLink(`?seed=abc123&v=${v}`).generatorVersion).toBe(3)
  })

  it('keeps a pinned version until an edit adopts the current one', async () => {
    function Harness() {
      const [, setState, version] = useGeneratorQueryState()
      return (
        <div>
          <div data-testid="version">{version}</div>
          <button onClick={() => setState({ tone: 'cinematic' })}>edit</button>
        </div>
      )
    }
    window.history.replaceState(null, '', '/tools/star_system_generator/?seed=7f3a9c2e')
    render(<Harness />)
    expect(screen.getByTestId('version').textContent).toBe('2')
    await waitFor(() => expect(window.location.search).toBe('?seed=7f3a9c2e&v=2'))
    await userEvent.click(screen.getByText('edit'))
    expect(screen.getByTestId('version').textContent).toBe('3')
    await waitFor(() => expect(window.location.search).toBe('?seed=7f3a9c2e&tone=cinematic&v=3'))
  })
})
