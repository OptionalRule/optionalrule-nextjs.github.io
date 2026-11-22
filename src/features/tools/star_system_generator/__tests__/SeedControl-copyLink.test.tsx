import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SeedControl } from '../components/SeedControl'
import type { GenerationOptions } from '../types'

const options: GenerationOptions = {
  seed: 'abc123',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('SeedControl copy link', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('reports failure when the Clipboard API is unavailable', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
    render(<SeedControl options={options} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    expect(await screen.findByRole('status')).toHaveTextContent('Could not copy link')
  })

  it('reports success when the clipboard write resolves', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    render(<SeedControl options={options} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    expect(await screen.findByRole('status')).toHaveTextContent('Link copied')
    expect(writeText).toHaveBeenCalledWith(window.location.href)
  })
})
