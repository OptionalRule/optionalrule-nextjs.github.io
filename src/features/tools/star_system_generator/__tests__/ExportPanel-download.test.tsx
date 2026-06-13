import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExportPanel } from '../components/ExportPanel'
import { generateSystem } from '../lib/generator'

const system = generateSystem({
  seed: '7f3a9c2e41b8d09a',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
})

describe('ExportPanel download', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('appends the temporary anchor to the DOM and removes it after click', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')
    render(<ExportPanel system={system} />)
    await userEvent.click(screen.getByRole('button', { name: 'Show exports' }))
    await userEvent.click(screen.getByRole('button', { name: 'Download Markdown' }))
    const appendedAnchor = appendSpy.mock.calls
      .map(c => c[0])
      .find((n): n is HTMLAnchorElement => n instanceof HTMLAnchorElement && n.download.endsWith('.md'))
    expect(appendedAnchor).toBeTruthy()
    expect(removeSpy.mock.calls.map(c => c[0])).toContain(appendedAnchor)
  })
})
