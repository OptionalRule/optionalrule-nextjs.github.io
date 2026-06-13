import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SeedControl } from '../components/SeedControl'
import type { GenerationOptions } from '../types'

const options: GenerationOptions = {
  seed: 'abc123',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('SeedControl seed input debounce', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('does not propagate seed edits until the debounce window elapses', () => {
    const onChange = vi.fn()
    render(<SeedControl options={options} onChange={onChange} />)
    const input = screen.getByLabelText('Seed')
    fireEvent.change(input, { target: { value: 'deadbeef' } })
    expect(onChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(350)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ seed: 'deadbeef' })
  })

  it('collapses rapid keystrokes into one commit', () => {
    const onChange = vi.fn()
    render(<SeedControl options={options} onChange={onChange} />)
    const input = screen.getByLabelText('Seed')
    fireEvent.change(input, { target: { value: 'd' } })
    vi.advanceTimersByTime(100)
    fireEvent.change(input, { target: { value: 'de' } })
    vi.advanceTimersByTime(100)
    fireEvent.change(input, { target: { value: 'dead' } })
    vi.advanceTimersByTime(350)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ seed: 'dead' })
  })
})
